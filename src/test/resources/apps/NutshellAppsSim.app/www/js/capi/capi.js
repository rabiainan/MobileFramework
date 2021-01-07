/**
 * This module exposes other modules tu be used as part of Container API.
 * @type {{init, state, camera}}
 */
const Capi = (function() {

    const VERSION = 0;

    let _state    = null;
    let _camera   = null;
    let _dialog   = null;
    let _app      = null;
    let _contacts = null;
    let _network  = null;

    const _init = function (config) {
        console.log(`Capi#init: config: ${config}`);
        return new Promise((resolve, reject) => {

            if (!config.state || !config.dialog || !config.app || !config.contacts || !config.network) {

                const errMsg = "Cannot initialise container API";
                console.error(errMsg);
                rLog.log({
                    config: config,
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            } else {
                _state    = config.state;
                _camera   = config.camera;
                _dialog   = config.dialog;
                _app      = config.app;
                _contacts = config.contacts;
                _network  = config.network;
                resolve();
            }
        });
    };

    return {
        init: _init,
        get state() {
            return _state;
        },
        get dialog() {
            return _dialog;
        },
        get app() {
            return _app;
        },
        get contacts() {
            return _contacts;
        },
        get network() {
            return _network;
        },
        get VERSION() {
            return VERSION;
        }
    }
})();
