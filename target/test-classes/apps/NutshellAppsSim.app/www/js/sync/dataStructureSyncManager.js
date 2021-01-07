function DataStructureSyncManager(username, domain, sessionId, microServiceUrl, dataStructureService) {
    this.username     = username;
    this.sessionId    = sessionId;
    this.domain       = domain;
    this.microServiceUrl   = microServiceUrl;
    this.dataStructureService = dataStructureService;
    this.progressUpdate = null;
    this.startTime = null;
}

DataStructureSyncManager.prototype = {

    sync: function(dsIds, progressUpdate) {
        console.log(`DataStructureSyncManager #sync dsIds: ${dsIds.length}`, dsIds);
        this.progressUpdate = progressUpdate;

        const ctx = this;
        ctx.startTime = new Date();
        let warnings = null;
        let formattedDataStructures = [];
        return new Promise((resolve, reject) => {

            this.download(dsIds).then((dsResponse) => {
                warnings = new AppSyncWarnings(dsResponse.warnings);
                formattedDataStructures = ctx.format(dsResponse.dataStructures);
                return ctx.trim();
            }).then(() => {
                return ctx.store(formattedDataStructures);
            }).then(() => {
                const duration = new Date() - ctx.startTime;
                const msg = `Data structures sync SUCCESS. (${duration / 1000}s)`;
                console.log(msg);
                rLog.log({}, msg, rLog.level.INFO, [rLog.tag.SYNC, rLog.tag.EXPLORER]);
                resolve(warnings);
            }).catch((err) => {
                const errMsg = `Data structure sync error!`;
                rLog.log({err: err}, errMsg, rLog.level.ERROR, [rLog.tag.SYNC]);
                reject(err);
            });

        });

    },

    download: function(dsIds) {
        console.log(`DataStructureSyncManager #download dsIds: ${dsIds.length}`, dsIds);

        const ctx = this;
        const url = ctx.microServiceUrl;

        const requestData = {
            "sessionId": ctx.sessionId,
            "domain": ctx.domain,
            "dsIds": dsIds
        };

        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(requestData),
                contentType: "application/json",
                dataType: "json",
                timeout: 2 * 60 * 1000,
                success: function (data) {
                    ctx.progressUpdate();

                    if (data['succeeded'] && data['status'] === 200) {
                        const res = {
                            dataStructures: data.dataStructures,
                            warnings: data.warnings
                        };

                        resolve(res);
                    } else {
                        console.error(data);
                        rLog.log({
                            data: data
                        }, 'Failed to retrieve compiled data structures', rLog.level.ERROR, [rLog.tag.SYNC]);
                        reject('Failed to retrieve compiled data structures');
                    }

                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.error(thrownError);
                    rLog.log({
                        textStatus: ajaxOptions,
                        errorThrown: thrownError,
                        code: xhr.status,
                        url: url,
                        requestData: requestData
                    }, 'Remote data structure compile error', rLog.level.ERROR, [rLog.tag.SYNC]);
                    reject('Remote data structure compile error');
                }
            });
        });
    },

    /**
     * Formats data structures response as received from the compile service.
     * @param response
     * @returns {Array} - Compiled data structures.
     */
    format: function(response) {
        console.log(`DataStructureSyncManager #format response:`, response);
        const dss = [];
        Object.keys(response).forEach(dsId => {
            const ds = response[dsId];
            dss.push({
                dsId: dsId,
                dataStructure: ds,
                timestamp: new Date().toISOString()
            });
        });

        console.log(`DataStructureSyncManager #format, found ${dss.length} compiled data structures.`, dss);
        return dss;
    },

    store: function(dataStructures) {
        console.log(`DataStructureSyncManager #store dataStructures: ${dataStructures.length}`, dataStructures);
        return this.dataStructureService.storeDataStructures(dataStructures);
    },

    trim: function() {
        console.log(`DataStructureSyncManager #trim`);
        return this.dataStructureService.removeAll();
    }
};
