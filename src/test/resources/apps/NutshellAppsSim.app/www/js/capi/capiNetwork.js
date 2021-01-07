/**
 * Module to provide access to device's network statue. Module should be exposed to compiled app via Nutshell API.
 * NOTE: All functions exposed by this module are to be treated as part of container API. Changes, therefore, are most
 * likely to be breaking ones.
 */
const CapiNetwork = (function() {

    let _networkService = null;

    const init = function (networkService) {
        console.log(`Capi.network#init: _networkService: ${networkService}`);
        return new Promise((resolve, reject) => {

            if (!networkService) {

                const errMsg = "Cannot initialise Capi network ";
                console.error(errMsg);
                rLog.log({
                    networkService: networkService,
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            } else {
                _networkService = networkService;
                resolve();
            }
        });
    };

    const addOnlineListener = function (listener) {
        return _networkService.addOnlineListener(listener);
    };

    const removeOnlineListener = function (listener) {
        return _networkService.removeOnlineListener(listener);
    };

    const isOnline = function () {
        return _networkService.isOnline();
    };

    return {
        init,
        addOnlineListener,
        removeOnlineListener,
        isOnline
    }

})();
