const DeploymentsService = (function(){

    let _repo = null;
    let _user = null;
    let _domain = null;

    const init = function(repo, user, domain) {
        console.log(`DeploymentsService: #init user: ${user}, domain: ${domain}`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _repo = repo;
                _user = user;
                _domain = domain;
                res();
            } else {
                rej('Deployments Database not initialised!');
            }
        });
    };

    /**
     * Drops deployments which are no longer published to the user.
     * @param microApps
     */
    const dropOrphans = function() {
        console.log(`DeploymentsService: #_dropOrphans required apps:`);
        let microApps = null;
        return new Promise((res, rej) => {
            MicroAppsRepo.getAll(_user, _domain).then(apps => {
                microApps = apps;
                const keepIds = apps.map(app => app.id);
                return _repo.keepOnlyIds(keepIds, _user, _domain);
            }).then(() => {
                const promises = [];
                _repo.keepOnlyModesBulk(microApps, _user, _domain);
                return Promise.all(promises);
            }).then(() => {
                res();
            }).catch(reason => {
                console.error(`DeploymentsService: #_dropOrphans FAILED to drop orphan deployments.`);
                rej(reason);
            });
        });
    };

    /**
     * Returns available deployment creation date (if found)
     * @param apps
     * @private
     */
    const getCreated = function(id, mode) {
        console.log(`DeploymentsService: #_getCreated app ${id}, mode ${mode}`);
        return _repo.getCreatedForApp(id, mode, _user, _domain);
    };

    const _saveOne = function(id, mode, created, user, domain, deployment, settings) {
        console.log(`DeploymentsService: #_saveOne app id: ${id}, mode: ${mode}, created: ${created}, user: ${user}, domain: ${domain}`);
        return _repo.insertOrUpdate(id, mode, created, user, domain, encodeURI(deployment), settings);
    };

    const saveAll = function(deployments) {
        console.log(`DeploymentsService: #_saveAll deployments length: ${deployments ? deployments.length : deployments}`);
        const promises = [];

        deployments.forEach(dep => {
            promises.push(_saveOne(dep['appId'], dep['appModeId'], dep['created'], _user, _domain, dep['deployment'], dep['settings']));
        });

        return Promise.all(promises);
    };

    const getDeployment = function(id, mode) {
        console.log(`DeploymentsService: #_getDeployment id ${id}, mode ${mode}`);
        return new Promise((resolve, reject) => {
            _repo.getByIdMode(id, mode, _user, _domain).then(result => {
                if (result) {
                    let deployment = result['microAppDeploymentData'];
                    deployment = deployment.replace(/%EF%BF%BD/g, "");
                    deployment = decodeURI(deployment);
                    resolve(deployment);
                } else {
                    resolve(null);
                }
            }).catch(reason => {
                reject(reason);
            });
        });
    };

    const getAvailableModes = function(id) {
        console.log(`DeploymentsService #getAvailableModes id: ${id}`);

        return new Promise((resolve, reject) => {
           _repo.getById(id, _user, _domain, (success, deployments) => {
               if (success) {
                   const depModes = deployments.map(dep => dep.mode);
                   resolve(depModes);
               } else {
                   reject(`DeploymentsService error, could not get deployments with id ${id}`);
               }
           });
        });
    };

    const getAvailableCompatibleModes = function(id, osType) {
        console.log(`DeploymentsService#getAvailableCompatibleModes id: ${id}`);

        return new Promise((resolve, reject) => {
            _repo.getById(id, _user, _domain, (success, deployments) => {
                if (success) {
                    deployments = _filterByOsCompatibility(deployments, osType);
                    const depModes = deployments.map(dep => dep.mode);
                    resolve(depModes);
                } else {
                    reject(`DeploymentsService error, could not get deployments with id ${id}`);
                }
            });
        });
    };

    const _filterByOsCompatibility = function(deps, osType) {
        // To handle legacy deployments which might not have settings yet. Could be safe to remove in later versions.
        for (let dep of deps) {
            if (!dep.settings) {
                dep.settings = {'device-type': AppSettingsHelper.consts.deviceType.PHONE};
            }
        }

        return deps.filter(dep => AppSettingsHelper.isCompatible(osType, dep.settings['device-type']));
    };

    const getCreatedTimestampsAllModes = function(ids) {
        console.log(`DeploymentsService#_getCreatedTimestampsAllModes ids: ${ids}`);

        return new Promise((resolve, reject) => {

            _repo.getCreatedForAppsAllModes(ids, _user, _domain).then(result => {
                const retObj = {};

                result.forEach(app => {
                    if (!retObj[app.appId]) {
                        retObj[app.appId] = {};
                    }

                    retObj[app.appId][app.appModeId] = app.created;
                });

                resolve(retObj);

            }).catch(err => {
                reject(err);
            });

        });
    };

    const getByAppId = function(appId, shouldIncludeDeployments) {
        console.log(`DeploymentsService#getByAppId appIds: ${appId}, shouldIncludeDeployments: ${shouldIncludeDeployments}`);
        return getByAppIds([appId], shouldIncludeDeployments);
    };

    const getByAppIds = function(appIds, shouldIncludeDeployments) {
        console.log(`DeploymentsService#getByAppIds appIds: ${appIds}, shouldIncludeDeployments: ${shouldIncludeDeployments}`);

        if (shouldIncludeDeployments) {
            // TODO: 21/05/2020 TBI...
            throw new Error("Not yet implemented.")
        } else {
            return _repo.getByAppIds(appIds, _user, _domain);
        }
    };

    const hasCompatibleModes = function (id, osType) {
        return new Promise((resolve, reject) => {
            getAvailableCompatibleModes(id, osType).then(modes => {
                resolve(modes.length > 0);
            }).catch(err => {
                reject(err);
            })
        });
    }

    return {
        init,
        dropOrphans,
        getCreated,
        saveAll,
        checkLocal: getCreated,
        getDeployment,
        getAvailableModes,
        getAvailableCompatibleModes,
        hasCompatibleModes,
        getCreatedTimestampsAllModes,
        getByAppId,
        getByAppIds
    };

})();
