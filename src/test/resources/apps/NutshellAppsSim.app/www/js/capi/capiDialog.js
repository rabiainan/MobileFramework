/**
 * Module to manage dialogs which would to be exposed to compiled app via Nutshell API.
 * NOTE: All functions exposed by this module are to be treated as part of container API. Changes, therefore, are most
 * likely to be breaking ones.
 */
const CapiDialog = (function() {

    let _service = null;

    const _init = function (service) {
        console.log(`Dialog#init: service: ${service}`);
        return new Promise((resolve, reject) => {

            if (!service) {

                const errMsg = "Cannot initialise Capi dialog ";
                console.error(errMsg);
                rLog.log({
                    service: service,
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)
            } else {
                _service = service;
                resolve();
            }
        });
    };

    const _show = function (title, message, buttons) {
        console.log(`Dialog#_show: title: ${title}, message: ${message}, buttons: ${buttons}`);
        return _service.show(title, message, buttons);
    };

    return {
        init: _init,
        show: _show
    }

})();
