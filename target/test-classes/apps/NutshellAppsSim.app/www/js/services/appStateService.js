const AppStateService = (function(){

    let _repo = null;
    let _appLauncherService = null;
    let _user = null;
    let _domain = null;

    const init = function(repo, appLauncherService, user, domain) {
        console.log(`AppStateService#init user: ${user}, domain: ${domain}, appLauncherService: ${appLauncherService}, repo:`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _appLauncherService = appLauncherService;
                _repo = repo;
                _user = user;
                _domain = domain;
                res();
            } else {
                rej('AppState repository not initialised!');
            }
        });
    };

    const saveState = function(appId, appMode, parentAppId, state) {
        console.log(`AppStateService#save appId: ${appId}, appMode: ${appMode}, parentAppId: ${parentAppId}`);

        // Parent state might not exist if it was cleared by a link. Then set parent to 0.
        return _repo.hasState(parentAppId, appMode, _user, _domain).then(parentStateExists => {

            if (!parentStateExists) {
                parentAppId = 0;
            }

            return _repo.persistState(appId, appMode, parentAppId, _user, _domain, state, false);
        });
};

    const saveTransientState = function(appId, appMode, state) {
        console.log(`AppStateService#saveTransientState appId: ${appId}, appMode: ${appMode}`);
        // 0 - as parent app ID as we do not allow transient app chaining.
        return _repo.persistState(appId, appMode, 0, _user, _domain, state, true);
    };

    const findOrigin = function(depReq) {
        console.log(`AppStateService#findOrigin appId: depReq:`, depReq);

        return new Promise((resolve, reject) => {
            reject("NOT YET IMPLEMENTED")
        });
    };

    /**
     * Determines which deployment should be loaded based on DeploymentRequest object given as a parameter.
     * @private
     * @param depReq
     * @returns {Promise<any>} Resolves to DeploymentRequest object to be used for app loading.
     */
    const findHead = function(depReq) {
        console.log(`AppStateService#findHead appId: depReq:`, depReq);

        const originalDepReq = Object.assign({}, depReq);

        return new Promise((resolve, reject) => {

            hasState(depReq.appId, depReq.mode).then(hasState => {
                if (hasState) {
                    return _findYoungestChild(depReq.appId, depReq.mode).then(headId => {
                        depReq.appId = headId;
                        return _repo.getParent(headId, depReq.mode, _user, _domain);
                    }).then(parentId => {
                        depReq.parentAppId = parentId;
                        return MicroAppService.getById(depReq.appId);
                    }).then(microApp => {
                        depReq.name = microApp.name;
                        console.log(`AppStateService#_findHead, head established:`, depReq);
                        resolve(depReq);
                    })
                } else {
                    resolve(depReq);
                }
            }).catch(err => {
                const errMsg = "Failed to establish the head app in from of the state chain";
                console.error(errMsg, err);
                rLog.log({
                    reqDep: depReq,
                    originalDepReq: originalDepReq
                }, errMsg, rLog.level.ERROR, [rLog.tag.STATE, rLog.tag.SERVICE]);
                reject(errMsg);
            });

        });
    };

    const _findYoungestChild = function(id, mode) {
        return new Promise((resolve, reject) => {
            _findYoungestChildRecursive(null, id, mode, headId => resolve(headId))
        });
    };

    const _findYoungestChildRecursive = function(prevId, id, mode, callback) {

            if (!id) {
                callback(prevId);
                return;
            }

            _repo.getChildForParent(id, mode, _user, _domain).then(childAppId => {
                return _findYoungestChildRecursive(id, childAppId, mode, callback);
            });
    };

    const getState = function(appId, appMode) {
        console.log(`AppStateService#getState appId: ${appId}, appMOde: ${appMode}`);
        return new Promise((resolve, reject) => {
            _repo.retrieveState(appId, appMode, _user, _domain).then(states => {
                if (states.length === 0) {
                    resolve(null);
                } else if(states.length === 1) {
                    resolve(states.pop());
                } else {
                    /*
                     * This should never happen as there should never be two states for the same app transient or not.
                     * If by some voodoo this happens then log error, and return one state, preferably non transient one.
                     */
                    const errMsg = `Multiple states found for appId: ${appId}, appMode: ${appMode}}`;
                    console.error(errMsg);
                    rLog.log({
                        appId: appId,
                        appMode: appMode,
                        states: states
                    }, errMsg, rLog.level.ERROR, [rLog.tag.STATE, rLog.tag.SERVICE]);

                    const nonTransientState = states.find(state => !state.transient);
                    if (nonTransientState) {
                        resolve(nonTransientState);
                    } else {
                        resolve(states.pop());
                    }
                }
            });

        })
    };

    /**
     * Function to detect if an app has a state stored.
     * @returns {Promise<any>} Resolves to "true" is an app has stored state, "false" otherwise.
     */
    const hasState = function(appId, appMode) {
        console.log(`AppStateService#hasState appId: ${appId}, appMode: ${appMode}`);
        return _repo.hasState(appId, appMode, _user, _domain);
    };

    const removeState = function(appId, appMode, clearChain, launchOrigin) {
        console.log(`AppStateService#removeState appId: ${appId}, appMode: ${appMode}, clearChain: ${clearChain}`);

        return new Promise((resolve, reject) => {
            if (clearChain) {
                _removeStateRecurse(appId, appMode).then(() => {
                    // At this point the page will be reloaded so no need to resolve.

                    if (launchOrigin) {
                        _appLauncherService.launchOrigin();
                    } else {
                        resolve();
                    }
                }).catch(err => {
                    reject();
                });
            } else {
                _repo.dropState(appId, appMode, false, _user, _domain).then(() => {
                    resolve();
                }).catch(err => {
                    reject();
                });
            }
        });

    };

    const _removeStateRecurse = function(appId, appMode) {
        console.log(`AppStateService:_removeStateRecurse appId: ${appId}, appMode: ${appMode}`);

        let parentId = null;

        if (appId === null || appId === 0) {
            return Promise.resolve();
        } else {
            return _repo.getParent(appId, appMode, _user, _domain).then(pId  => {
                console.log(`AppStateService:_removeStateRecurse parent found pId: ${pId}: ${appId}, appMode: ${appMode}`);
                parentId = pId;
                return _repo.dropState(appId, appMode, false, _user, _domain);
            }).then(() => {
                return _removeStateRecurse(parentId, appMode);
            });
        }
    };

    /**
     * To get all a list of all app states excluding the state itself.
     * @returns {Promise<any>}
     * @private
     */
    const getAllExcludeState = function (excludeTransient = true) {
        console.log(`AppStateService#getAll`);
        return _repo.getAllExcludeState(_user, _domain, excludeTransient);
    };


    const removeAll = function(transientOnly = false) {
        console.log(`AppStateService#removeAll`);
        return _repo.dropAll(_user, _domain, transientOnly);
    };

    const stateExists = function () {
        return _repo.stateExists(_user, _domain);
    };

    return {
        init,
        saveState,
        saveTransientState,
        findOrigin,
        findHead,
        getState,
        hasState,
        removeState,
        removeAll,
        getAllExcludeState,
        stateExists
    }

})();
