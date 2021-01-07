/**
 * Module to provide information about the running app which should be exposed to compiled app via Nutshell API.
 * NOTE: All functions exposed by this module are to be treated as part of container API. Changes, therefore, are most
 * likely to be breaking ones.
 */
const CapiApp = (function() {

    let _appLauncherService = null;
    let _deploymentService = null;

    const _deepLinkListeners = [];

    const init = function (appLauncherService, deploymentService) {
        console.log(`Capi.app#_init: appLauncherService: ${appLauncherService}, deploymentService: ${deploymentService}`);
        return new Promise((resolve, reject) => {

            if (!appLauncherService || !deploymentService) {

                const errMsg = "Cannot initialise Capi App ";
                console.error(errMsg);
                rLog.log({
                    appLauncherService: appLauncherService,
                    deploymentService: deploymentService,
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            } else {
                _appLauncherService = appLauncherService;
                _deploymentService = deploymentService;
                resolve();
            }
        });
    };

    /**
     * Returns true iff currently running app was launched by another app.
     */
    const isInChain = function () {
        console.log(`Capi.app#_wasLaunched`);
        return _appLauncherService.hasParent();
    };

    const compatibleDestinationExists = function(appId) {
        console.log(`Capi.app#_compatibleDestinationExists`);

        const osType = Utils.getCurrentOsType();
        const currentAppMode = _appLauncherService.getCurrentDeploymentMode();

        return new Promise((resolve, reject) => {
            _deploymentService.getAvailableCompatibleModes(appId, osType).then(modes => {
                resolve(modes.includes(currentAppMode));
            }).catch(err => {
                reject(err);
            });
        });
    }

    const getAppLinkParameters = function() {
        const params = localStorage.getItem('deepLinkParams');
        return JSON.parse(params);
    }

    const attachOnAppLinkListener = function(listener) {
        if (typeof listener !== "function") {
            rLog.log({
               listener: listener
            }, "DeepLinkListener not a function", rLog.level.CRITICAL, [rLog.tag.CAPI]);
            throw new Error('CapiApp#attachOnAppLinkListener. Listener must be a function!');
        }

        if(!_deepLinkListeners.includes(listener)) {
            _deepLinkListeners.push(listener);
        }
    }

    /**
     * Not used by compiled app.
     */
    const onDeepLink = function() {
        for (const listener of _deepLinkListeners) {
            listener();
        }
    };

    return {
        init,
        isInChain,
        compatibleDestinationExists,
        getAppLinkParameters,
        attachOnAppLinkListener,
        onDeepLink
    }

})();
