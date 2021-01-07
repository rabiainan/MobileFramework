const DeploymentsRepo = (function() {

    let _db = null;

    const _init = function(db) {
        console.log('DeploymentsRepo: #init');

        return new Promise(function(resolve, reject) {

            if (db) {
                _db = db;
                resolve();
            } else {
                reject("Database not found")
            }
        });
    };

    const _getAll = function(user, domain, callback) {
        console.log(`DeploymentsRepo: reading all deployments for user: ${user}, domain: ${domain}`);

        const result = [];

        db.transaction(
            function (tx) {
                const stmt = 'SELECT * FROM microAppDeployment WHERE username = ? AND domain = ?';
                const params = [user, domain];
                tx.executeSql(stmt, params,
                    function (tx, rs) {
                        console.log(`DeploymentsRepo: deployments read: ${rs.rows.length}`);

                        for (let i = 0; i < rs.rows.length; i++) {
                            const row = rs.rows.item(i);
                            const deployment = _row2dep(row);
                            result.push(deployment);
                        }
                    },
                    function (tx, error) {
                        const errMsg = `DeploymentsRepo: getAll SELECT SLQ error.`;
                        console.error(errMsg, tx);
                        rLog.log({
                            sqlError: error.message,
                            errorCode: error.code
                        }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                        return true;
                    });
            },
            function (error) {
                const errMsg = 'DeploymentsRepo: getAll TX error.';
                console.error(errMsg,error);
                rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                callback(false);
            },
            function () {
                console.log('DeploymentsRepo: getAll TX success.');
                callback(true, result);
            });
    };

    const _getById = function(id, user, domain, callback) {
        console.log(`DeploymentsRepo: reading deployments for id: ${id}, user: ${user}, domain: ${domain}`);

        const result = [];
        _db.transaction(
            function (tx) {
                const params = [id, user, domain];
                const stmt = 'SELECT * FROM microAppDeployment WHERE appId = ? AND username = ? AND domain = ?';
                tx.executeSql(stmt, params,
                    function (tx, rs) {
                        console.log(`DeploymentsRepo: appsRead: ${rs.rows.length}`);

                        for (let i = 0; i < rs.rows.length; i++) {
                            const row = rs.rows.item(i);
                            const deployment = _row2dep(row);
                            result.push(deployment);
                        }
                    },
                    function (tx, error) {
                        const errMsg = `DeploymentsRepo: getById SELECT SLQ error.`;
                        console.error(errMsg, error);
                        rLog.log({
                            sqlError: error.message,
                            errorCode: error.code
                        }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                        return true;
                    });
            },
            function (error) {
                const errMsg = 'DeploymentsRepo: getByFolderId TX error.';
                console.error(errMsg, error);
                rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                callback(false);
            },
            function () {
                console.log('DeploymentsRepo: getByFolderId TX success.');
                callback(true, result);
            });

    };

    const _getByAppIds = function(ids, user, domain, includeDeployments) {
        console.log(`DeploymentsRepo#getByAppIds ids: ${ids}, user: ${user}, domain: ${domain}, includeDeployments: ${includeDeployments}`);

        return new Promise((resolve, reject) => {

            const result = [];
            _db.transaction(
                function (tx) {

                    const projection = includeDeployments ? '*' : 'id, appId, appModeId, settings, created, domain, username'
                    const placeholders = ids.map(() => '?').join(',');
                    const params = [user, domain, ...ids];

                    const stmt = `SELECT ${projection} FROM microAppDeployment WHERE username = ? AND domain = ? AND appId IN (${placeholders})`;

                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`DeploymentsRepo: appsRead: ${rs.rows.length}`);

                            for (let i = 0; i < rs.rows.length; i++) {
                                const row = rs.rows.item(i);
                                const deployment = _row2dep(row);
                                result.push(deployment);
                            }
                        },
                        function (tx, error) {
                            const errMsg = `DeploymentsRepo: getById SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'DeploymentsRepo: getByFolderId TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('DeploymentsRepo: getByFolderId TX success.');
                    resolve(result);
                });
            });

    };


    const _saveOne = function(id, mode, created, user, domain, deployment, settings) {
        console.log(`DeploymentsRepo: saving deployment id: ${id}, mode: ${mode}, created: ${created}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            const stmt = 'INSERT INTO microAppDeployment (appId, appModeId, username, domain, created, microAppDeploymentData, settings) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const params = [id, mode, user, domain, created, deployment, settings];

            _db.transaction(tx => {
                tx.executeSql(stmt, params,
                    (tx, rs) => {
                        console.log(`DeploymentsRepo: saveOne OK. depId: ${id}, mode: ${mode}`);
                    },(tx, err) => {
                        const errMsg = `DeploymentsRepo: saveOne SQL error. depId: ${id}, mode: ${mode}`;
                        console.error(errMsg, err);
                        rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                        return true;
                    });
            }, err => {
                const errMsg = 'DeploymentsRepo: saveOne ids TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message, depId: id}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                resolve();
            });
        });
    };

    const _row2dep = function(row) {
        let settings;

        try {
            settings = JSON.parse(row['settings']);
        } catch (e) {
            console.warn('No deployment settings found. Assume legacy deployment with tablet/phone compatibility.');
        }

        return {
            id: row['appId'],
            mode: row['appModeId'],
            deployment: row['microAppDeploymentData'],
            settings: settings,
            username: row['username'],
            domain: row['domain'],
            created: row['created']
        };
    };

    const _isInit = function () {
        console.log(`DeploymentsRepo: #isInit`);
        return _db !== null
    };

    const _keepOnly = function(apps, user, domain) {
        console.log(`DeploymentsRepo: #keepOnly user: ${user}, domain: ${domain}, apps: ${apps.length}`, apps);
        // TODO: 23/11/2018 TBI ... ?
    };

    const _keepOnlyIds = function(ids, user, domain) {
        console.log(`DeploymentsRepo: #_keepOnlyIds user ${user}, domain: ${domain}, ids: ${ids.length}`, ids);
        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const placeholders = ids.map(() => '?').join(',');
                    const stmt = `DELETE FROM microAppDeployment WHERE username = ? AND domain = ? AND appId NOT IN (${placeholders})`;
                    const params = [user, domain];
                    params.push(...ids);

                    tx.executeSql(stmt, params,
                        function (tx, resultSet) {
                            console.log(`DeploymentsRepo: deployments deleted: ${resultSet.rows.length}`);
                        },
                        function (tx, err) {
                            const errMsg = 'DeploymentsRepo: delete ids SQL error';
                            console.error(errMsg, err);
                            rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        }
                    );
                },
                function (error) {
                    const errMsg = 'DeploymentsRepo: delete ids TX error';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    reject(error.message);
                },
                function () {
                    console.log('DeploymentsRepo: delete ids TX success');
                    resolve();
                });


        });
    };

    const _keepOnlyModes = function(id, modes, user, domain) {
        console.log(`DeploymentsRepo: #_keepOnlyModes user: ${user}, domain: ${domain}, id: ${id}, modes: ${modes.length}`, modes);

        return new Promise((res, rej) => {
            _db.transaction(tx => {
                const placeholders = modes.map(() => '?').join(',');
                const stmt = `DELETE FROM microAppDeployment WHERE username = ? AND domain = ? AND appId = ? AND appModeId NOT IN (${placeholders})`;
                const params = [user, domain, id];
                params.push(...modes);
                tx.executeSql(stmt, params, (tx, rs) => {
                    console.log(`DeploymentsRepo: #_keepOnlyModes, deployments deleted: ${rs.rows.length}`);
                }, (tx, err) => {
                    const errMsg = 'DeploymentsRepo: delete modes SQL error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err => {
                const errMsg = 'DeploymentsRepo: delete modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                rej(err.message);
            }, () => {
                res();
            });
        });

    };

    const _keepOnlyModesBulk = function(microApps, user, domain) {
        console.log(`DeploymentsRepo: #_keepOnlyModes user: ${user}, domain: ${domain}, microApps: ${microApps.length}`, microApps);
        console.time("_keepOnlyModesBulk");
        return new Promise((res, rej) => {
            _db.transaction(tx => {
                microApps.forEach(app => {
                    _keepOnlyModesTX(tx, app.id, app.modes, user, domain);
                });
            }, err => {
                const errMsg = 'DeploymentsRepo: delete modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                rej(err.message);
            }, () => {
                console.timeEnd("_keepOnlyModesBulk");
                res();
            });
        });

    };

    const _keepOnlyModesTX = function(tx, id, modes, user, domain) {
        console.log(`DeploymentsRepo: #_keepOnlyModesTX user: ${user}, domain: ${domain}, id: ${id}, modes: ${modes.length}`, modes);

        const placeholders = modes.map(() => '?').join(',');
        const stmt = `DELETE FROM microAppDeployment WHERE username = ? AND domain = ? AND appId = ? AND appModeId NOT IN (${placeholders})`;
        const params = [user, domain, id];
        params.push(...modes);
        tx.executeSql(stmt, params, (tx, rs) => {
            console.log(`DeploymentsRepo: #_keepOnlyModes, deployments deleted: ${rs.rows.length}`);
        }, (tx, err) => {
            const errMsg = 'DeploymentsRepo: delete modes SQL error';
            console.error(errMsg, err);
            rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
            return true;
        });

    };

    const _getCreatedForApp = function(id, mode, user, domain) {
        console.log(`DeploymentsRepo: #_getCreatedForApps user: ${user}, domain: ${domain}, id: ${id}, mode: ${mode}`);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                const stmt = 'SELECT created FROM microAppDeployment WHERE appId = ? AND appModeId = ? AND username = ? AND domain = ?';
                const params = [id, mode, user, domain];
                tx.executeSql(stmt, params, (tx, rs) => {
                    if (rs.rows.length > 0) {
                        resolve(rs.rows.item(0).created || null);
                    } else {
                        resolve(null);
                    }
                }, (tx, err) => {
                    const errMsg = 'DeploymentsRepo: _getCreatedForApp modes SQL error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message, appId: id, appMode: mode}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DeploymentsRepo: _getCreatedForApp modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                // ignore...
            });
        });
    };

    const _getCreatedForAppsAllModes = function(ids, user, domain) {
        console.log(`DeploymentsRepo: #_getCreatedForAppsAllModes ids: ${ids}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            const result = [];
            _db.transaction(tx => {
                const placeholders = ids.map(() => '?').join(',');
                const stmt = `SELECT appId, appModeId, created FROM microAppDeployment WHERE username = ? AND domain = ? AND appId IN (${placeholders})`;
                const params = [user, domain];
                params.push(...ids);
                tx.executeSql(stmt, params, (tx, rs) => {

                    for (let i = 0; i < rs.rows.length; i++) {
                        const row = rs.rows.item(i);
                        result.push({
                            appId: row.appId,
                            appModeId: row.appModeId,
                            created: row.created
                        });
                    }
                }, (tx, err) => {
                    const errMsg = 'DeploymentsRepo: _getCreatedForAppsAllModes modes SQL error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message, ids: ids}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                });
            }, err =>  {
                const errMsg = 'DeploymentsRepo: _getCreatedForAppsAllModes modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                console.log(`DeploymentsRepo: #_getCreatedForAppsAllModes TX Success. result:`, result);
                resolve(result);
            });
        });
    };

    const _insertOrUpdate = function(appId, mode, created, user, domain, deployment, settings) {
        console.log(`DeploymentsRepo: #_insertOrUpdate user ${user}, domain: ${domain}, appId: ${appId}, mode: ${mode}`);

        return new Promise((resolve, reject) => {
            _getId(appId, mode, user, domain).then(id => {
                if(id) {
                    _updateDeployment(id,created, deployment, settings).then(() => resolve()).catch(err => reject(err));
                } else {
                    _saveOne(appId, mode, created, user, domain, deployment, settings).then(() => resolve()).catch(err => reject(err));
                }
            }).catch(reason => {
                console.error(reason);
                reject(reason);
            })
        });

    };

    const _updateDeployment = function(id, created, deployment, settings) {
        console.log(`DeploymentsRepo: #_updateOne id: ${id}, created: ${created}`);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                const stmt = 'UPDATE microAppDeployment SET created = ?, microAppDeploymentData = ?, settings = ? WHERE id = ?';
                const params = [created, deployment, settings, id];
                tx.executeSql(stmt, params, (tx, rs) => {
                    if (rs.rows.length > 0) {
                        resolve(rs.rows.item(0).id);
                    } else {
                        resolve(null);
                    }
                }, (tx, err) => {
                    const errMsg = 'DeploymentsRepo: _getId modes SQL error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message, id: id, created: created}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DeploymentsRepo: _getId modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                // ignore...
            });
        });
    };

    const _getId = function(id, mode, user, domain) {
        console.log(`DeploymentsRepo: #_getId user: ${user}, domain: ${domain}, id: ${id}, mode: ${mode}`);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                const stmt = 'SELECT id FROM microAppDeployment WHERE appId = ? AND appModeId = ? AND username = ? AND domain = ?';
                const params = [id, mode, user, domain];
                tx.executeSql(stmt, params, (tx, rs) => {
                    if (rs.rows.length > 0) {
                        resolve(rs.rows.item(0).id);
                    } else {
                        resolve(null);
                    }
                }, (tx, err) => {
                    const errMsg = 'DeploymentsRepo: _getId modes SQL error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message, appId: id, appMode: mode}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DeploymentsRepo: _getId modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                // ignore...
            });
        });
    };

    const _getByIdMode = function(id, mode, user, domain) {
        console.log(`DeploymentsRepo: #_getByIdMode user ${user}, domain: ${domain}, id: ${id}, mode: ${mode}`);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                const stmt = 'SELECT * FROM microAppDeployment WHERE appId = ? AND appModeId = ? AND username = ? AND domain = ? ORDER BY created desc LIMIT 1';
                const params = [id, mode, user, domain];
                tx.executeSql(stmt, params, (tx, rs) => {
                    if (rs.rows.length > 0) {
                        resolve(rs.rows.item(0));
                    } else {
                        resolve(null);
                    }
                }, (tx, err) => {
                    const errMsg = 'DeploymentsRepo: _getId modes SQL error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message, appId: id, appMode: mode}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DeploymentsRepo: _getId modes TX error';
                console.error(errMsg, err);
                rLog.log({sqlError: err.message}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                // ignore...
            });
        });
    };

    return {
        init: _init,
        getAll: _getAll,
        getById: _getById,
        getByAppIds: _getByAppIds,
        isInitialised: _isInit,
        keepOnly: _keepOnly,
        keepOnlyIds: _keepOnlyIds,
        keepOnlyModes: _keepOnlyModes,
        keepOnlyModesBulk: _keepOnlyModesBulk,
        getCreatedForApp: _getCreatedForApp,
        getCreatedForAppsAllModes: _getCreatedForAppsAllModes,
        insertOrUpdate: _insertOrUpdate,
        getByIdMode: _getByIdMode
    };
})();
