/**
 * Module to manage app state which is to be exposed to compiled app via Nutshell API.
 * NOTE: All functions exposed by this module are to be treated as part of container API. Changes, therefore, are most
 * likely to be breaking ones.
 */
const CapiState = (function() {

    let _appId = null;
    let _appMode = null;
    let _parentAppId = null;
    let _service = null;
    let _busy = 0;
    let _busyCallbacks = [];

    const init = function (appId, appMode, parentAppId, service) {
        console.log(`Capi.state#init: appId: ${appId}, appMode: ${appMode}, parentAppId: ${parentAppId}, service: ${service}`);
        return new Promise((resolve, reject) => {

            if (!service || !appId || !appMode) {

                const errMsg = "Cannot initialise Capi State ";
                console.error(errMsg);
                rLog.log({
                    service: service,
                    appId: appId,
                    appMode: appMode,
                    parentAppId: parentAppId
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            } else {
                _appId = appId;
                _appMode = appMode;
                _parentAppId = parentAppId;
                _service = service;
                resolve();
            }
        });
    };

    /**
     * Function to persist state of a compiled app.
     * @param state
     * @returns {Promise<any>}
     * @private
     */
    const save = function (state) {
        console.log(`Capi.state#save: state:`, state);
        if (typeof state !== "string") {
            try {
                state = JSON.stringify(state);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return _service.saveState(_appId, _appMode, _parentAppId, state);
    };

    /**
     * Function to persist *transient* state of a compiled app.
     * @param state
     * @returns {Promise<any>}
     * @private
     */
    const saveTransient = function (state) {
        console.log(`Capi.state#saveTransient: state:`, state);
        if (typeof state !== "string") {
            try {
                state = JSON.stringify(state);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return _service.saveTransientState(_appId, _appMode, state);
    };

    /**
     * Function to retrieve the state of currently running app.
     * @returns {Promise<any>}
     * @private
     */
    const retrieve = function () {
        console.log(`Capi.state#retrieve`);

        return new Promise((resolve, reject) => {
            _incrementBusy();
            _service.getState(_appId, _appMode).then(state => {
                console.log(`State#_retrieve: state for app id: ${_appId}, mode: ${_appMode}, state:`, state);

                if (!state) {
                    resolve(null);
                } else {
                    resolve(state)
                }
            }).catch(err => {
                const errMsg = "State retrieve error!";
                console.error(errMsg, err);
                rLog.log({
                    appId: _appId,
                    parentAppId: _parentAppId,
                    err: err
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            }).finally(() => {
                _decrementBusy();
            });

        });
    };

    /**
     * Function to clear the state of currently running app.
     * @param appId
     * @returns {Promise<any>}
     * @private
     */
    const clear = function () {
        console.log(`State#clear`);

        return new Promise((resolve, reject) => {

            _incrementBusy();
            _service.removeState(_appId, _appMode, false).then( () => {
                console.log(`State#_clear: state for app id: ${_appId} has bee removed`);
                resolve();
            }).catch(err => {
                const errMsg = "State clear error!";
                console.error(errMsg, err);
                rLog.log({
                    appId: _appId,
                    parentAppId: _parentAppId,
                    err: err
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            }).finally(() => {
                _decrementBusy();
            });

        });
    };

    /**
     * Function to clear the state of entire chain of currently running app.
     * @returns {Promise<any>}
     * @private
     */
    const clearChain = function (launchOrigin) {
        console.log(`State#clearChain`);

        return new Promise((resolve, reject) => {

            _incrementBusy();
            _service.removeState(_appId, _appMode, true, launchOrigin).then( () => {
                console.log(`State#_clear: state for app id: ${_appId}, mode: ${_appMode} and its chain has bee removed`);
                resolve();
            }).catch(err => {
                const errMsg = "State chain clear error!";
                console.error(errMsg, err);
                rLog.log({
                    appId: _appId,
                    parentAppId: _parentAppId,
                    err: err
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            }).finally(() => {
                _decrementBusy();
            });
        });
    };

    const _isBusy = function () {
        return _busy !== 0;
    }

    const _incrementBusy = function () {
        _busy++;
    };

    const _decrementBusy = function (busy) {
        _busy--;

        if (!_isBusy()) {
            _processBusyCallbacks();
        }
    };

    const _processBusyCallbacks = function() {
        while (_busyCallbacks.length > 0) {
            if (!_isBusy()) {
                const bc = _busyCallbacks.shift();
                bc();
            } else {
                return;
            }
        }
    };

    const onStateSettled = function (callback) {
        if (_isBusy()) {
            _busyCallbacks.push(callback);
        } else {
            callback();
        }
    };

    return {
        init,
        save,
        saveTransient,
        retrieve,
        clear,
        clearChain,
        onStateSettled
    }

})();
