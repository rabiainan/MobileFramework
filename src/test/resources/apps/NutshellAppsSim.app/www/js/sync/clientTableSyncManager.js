/**
 * Manages synchronisation process of client table.
 */
const ClientTableSyncManager = (function() {

    let _tableService = null;
    let _dataStructureService = null;
    let _user = null;
    let _domain = null;
    let _sessionId = null;

    const _init = function (tableService, structureService, user, domain, session) {
        console.log(`ClientTableSyncManager #_init, tableService: ${tableService}, structureService: ${structureService}, user ${user}, domain: ${domain} session: ${session}`);

        return new Promise((resolve, reject) => {
            if (!tableService || !structureService || !user || !domain || !session) {
                reject('Could not initialise ClientTableSyncManager (invalid arguments)')
            } else {
                _tableService = tableService;
                _dataStructureService = structureService;
                _user = user;
                _domain = domain;
                _sessionId = session;
                resolve();
            }
        });
    };

    /**
     * Entry point for client table synchronisation process.
     * @param structures
     * @private
     */
    const _sync = function(structures, progressUpdate) {
        console.log(`ClientTableSyncManager #_sync, structures: ${structures.length}`, structures);

        const startTime = new Date();
        let remoteVersions = null;
        let localVersions = null;

        return new Promise(((resolve, reject) => {

            // No client tables required?
            if(structures.length === 0) {
                resolve();
            }

            _tableService.prepareToSync().then(() => {
                progressUpdate();
                return _getRemoteClientTableVersions();
            }).then(rvs => {
                progressUpdate();
                remoteVersions = rvs;
                return _tableService.getLocalVersions();
            }).then(lvs => {
                progressUpdate();

                localVersions = lvs;

                remoteVersions = _filterRedundant(remoteVersions, structures);
                localVersions  = _filterRedundant(localVersions,  structures);

                if (Object.keys(remoteVersions).length === 0 || Object.keys(remoteVersions).length === 0) {
                    return _freshSync(structures);
                } else {
                    return _versionedSync(remoteVersions, localVersions, structures, progressUpdate);
                }

            }).then(() => {
                progressUpdate();
                return _tableService.saveVersions(remoteVersions);
            }).then(() => {
                progressUpdate();
               return  _tableService.completeSync();
            }).then(() => {
                progressUpdate();
                return  _trimTables();
            }).then(() => {

                const finishTime = new Date();
                const duration = finishTime - startTime;
                const msg = `Client tables synced in: ${duration / 1000} sec.`;
                rLog.log({
                    remoteVersions: remoteVersions,
                    localVersions: localVersions,
                    structures: structures.length
                }, msg, rLog.level.INFO, [rLog.tag.SYNC]);
                resolve();
            }).catch(error => {
                console.error(`ClientTableSyncManager #_sync, ERROR while syncing ${error}`, error);
                rLog.log({
                    error: error,
                    remoteVersions: remoteVersions,
                    localVersions: localVersions,
                    structures: structures.length
                }, "Error while syncing client tables", rLog.level.ERROR, [rLog.tag.SYNC]);

                // Sync revert happens asynchronously.
                _tableService.revertSync().then(() => {
                    rLog.log({}, "Client table sync reverted OK.", rLog.level.INFO, [rLog.tag.SYNC]);
                }).catch(err => {
                    rLog.log({err: err}, "Error while reverting client tables sync.", rLog.level.ERROR, [rLog.tag.SYNC]);
                });

                reject(`Could not sync client tables error: ${error}`);
            });
        }));
    };

    /**
     * Removes client tables not used by any of the apps.
     * @returns {Promise<T>}
     * @private
     */
    const _trimTables = function() {
        console.log("ClientTableSyncManager #_trimTables");

        let dsIds = null;

        return _dataStructureService.getAllIds().then(ids => {
            dsIds = ids;
            return _tableService.getTableIds();
        }).then(tableIds => {
            const removeIds = tableIds.filter(tId => !dsIds.includes(tId));
            return _tableService.removeTables(removeIds);
        });
    };

    /**
     * Sync where versions for remote and local tables are available.
     * @param remoteVersions
     * @param localVersions
     * @param structures
     * @private
     */
    const _versionedSync = function(remoteVersions = {}, localVersions = {}, structures = {}, progressUpdate){
        console.log(`ClientTableSyncManager #_versionedSync, remoteVersions ${remoteVersions}, localVersions ${localVersions}, structures: ${structures.length}`, structures);

        let p = Promise.resolve();

        for (let i = 0; i < structures.length; i++) {

            const structure = structures[i];
            const needsUpdating = _checkVersion(remoteVersions, localVersions, structure);

            p = p.then(() => {
                const subText = `Synchronising app databases</br>${i+1} of ${structures.length}`;
                progressUpdate(subText);
                return Promise.resolve();
            });

            if (needsUpdating) {
                p = p.then(() => _downloadClientTableData(structure))
                    .then(data => _tableService.saveClientTable(structure, data))
                    .then(() => new Promise(res => {
                        console.log(`ClientTableSyncManager: table: ${structure.getTableName()} synced OK`);
                        res();
                    }));
            }
        }

        return p;
    };

    /**
     * Checks if data structure needs to be downloaded again based on local and remote versions.
     * NOTE: If no version found "true" is returned, to try to download its data anyway.
     * @param remoteVersions
     * @param localVersions
     * @param structure
     * @private
     */
    const _checkVersion = function(remoteVersions, localVersions, structure) {
        console.log(`ClientTableSyncManager #_checkVersion, remoteVersions ${remoteVersions}, localVersions ${localVersions}, structure: ${structure}`, structure);

        if (!remoteVersions || !localVersions) {
            return true;
        }

        if (Object.keys(remoteVersions).length === 0 || Object.keys(localVersions).length === 0) {
            return true;
        }

        const dsId = structure.id;

        return remoteVersions[dsId] !== localVersions[dsId];
    };

    /**
     * Sync where remote OR local versions for client tables are NOT available.
     * @param structures
     * @private
     */
    const _freshSync = function(structures) {
        console.log(`ClientTableSyncManager #_freshSync, structures: ${structures.length}`, structures);
        return _versionedSync(null, null, structures);
    };

    /**
     * Gets data for a structure.
     * @param structure
     * @private
     */
    const _downloadClientTableData = function(structure, progressCallback) {
        console.log(`ClientTableSyncManager #_downloadClientTableData, structure ${structure}`, structure);

        return new Promise(((resolve, reject) => {
            const omitSync = SyncPolManager.getInstance().shouldOmitSync(structure);

            if (omitSync) {
                const response = _tableService.getNoDataRequest();
                resolve(response);
            } else {
                const headers = _buildHeaders(structure);
                const tableName = structure.getTableName();

                $.ajax({
                    type: "GET",
                    url: ConfigManager.syncUrl,
                    timeout: 3 * 60 * 1000,
                    headers: headers,
                    success: function(response, status, xhr) {
                        console.log(`ClientTableSyncManager #_downloadClientTableData, table ID: ${structure.id} downloaded OK.`, response);

                        if(typeof progressCallback === 'function') {
                            progressCallback();
                        }

                        if (xhr.status === 200) {

                            if (!response) {
                                response = _tableService.getNoDataRequest();
                            }

                            /* window.ga.trackEvent('Pull Table Data', 'Success', tableName, 0, false,
                                data => console.log(`GA: Synchronisation:Success:${tableName}. OK. data: ${data}`),
                                err => console.error(`GA: Synchronisation:Success:${tableName}. FAIL. err: ${err}`)
                            ); */

                            resolve(response);

                        } else {
                            const errMsg = `PTD response malformed! code: ${xhr.status}, response: ${response}`;

                            rLog.log({
                                response: response,
                                code: xhr.status,
                                syncUrl: ConfigManager.syncUrl,
                                headers: headers,
                                table: tableName
                            }, errMsg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);

                            console.error(errMsg, response);
                            reject(errMsg);
                        }
                    },
                error: function(xhr, status, errorThrown) {
                    console.error(`ClientTableSyncManager #_downloadClientTableData: Error encountered while getting data from PTD: err ${errorThrown}`, xhr);

                        /* window.ga.trackEvent('Pull Table Data', 'Error', tableName, 0, false,
                            data => console.log(`GA: Synchronisation:Error:${tableName}. OK. data: ${data}`),
                            err => console.error(`GA: Synchronisation:Error:${tableName}. FAIL. err: ${err}`)
                        ); */

                        const errMsg = `Error getting remote versions. responseText: ${xhr.responseText} Error thrown ${errorThrown}`;
                        rLog.log({
                            status: status,
                            code: xhr.status,
                            responseText: xhr.responseText,
                            errThrown: errorThrown,
                            table: tableName,
                            syncUrl: ConfigManager.syncUrl,
                            headers: headers,
                        }, errMsg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);

                        console.error(errMsg, xhr);
                        reject(errMsg);
                    }
                });
            }
        }));
    };

    /**
     * Builds headers for requests to 'pull-table-data' microservice.
     * @param structure
     * @returns Headers to be used for syncTable http request.
     */
    const _buildHeaders = function(structure) {
        const syncPolHeader = SyncPolManager.getInstance().getSyncPolFilterHeader(structure);
        const headers = {
            "session-id": _sessionId,
            "subdomain": _domain,
            "organisation-id":"1",
            "table-id": structure.getTableName(),
            "preview": false,
            "filters": JSON.stringify(syncPolHeader)
        };


        const reqHeader = [];
        // Uncomment bellow only if you want images not to be returned by pull-table-data.
        // reqHeader = this.buildNoMediaReqFieldsHeader(structure);

        if (reqHeader.length !== Object.keys(structure.fields).length) {
            headers['req-fields'] = JSON.stringify(reqHeader);
        }

        return headers;
    };

    /**
     * Strips fields of type MEDIA. This is to temporary address CSA (IP) scaling issues.
     * @param structure
     * @returns {Array} Ids of fields of other than MEDIA types.
     */
    const buildNoMediaReqFieldsHeader = function(structure) {
        const fields = structure.fields;
        const reqFieldsIds = [];

        for (let key in fields) {

            if (fields.hasOwnProperty(key)) {
                const field = fields[key];

                if (field.getType() !== DataVariant.MEDIA) {
                    reqFieldsIds.push(field.getDbFieldName());
                }
            }

        }

        return reqFieldsIds;

    };

    /**
     * Removes tables not present in structures and therefore deemed no longer required.
     * @param tableVersions
     * @param structures
     * @private
     */
    const _filterRedundant = function(tableVersions, structures) {
        console.log(`ClientTableSyncManager #_filterRedundant, tableVersions ${tableVersions}, structures: ${structures.length}`, structures);

        const ids = structures.map(s => s.id);

        for (const id in tableVersions) {
            if (!ids.includes(Number(id))) {
                delete tableVersions[id];
            }
        }

        console.log(`ClientTableSyncManager #_filterRedundant, filtered tableVersions:`, tableVersions);

        return tableVersions;
    };

    const _getRemoteClientTableVersions = function() {
        console.log(`ClientTableSyncManager #_getRemoteClientTableVersions`);

        return new Promise(((resolve) => {

            const url = ConfigManager.clientTableVersionsUrl;
            const headers =  {
                "session-id": _sessionId,
                "subdomain": _domain
            };

            $.ajax({
                type: "GET",
                url: url,
                timeout: 15000,
                headers: headers,
                success: function(response, status, xhr) {
                    console.log(`ClientTableSyncManager, remote versions received:`, response);

                    if (xhr.status === 200) {
                        resolve(response);
                    } else {
                        const errMsg = `Could not get remote versions. Response status ${xhr.status}`;
                        rLog.log({
                            response: response,
                            code: xhr.status,
                        }, errMsg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);
                        console.error(errMsg, response);
                        resolve({});
                    }
                },
                fail: function(xhr, status, errorThrown) {
                    const errMsg = `Failed to get remote versions. Error thrown ${errorThrown}`;
                    rLog.log({
                        status: status,
                        code: xhr.status,
                        responseText: xhr.responseText,
                        errThrown: errorThrown
                    }, errMsg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);
                    console.error(errMsg, xhr);
                    resolve({})
                },
                error: function(xhr, status, errorThrown) {
                    const errMsg = `Error getting remote versions. Error thrown ${errorThrown}`;
                    rLog.log({
                        status: status,
                        code: xhr.status,
                        responseText: xhr.responseText,
                        errThrown: errorThrown,
                        headers: headers,
                        url: url
                    }, errMsg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);
                    console.error(errMsg, xhr);
                    resolve({})
                }
            });
        }));
    };

    return {
        init: _init,
        sync: _sync,
    }
})();
