function DeploymentSyncManager(username, sessionId, serviceURL, domain, deploymentsService, progressUpdate) {
    this.username     = username;
    this.sessionId    = sessionId;
    this.serviceURL   = serviceURL;
    this.domain       = domain;
    this.deploymentsService = deploymentsService;
    this.startTime = null;
    this.structureMap = new DsAppModeMap();
    this.structureIds =[];
    this.progressUpdate = progressUpdate;
}

DeploymentSyncManager.prototype = {

    reset: function() {
        this.structureIds = [];
        this.structureMap = new DsAppModeMap();
    },

    start: function(progressUpdate) {
        const ctx = this;

        ctx.progressUpdate = progressUpdate;
        ctx.startTime = new Date();
        ctx.reset();

        let startTimeDsProcessing = null;

        return new Promise((resolve, reject) => {

            ctx.deploymentsService.dropOrphans().then(() => {
                ctx.progressUpdate();
                return MicroAppsRepo.getAll(this.username, this.domain);
            }).then(microApps => {
                ctx.structureMap.microApps = microApps;
                ctx.progressUpdate();
                if (microApps.length === 0) {
                    console.log('No micro apps found. Returning ok.');
                    ctx.done(resolve);
                    return;
                }

                const preparedRequests = ctx.buildDeploymentStatusRequestArray(microApps);
                return ctx.attachCreatedTimestamps(preparedRequests);
            }).then(statusRequests => {
                ctx.progressUpdate();
                return ctx.checkDeploymentStatus(statusRequests);
            }).then(deploymentStatus => {
                ctx.progressUpdate();
                const changedDeployments = ctx.processDeploymentStatuses(deploymentStatus);
                changedDeployments.forEach(dep => dep['sessionId'] = this.sessionId);
                return ctx.downloadAndSaveDeployments(changedDeployments);
            }).then(() => {
                ctx.progressUpdate();
                startTimeDsProcessing = new Date();
                ctx.structureIds = ctx.structureMap.getDsIds();
                return ctx.processDataStructures(ctx.structureIds);
            }).then(() => {
                const duration = new Date() - startTimeDsProcessing;
                console.log(`DeploymentSyncManager: ${([...new Set(ctx.structureIds)]).length} data structures processed in: ${duration / 1000}s.`);
                console.log("Deployments synced: OK");
                ctx.done(resolve);
            }).catch(err => {
                const errMsg = `DeploymentSyncManager: Deployment sync error`;
                console.error(errMsg, err);
                rLog.log({err: err}, errMsg, rLog.level.ERROR, [rLog.tag.SYNC]);
                reject('Failed to sync deployments!')
            });
        });
    },

    checkDeploymentStatus: function(reqDataArr) {
        console.log(`DeploymentSyncManager #checkDeploymentStatus reqDataArr: ${reqDataArr.length}`, reqDataArr);
        const ctx = this;

        return new Promise((resolve, reject) => {

            const requestData = {
                "sessionId": this.sessionId,
                "deployments": reqDataArr
            };

            const url = this.serviceURL + "Json/MicroApps/deployment/status";

            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(requestData),
                dataType: "json",
                timeout: 60 * 1000,
                success: function (data) {
                    ctx.progressUpdate();

                    if (data['succeeded'] && data['status'] === 200) {
                        resolve(data);
                    } else {
                        console.error(data);
                        rLog.log({
                            data: data
                        }, 'Deployments status verification unsuccessful ', rLog.level.ERROR, [rLog.tag.SYNC]);
                        reject('Deployments status verification unsuccessful');
                    }

                },
                error: function (xhr, ajaxOptions, errorThrown) {
                    console.error(errorThrown);

                    rLog.log({
                        textStatus: ajaxOptions,
                        errorThrown: errorThrown,
                        code: xhr.status,
                        url: url
                    }, 'Deployments status verification error', rLog.level.ERROR, [rLog.tag.SYNC]);
                    reject('Deployments status verification error.');
                }
            });
        });
    },

    buildDeploymentStatusRequestArray: function(microApps) {
        console.log(`DeploymentSyncManager #buildDeploymentStatusRequestArray microApps: ${microApps.length}`, microApps);

        const reqDataArr = [];

        for (let i = 0; i < microApps.length; i++) {
            const microApp = microApps[i];
            const appId = microApp["id"];
            const microAppModes = microApp['modes'];

            microAppModes.forEach(mode => {
                const reqData = {
                    "sessionId": this.sessionId,
                    "microAppId": appId,
                    "appModeId": mode
                };
                reqDataArr.push(reqData);
            });
        }

        return reqDataArr;
    },

    attachCreatedTimestamps: function(reqDataArr) {
        console.log(`DeploymentSyncManager #prepareFetchMicroAppsData prepareCreatedTimestamps: ${reqDataArr.length}`, reqDataArr);
        const ctx = this;

        console.time('attachCreatedTimestamps');

        return new Promise((resolve, reject) => {
            const appIds = reqDataArr.map(req => req.microAppId);

            ctx.deploymentsService.getCreatedTimestampsAllModes(appIds).then(result => {

                for (let i = 0; i < reqDataArr.length; i++) {
                    const req = reqDataArr[i];

                    if (!result[req.microAppId]) {
                        continue;
                    }

                    const timestamp = result[req.microAppId][req.appModeId];

                    if (timestamp) {
                        req['created'] = timestamp;
                    }

                }

                console.timeEnd('attachCreatedTimestamps');
                resolve(reqDataArr);

            }).catch(err => reject(err));
        });
    },

    downloadAndSaveDeployments: function(reqDataArr) {
        console.log(`DeploymentSyncManager #downloadAndSaveDeployments reqDataArr: ${reqDataArr.length}`, reqDataArr);
        const ctx = this;

        const url = this.serviceURL + "Json/MicroApps/deployments";

        let p = Promise.resolve();

        for (let i = 0; i < reqDataArr.length; i++) {

            const req = reqDataArr[i];

            p = p.then(() =>{
                const subText = `Downloading latest app updates</br>${i+1} of ${reqDataArr.length}`;
                ctx.progressUpdate(subText);
                return ctx.downloadDeployment(req, url);
            }).then(deploymentRes => {

                if (!deploymentRes.succeeded){
                    rLog.log({
                        url: url,
                        req: req,
                        deploymentRes: deploymentRes
                    }, 'Error downloading deployment', rLog.level.ERROR, [rLog.tag.SYNC]);
                    return Promise.reject(deploymentRes.error);
                }

                const formatted = ctx.formatDeploymentResponse(req, deploymentRes);
                return ctx.deploymentsService.saveAll(formatted);
            });
        }

        return p;
    },

    downloadDeployment: function(req, url) {
        console.log(`DeploymentSyncManager #dowloadDeployment req: ${req}, url: ${url}`, req);
        const ctx = this;

        return new Promise((resolve, reject) => {
            const reqData = {'data': JSON.stringify(req)};

            $.ajax({
                url: url,
                type: "GET",
                data: reqData,
                dataType: "json",
                timeout: 2 * 60 * 1000,
                success: function (data) {
                    ctx.progressUpdate();
                    resolve(data);
                },
                error: function (xhr, ajaxOptions, errorThrown) {
                    console.error(errorThrown);

                    rLog.log({
                        textStatus: ajaxOptions,
                        errorThrown: errorThrown,
                        code: xhr.status,
                        url: url,
                        reqData: reqData
                    }, 'Error fetching micro apps data.', rLog.level.ERROR, [rLog.tag.EXPLORER]);
                    reject('Error downloading microapps deployment data.');
                }
            });


        });
    },

    processDeploymentStatuses: function(deploymentsStatus) {
        console.log(`DeploymentSyncManager #processDeploymentStatuses deploymentsStatus:`, deploymentsStatus);

        const deployments = deploymentsStatus['deployments'];

        let i = deployments.length;

        while (i--) {

            const deployment = deployments[i];

            switch (deployment.status) {
                case 'UNCHANGED':
                    const dsIds = deployment['dataStructureIds'];
                    this.saveToStructureMap(dsIds, deployment.microAppId, deployment.appModeId);
                    deployments.splice(i, 1);
                    break;
                case 'MODIFIED':
                    delete deployment.created;
                    break;
                case 'NOT_FOUND':
                    deployments.splice(i, 1);
                    break;
                default:
                    console.error(`Deployment status unknown: ${deployment.status}`);
                    deployments.splice(i, 1);
            }
        }

        return deployments;
    },

    formatDeploymentResponse: function(appReq, appData) {
        const depArr = [];

        if (appData && appData['succeeded'] && appData['status'] === 200) {

            const deployment = appData["deployment"];
            // Removes 'Replacement Characters' (�)
            const decoded = deployment.replace(/\uFFFD/g, '');

            const appId   = appReq["microAppId"];
            const appMode = appReq["appModeId"];

            depArr.push({
                "deployment" : decoded,
                "appId"      : appId,
                "appModeId"  : appMode,
                "created"    : appData["created"],
                "settings"   : appData["settings"]
            });

            const dsIds = appData['dataStructuresIds'];
            this.saveToStructureMap(dsIds, appId, appMode);

            return depArr;
        }
    },

    processDataStructures: function(dsIds) {
        console.log(`DeploymentSyncManager: #processDataStructures dsIds: ${dsIds.length}`, dsIds);
        this.structureIds = [...new Set(this.structureIds)];
        return Promise.resolve();
    },

    saveToStructureMap: function (dsIds, appId, appMode) {
        dsIds.forEach(dsId => this.structureMap.save(dsId, appId, appMode));
    },

    done: function(callback) {
        const duration = new Date() - this.startTime;
        const msg = `Deployment sync SUCCESS (${duration / 1000}s)`;
        console.log(msg);
        rLog.log({}, msg, rLog.level.INFO, [rLog.tag.SYNC, rLog.tag.EXPLORER]);
        callback(this.structureMap);
    }
};
