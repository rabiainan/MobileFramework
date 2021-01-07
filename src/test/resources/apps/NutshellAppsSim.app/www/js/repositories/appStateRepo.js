const AppStateRepo = (function() {

    let _db = null;

    const init = function(db) {
        console.log('AppStateRepo: #_init db:', db);

        return new Promise(function(resolve, reject) {

            if (db) {
                _db = db;
                resolve();
            } else {
                reject("Database not found")
            }
        });
    };

    const isInitialised = function () {
        console.log(`MicroAppsRepo: #isInit`);
        return _db !== null
    };

    const persistState = function(appId, appMode, parentAppId, user, domain, state, isTransient) {
        console.log(`AppStateRepo: _saveOne deployment appId: ${appId}, appMode: ${appMode}, parentAppId: ${parentAppId}, user: ${user}, domain: ${domain}, isTransient: ${isTransient}`);

        return new Promise((resolve, reject) => {
            const stmt = 'INSERT OR REPLACE INTO microAppStates (appId, appMode, parentAppId, username, domain, state, transient) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const params = [appId, appMode, parentAppId, user, domain, state, Number(isTransient)];

            _db.transaction(tx => {
                tx.executeSql(stmt, params,
                    (tx, rs) => {
                        console.log(`AppStateRepo: saveOne OK. appId: ${appId}, appMode: ${appMode}, parentAppId: ${parentAppId}`);
                    },(tx, err) => {
                        const errMsg = `AppStateRepo: saveOne SQL error. appId: ${appId}, appMode: ${appMode}, parentAppId: ${parentAppId}`;
                        console.error(errMsg, err);
                        rLog.log({
                            appId: appId,
                            appMode: appMode,
                            parentAppId: parentAppId,
                            sqlError: err.message
                        }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                        return true;
                    });
            }, err => {
                const errMsg = 'AppStateRepo: saveOne ids TX error';
                console.error(errMsg, err);
                rLog.log({
                    appId: appId,
                    appMode: appMode,
                    parentAppId: parentAppId,
                    sqlError: err.message
                }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                resolve();
            });
        });
    };

    /**
     * Gets parent app ID of a non transient state.
     * @param id
     * @param appMode
     * @param user
     * @param domain
     * @returns {Promise<unknown>}
     */
    const getParent = function(id, appMode, user, domain) {
        console.log(`AppStateRepo#getParent: ${id}, appMode: ${appMode}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [id, appMode, user, domain];
                    const stmt = 'SELECT parentAppId FROM microAppStates WHERE appId = ? AND appMode = ? AND transient = 0 AND username = ? AND domain = ?';
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo#_getParent appsRead: ${rs.rows.length}`);

                            if (rs.rows.length > 0) {
                                const row = rs.rows.item(0);
                                const parentId = row.parentAppId;
                                console.log(`AppStateRepo: parent found appId: ${id}, appMode: ${appMode}, parentId ${parentId}`);
                                resolve(parentId)
                            } else {
                                resolve(null);
                            }
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo: _getParent SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo: _getParent TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo: _getParent TX success.');
                });
        });

    };

    const hasState = function(appId, appMode, user, domain) {
        console.log(`AppStateRepo#hasState: appId: ${appId}, appMode: ${appMode}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [appId, appMode, user, domain];
                    const stmt = 'SELECT appId FROM microAppStates WHERE appId = ? AND appMode = ? AND transient = 0 AND username = ? AND domain = ?';
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo#_hasState appsRead: ${rs.rows.length}`);
                            resolve(rs.rows.length > 0);
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo#_hasState SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo#_hasState TX error.';
                    console.error(errMsg, error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo#_hasState TX success.');
                });
        });

    };

    const getChildForParent = function(parentId, mode, user, domain) {
        console.log(`AppStateRepo#getChildForParent: ${parentId}, mode: ${mode}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [parentId, mode, user, domain];
                    const stmt = 'SELECT appId FROM microAppStates WHERE parentAppId = ? AND appMode = ? AND transient = 0 AND username = ? AND domain = ?';
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo#_getChildForParent appsRead: ${rs.rows.length}`);

                            if (rs.rows.length > 0) {
                                // TODO: 2019-05-30 In future, to support multiple chains of state, we would need to
                                //  return all matching parents instead of one.
                                const row = rs.rows.item(0);
                                const appId = row.appId;
                                console.log(`AppStateRepo: child found for parentId ${parentId}, appId: ${parentId}`);
                                resolve(appId)
                            } else {
                                resolve(null);
                            }
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo: _getChildForParent SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                parentAppId: parentId,
                                appMode: mode,
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo: _getChildForParent TX error.';
                    console.error(errMsg, error);
                    rLog.log({
                        sqlError: error.message,
                        parentAppId: parentId,
                        appMode: mode,
                    }, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo: _getChildForParent TX success.');
                });
        });

    };

    const retrieveState = function(appId, appMode, user, domain) {
        console.log(`AppStateRepo#_retrieveState: appId ${appId}, appMode: ${appMode}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [appId, appMode, user, domain];
                    const stmt = 'SELECT state FROM microAppStates WHERE appId = ? AND appMode = ? AND username = ? AND domain = ?';
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo#_retrieveState apps states read: ${rs.rows.length}`);

                            const states = [];

                            for (let i = 0; i < rs.rows.length; i++) {
                                const row = rs.rows.item(0);
                                const state = row.state;
                                states.push(state);
                                console.log(`AppStateRepo: state retrieved appId ${appId}, appMode: ${appMode}, state: `, state);
                            }

                            resolve(states);
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo_retrieveState SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                appId: appId,
                                appMode: appMode,
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo#_retrieveState TX error.';
                    console.error(errMsg, error);
                    rLog.log({
                        sqlError: error.message,
                        errorCode: error.code,
                        appId: appId,
                        appMode: appMode,
                    }, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo#_retrieveState TX success.');
                });
        });

    };

    const dropState = function(appId, appMode, isTransient, user, domain) {
        console.log(`AppStateRepo#dropState: appId ${appId}, appMode: ${appMode}, isTransient: ${isTransient}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [appId, appMode, Number(isTransient), user, domain];
                    const stmt = 'DELETE FROM microAppStates WHERE appId = ? AND appMode = ? AND transient = ? AND username = ? AND domain = ?';
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo: state dropped appId ${appId}, appMode: ${appMode}`);
                            resolve();
                        },
                        function (tx, error) {
                            const errMsg = `_dropState SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                appId: appId,
                                appMode: appMode,
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo#_retrieveState TX error.';
                    console.error(errMsg, error);
                    rLog.log({
                        sqlError: error.message,
                        errorCode: error.code,
                        appId: appId,
                        appMode: appMode,
                    }, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo#_retrieveState TX success.');
                });
        });
    };

    const dropAll = function(user, domain, transientOnly) {
        console.log(`AppStateRepo#dropAll: user: ${user}, domain: ${domain}, transientOnly:${transientOnly}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {

                    let stmt = `DELETE FROM microAppStates WHERE ${transientOnly ? 'transient = 1 AND' : ''} username = ? AND domain = ?`
                    const  params = [user, domain];

                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo: states dropped`);
                            resolve();
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo#_dropAll SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo#_dropAll TX error.';
                    console.error(errMsg, error);
                    rLog.log({
                        sqlError: error.message,
                        errorCode: error.code,
                    }, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo#_dropAll TX success.');
                });
        });
    };

    const getAllExcludeState = function(user, domain, excludeTransient = true) {
        console.log(`AppStateRepo#getAllExcludeState: user: ${user}, domain: ${domain}`);

        const arr = [];

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [user, domain];
                    const stmt = `SELECT appId, appMode, parentAppId FROM microAppStates WHERE ${excludeTransient ? 'transient = 0 AND' : '' } username = ? AND domain = ?`;
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo#_getAllExcludeState apps states read: ${rs.rows.length}`);

                            for (let i = 0; i < rs.rows.length; i++) {
                                const row = rs.rows.item(i);
                                arr.push(row);
                            }
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo#_getAllExcludeState SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo#_getAllExcludeState TX error.';
                    console.error(errMsg, error);
                    rLog.log({
                        sqlError: error.message,
                        errorCode: error.code,
                    }, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo#_getAllExcludeState TX success.');
                    resolve(arr);
                });
        });

    };

    /**
     * Resolves to "true" user/domain pair has a non transient state for any app.
     * @param user
     * @param domain
     */
    const stateExists = function(user, domain) {
        console.log(`AppStateRepo#stateExists: user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {
                    const params = [user, domain];
                    const stmt = 'SELECT appId FROM microAppStates WHERE username = ? AND domain = ? AND transient = 0 LIMIT 1';
                    tx.executeSql(stmt, params,
                        function (tx, rs) {
                            console.log(`AppStateRepo#_stateExists: ${rs.rows.length > 0}`);
                            resolve(rs.rows.length > 0);
                        },
                        function (tx, error) {
                            const errMsg = `AppStateRepo#_stateExists SELECT SLQ error.`;
                            console.error(errMsg, error);
                            rLog.log({
                                sqlError: error.message,
                                errorCode: error.code
                            }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                            return true;
                        });
                },
                function (error) {
                    const errMsg = 'AppStateRepo#_stateExists TX error.';
                    console.error(errMsg, error);
                    rLog.log({
                        sqlError: error.message,
                        errorCode: error.code,
                    }, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(errMsg);
                },
                function () {
                    console.log('DeploymentsRepo#_stateExists TX success.');
                });
        });
    };



    return {
        init,
        isInitialised,
        persistState,
        retrieveState,
        getParent,
        hasState,
        getChildForParent,
        dropState,
        dropAll,
        getAllExcludeState,
        stateExists
    };
})();
