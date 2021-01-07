const MicroAppsRepo = (function() {

    let _db = null;

    const init = function(db) {
        console.log('MicroAppsRepo: #init');

        return new Promise((resolve, reject) => {
            if (db) {
                _db = db;
                resolve();
            } else {
                reject('Database not not found')
            }
        });
    };

    const getAll = function(name, domain) {
        console.log(`MicroAppsRepo: reading all microApps for user: ${name} domain: ${domain}`);
        return new Promise((res, rej) => {
            const result = [];
            _db.transaction(
                function (tx) {
                    const params = [name, domain];
                    tx.executeSql('SELECT * FROM microAppData WHERE username = ? AND domain = ?', params,
                        function (tx, resultSet) {
                            console.log(`MicroAppsRepo: appsRead: ${resultSet.rows.length}`);

                            for (let i = 0; i < resultSet.rows.length; i++) {
                                const row = resultSet.rows.item(i);
                                const microApp = row2app(row);
                                result.push(microApp);
                            }
                        },
                        function (tx, error) {
                           console.error('MicroAppsRepo: getAll SELECT SLQ error.', error);
                        });
                },
                function (error) {
                    const errMsg = 'MicroAppsRepo: getAll TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    rej()
                },
                function () {
                    console.log('MicroAppsRepo: getAll TX success.');
                    res(result);
                });
            });
    };

    const getByFolderId = function(userName, domain, folderId) {
        console.log('MicroAppsRepo: reading microApps for folder: ' + folderId + ', user: ' + userName
            + ', domain: ' + domain);

        const result = [];

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [userName, domain, folderId];
                    tx.executeSql('SELECT * FROM microAppData WHERE username = ? AND domain = ? AND folderId = ?', params,
                        function (tx, resultSet) {
                            console.log('MicroAppsRepo: appsRead: ' + resultSet.rows.length);

                            for (let i = 0; i < resultSet.rows.length; i++) {
                                const row = resultSet.rows.item(i);
                                const microApp = row2app(row);
                                result.push(microApp);
                            }
                        },
                        function (tx, error) {
                            console.error('MicroAppsRepo: getByFolderId SELECT SLQ error.');
                            console.error(error);
                        });
                },
                function (error) {
                    const errMsg = 'MicroAppsRepo: getByFolderId TX error.';
                    console.error(errMsg);
                    console.error(error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('MicroAppsRepo: getByFolderId TX success.');
                    resolve(result);
                });
        });
    };

    const getById = function(appId, userName, domain) {
        console.log(`MicroAppsRepo#getById: appId ${appId}, user: ${userName}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    var params = [userName, domain, appId];
                    tx.executeSql('SELECT * FROM microAppData WHERE username = ? AND domain = ? AND appId = ?', params,
                        function (tx, resultSet) {
                            console.log('MicroAppsRepo#getById found: ' + resultSet.rows.length);

                            if (resultSet.rows.length > 0) {
                                const row = resultSet.rows.item(0);
                                const microApp = row2app(row);
                                resolve(microApp);
                            } else {
                                resolve(null);
                            }
                        },
                        function (tx, error) {
                            console.error('MicroAppsRepo: getById SELECT SLQ error.', error);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'MicroAppsRepo: getById TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('MicroAppsRepo: getById TX success.');
                });
        });
    };

    const _getByIds = function(ids, userName, domain) {
        console.log(`MicroAppsRepo#getByIds: ids ${ids}, user: ${userName}, domain: ${domain}`);

        const microApps = [];

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {

                    const placeholders = ids.map(() => '?').join(',');
                    const stmt = `SELECT * FROM microAppData WHERE username = ? AND domain = ? AND appId IN (${placeholders})`;
                    const params = [userName, domain, ...ids];
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log('MicroAppsRepo#getByIds found: ' + rs.rows.length);

                            for (let i = 0; i < rs.rows.length; i++) {
                                const row = rs.rows.item(i);
                                const microApp = row2app(row);
                                microApps.push(microApp);
                            }

                        },
                        function (tx, error) {
                            console.error('MicroAppsRepo: getByIds SELECT SLQ error.', error);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'MicroAppsRepo: getByIds TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('MicroAppsRepo: getByIds TX success. Resolving with: ', microApps);
                    resolve(microApps);
                });
        });
    };

    const _getAutoLaunch = function(userName, domain) {
        console.log(`MicroAppsRepo#_getAutoLaunch: user: ${userName}, domain: ${domain}`);

        const microApps = [];

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {

                    const stmt = `SELECT * FROM microAppData WHERE username = ? AND domain = ? AND appSettingsJSON LIKE "%setting_open_default_yes%"`;
                    const params = [userName, domain];
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log('MicroAppsRepo#getAutoLaunch found: ' + rs.rows.length);

                            for (let i = 0; i < rs.rows.length; i++) {
                                const row = rs.rows.item(i);
                                const microApp = row2app(row);
                                microApps.push(microApp);
                            }

                        },
                        function (tx, error) {
                            console.error('MicroAppsRepo: _getAutoLaunch SELECT SLQ error.', error);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'MicroAppsRepo: _getAutoLaunch TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('MicroAppsRepo: _getAutoLaunch TX success. Resolving with: ', microApps);
                    resolve(microApps);
                });
        });
    };


    const saveAll = function(userName, domain, microAppsArr) {
        console.log(`MicroAppsRepo: saving microApps for user: ${userName}, domain: ${domain}, total apps: ${microAppsArr.length}`);

        return new Promise((resolve, reject) => {

            _db.transaction(
                function (tx) {
                    // Remove all microAppData before adding new data in for clean sync.
                    deleteAll(tx, userName, domain,
                        function (isSuccess) {
                            for (let i = 0; i < microAppsArr.length; i++) {
                                const microApp = microAppsArr[i];
                                saveOne(tx, microApp, userName, domain);
                            }
                        }
                    );
                },
                function (error) {
                    const errMsg = 'MicroAppsRepo: saveAll TX error.';
                    console.error(errMsg);
                    console.error(error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('MicroAppsRepo: saveAll TX success.');
                    resolve();
                });

            });
    };

    const deleteAll = function(tx, userName, domain, callback) {
        console.log('MicroAppsRepo: deleting microApps for userName: ' + userName + ', domain: ' + domain);

        var params = [userName, domain];

        tx.executeSql('DELETE FROM microAppData WHERE username = ? AND domain = ?', params,
            function (tx, resultSet) {
                console.log('MicroAppsRepo: apps deleted: ' + resultSet.rows.length);
                callback(true)
            },
            function (transaction, error) {
                callback(false)
            }
        );
    };

    const saveOne = function(tx, microApp, userName, domain) {
        console.log(`MicroAppsRepo: saving microApp id ${microApp['id']}`);

        const selectStmt = 'SELECT * FROM microAppData WHERE username = ? AND domain = ? AND appId = ?';
        const selectParams = [userName, domain, microApp['id']];

        tx.executeSql(selectStmt, selectParams,
            function (tx, result) {
                if (result.rows.length > 0) {
                    const updateStmt = 'UPDATE microAppData SET ' +
                        'appSettingsJSON = ?, ' +
                        'currentWorkflowId = ?, ' +
                        'deploymentId = ?, ' +
                        'description = ?, ' +
                        'folderId = ?, ' +
                        'appId = ?, ' +
                        'lockedApp = ?, ' +
                        'microAppBuildId = ?, ' +
                        'modified = ?, ' +
                        'name = ?, ' +
                        'organisationId = ?, ' +
                        'thumbnailId = ?, ' +
                        'visible = ? ' +
                        'modes = ? ' +
                        'WHERE username = ? AND domain = ? AND appId = ?';

                    const updateParams = [
                        JSON.stringify(microApp['appSettingsJSON']),
                        microApp['currentWorkflowId'],
                        microApp['deploymentId'],
                        microApp['description'],
                        microApp['folderId'],
                        microApp['id'],
                        microApp['lockedApp'],
                        microApp['microAppBuildId'],
                        microApp['modified'],
                        microApp['name'],
                        microApp['organisationId'],
                        microApp['thumbnailId'],
                        microApp['visible'],
                        microApp['appModes'] ? JSON.stringify(microApp['appModes']) : null,
                        userName,
                        domain,
                        microApp['id']];
                    tx.executeSql(updateStmt, updateParams,
                        function (tx, result) {
                            console.log('MicroAppsRepo: microApp UPDATE success. id: ' + microApp['id']);
                        },
                        function (transaction, error) {
                            const errMsg = 'MicroAppsRepo: microApps UPDATE FAIL.';
                            console.error(errMsg, error);
                            rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                        }
                    );
                } else {
                    const insertStmt = 'INSERT INTO microAppData (' +
                        'username, domain, appSettingsJSON, currentWorkflowId, deploymentId, ' +
                        'description, folderId, appId, lockedApp, microAppBuildId, modified, name,' +
                        'organisationId, thumbnailId, visible, modes) ' +
                        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                    const insertParams = [userName, domain, JSON.stringify(microApp['appSettingsJSON']),
                        microApp['currentWorkflowId'],
                        microApp['deploymentId'],
                        microApp['description'],
                        microApp['folderId'],
                        microApp['id'],
                        microApp['lockedApp'],
                        microApp['microAppBuildId'],
                        microApp['modified'],
                        microApp['name'],
                        microApp['organisationId'],
                        microApp['thumbnailId'],
                        microApp['visible'],
                        microApp['appModes'] ? JSON.stringify(microApp['appModes']) : null];
                    tx.executeSql(insertStmt, insertParams,
                        function (tx, result) {
                            console.log('MicroAppsRepo: microApp INSERT success. id: ' + microApp['id']);
                        },
                        function (transaction, error) {
                            const errMsg = 'MicroAppsRepo: microApps INSERT FAIL.';
                            console.error(errMsg, error);
                            rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                        }
                    );
                }
            });
    };

    const row2app = function(row) {
        return {
            id: row['appId'],
            name: row['name'],
            visible: row['visible'] === 'true',
            modified: row['modified'],
            folderId: row['folderId'],
            lockedApp: row['lockedApp'],
            description: row['description'],
            thumbnailId: row['thumbnailId'],
            deploymentId: row['deploymentId'],
            organisationId: row['organisationId'],
            microAppBuildId: row['microAppBuildId'],
            appSettingsJSON: JSON.parse(row['appSettingsJSON']),
            currentWorkflowId: row['currentWorkflowId'],
            modes: row['modes'] ? JSON.parse(row['modes']) : null
        };
    };

    const _isInit = function () {
        console.log(`MicroAppsRepo: #isInit`);
        return _db !== null
    };

    return {
        init: init,
        isInitialised: _isInit,
        getAll: getAll,
        getById: getById,
        getByIds: _getByIds,
        getByFolderId: getByFolderId,
        saveAll: saveAll,
        getAutoLaunch: _getAutoLaunch
    };
})();
