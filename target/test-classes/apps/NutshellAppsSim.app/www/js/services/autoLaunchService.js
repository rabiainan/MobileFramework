const AutoLaunchService = (function() {

    const AUTO_APP_LAUNCH_FLAG = 'autoAppLaunch';

    let _microAppService   = null;
    let _deploymentService = null;
    let _preLoadedAutoApp  = null;

    const _init = function (microAppService, deploymentService, href) {
        console.log(`AppAutoLaunchService#_init: ${href}`);
            _deploymentService = deploymentService;
            _microAppService   = microAppService;
            _resetFlag(href);
            return Promise.resolve();
    };

    const _resetFlag = function (href) {
        console.log(`AppAutoLaunchService#_adjustFlag: ${href}`);

        if (href.includes("index.html") || href.includes("app.html")) {
            localStorage.setItem(AUTO_APP_LAUNCH_FLAG, "allowed");
        }

    };

    const _preLoadApp = function() {
        if (_microAppService) {
            const osType = Utils.getCurrentOsType();
            let compatibleApps = [];

            return _microAppService.getAutoLaunch().then(autoApps => {
                    const promises = [];

                    autoApps.forEach(autoApp => {
                        promises.push(_deploymentService.hasCompatibleModes(autoApp.id, osType).then(hasCompatibleModes => {
                            if (hasCompatibleModes) {
                                compatibleApps.push(autoApp);
                            }
                        }));
                    });

                    return Promise.all(promises);

                }).then(() => {
                    let app = null;


                    // Get highest id one.
                    if (compatibleApps.length > 0) {
                         app = compatibleApps.reduce((a, b) => {
                            const diff = a.id - b.id;
                            if (diff >= 0) {
                                return a;
                            } else {
                                return b;
                            }
                        });
                    }

                    console.log(`AppAutoLaunchService#_preLoadApp: preloaded autoApp:`, app);

                    if (app) {
                        _preLoadedAutoApp = app;
                    }
                    return Promise.resolve();
            });

        } else {
            return Promise.resolve();
        }
    };

    const _isAutoLaunchAllowed = function() {
        return localStorage.getItem(AUTO_APP_LAUNCH_FLAG) === "allowed";
    };

    const _disableAutoLaunch = function() {
        return localStorage.removeItem(AUTO_APP_LAUNCH_FLAG);
    };

    const _autoLaunch = function() {

        return new Promise((resolve, reject) => {
            // Do not attempt to launch app if domain not yet synced.
            if (!_isDomainSynced() || !_isLastSyncSuccess()) {
                resolve();
                return;
            }

            _preLoadApp().then(() => {
                if (_isAutoLaunchAllowed() && _preLoadedAutoApp) {
                    console.log(`AutoLaunchService: Launching auto app:`, _preLoadedAutoApp);

                    _launchApp(_preLoadedAutoApp.id, _preLoadedAutoApp.name);
                    // No need to resolve as by now href will already be changed.

                } else {
                    resolve();
                }
            });
        });
    };

    const _launchApp = function(id, name) {
        localStorage.setItem("appID", id);
        localStorage.setItem("appName", name);
        NsNavigator.navigateToScreen('app.html');
    };

    const _isDomainSynced = function() {
        return localStorage.getItem('lastSyncedDomain') === ConfigManager.domain
            && localStorage.getItem('lastSyncedUser') === ConfigManager.user;
    };

    const _isLastSyncSuccess = function() {
        return localStorage.getItem("lastSyncStatus") === 'success';
    };

    return {
        init: _init,
        isAutoLaunchAllowed: _isAutoLaunchAllowed,
        disableAutoLaunch: _disableAutoLaunch,
        autoLaunch: _autoLaunch,
        isDomainSynced: _isDomainSynced,
    }
})();
