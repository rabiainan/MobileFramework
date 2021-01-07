// TODO: 2019-05-31 Content of this module would really need to be refactored to separate presentation from business logic
const AppLauncherService = (function() {

    let _deploymentService = null;
    let _microAppService = null;
    let _appStateService = null;
    let _dataStructureService = null;
    let _depReq = null;

    const init = function (deploymentService, microAppService, appStateService, dataStructureService) {
        console.log(`AppLauncherService#_init: deploymentService: ${deploymentService}, microAppService: ${microAppService}, appStateService: ${appStateService}, dataStructureService: ${dataStructureService}`);

        if (deploymentService && microAppService && appStateService && dataStructureService) {
            _deploymentService = deploymentService;
            _microAppService = microAppService;
            _appStateService = appStateService;
            _dataStructureService = dataStructureService;
            return Promise.resolve();
        } else {
            rLog.log({
                deploymentService: deploymentService,
                microAppService: microAppService,
                appStateService: appStateService,
                dataStructureService: dataStructureService
            }, 'AppLauncherService cannot be initialised; wrong parameters', rLog.level.ERROR, [rLog.tag.SERVICE, rLog.tag.APP]);
            return Promise.reject();
        }
    };

    const requestAppLaunch = function(appId) {
        console.log(`AppLauncherService#requestAppLaunch: appId:`, appId);
        return new Promise((resolve, reject) => {
            _microAppService.getById(appId).then(app => {
                if (!app) {
                    reject(errCodes.APP_NOT_FOUND);
                } else if (!canBeOpened(app)) {
                    reject(errCodes.UNOPENABLE_APP);
                } else {
                    _deploymentService.getByAppId(appId, false).then(deployments => {
                        app.deployments = deployments;
                        if (!hasCompatibleDeployments(app)) {
                            reject(errCodes.APP_TYPE_INCOMPATIBLE);
                        } else {
                            localStorage.setItem("appID", app.id);
                            localStorage.setItem("appName", app.name);
                            NsNavigator.navigateToScreen('app.html');
                        }
                    });
                }
            });
        });
    };

    const canBeOpened = function(app) {
        if (app['appSettingsJSON'] && app['appSettingsJSON']['openable']) {
            if (app['appSettingsJSON']['openable'] === 'setting_no') {
                return  false;
            }
        }
        // Defaults to openable - true. Possibly due to legacy reasons.
        return true;
    };

    const launchApp = function(depReq) {
        console.log(`AppLauncherService#_launchApp: depReq:`, depReq);
        _depReq = depReq;

        if(depReq.jumpMode) {
            depReq.mode = depReq.jumpMode;
            _startDeployment(depReq);
        } else {
            _modeChooser(depReq);
        }

    };


    const launchOrigin = function() {
        console.log(`AppLauncherService#_launchOrigin: current _depReq:`, _depReq);

        if(!_depReq) {
            throw "No origin app found in deployment launch request object"
        }

        // If app was started from home screen then originalParentAppId will be 0, otherwise its an app launch.
        if (_depReq.originalParentAppId === 0) {
            _depReq.resetToOrigin();
        } else {
            _depReq.resetToChain();
        }

        _startDeployment(_depReq);
    };

    function _startDeployment(depReq) {
        console.log(`AppLauncherService#startDeployment depReq: `, depReq);

        _appStateService.findHead(depReq).then(depReq => {
            NavBar.setHeaderTitle(depReq.name);
            localStorage.setItem("appName", depReq.name);
            return _initialiseCapi(depReq);
        }).then(() => {
            return _dataStructureService.injectDataStructures()
        }).then(()=> {
            _deploymentService.getDeployment(depReq.appId, depReq.mode).then(deployment => {
                _injectDeployment(deployment, depReq.appId, depReq.mode);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
                EventBus.dispatch("deploymentLoaded");
            });
        }).catch(err => {
            _deploymentStartError(err);
        });
    }

    function _initialiseCapi(depReq) {
        console.log(`AppLauncherService#initialiseCapi depReq:`, depReq);

        Capi.state.init(depReq.appId, depReq.mode, depReq.parentAppId, _appStateService).then(() => {
            return Capi.dialog.init(DialogService);
        }).then(() => {
            return Capi.app.init(AppLauncherService, DeploymentsService);
        }).then(() => {
            return Capi.contacts.init(ContactsService);
        }).then(() => {
            return Capi.network.init(NetworkService);
        });
    }

    function _modeChooser(depReq){
        console.log(`AppLauncherService#modeChooser depReq`, depReq);

        const osType = Utils.getCurrentOsType();

        _deploymentService.getAvailableCompatibleModes(depReq.appId, osType).then(modes => {
            if (modes.length === 1) {
                depReq.mode = modes.pop();
                _startDeployment(depReq);
            } else if (modes.length > 1) {
                _showModeChooser(modes, chosenMode => {
                    toastr.remove();
                    depReq.mode = chosenMode;
                    _startDeployment(depReq)
                });
            } else {
                _deploymentStartError();
            }
        });
    }

    function _showModeChooser(modes, callback) {
        console.log(`AppLauncherService#showModeChooser modes.length: ${modes.length}`, modes);

        modes = modes.sort();

        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": false,
            "positionClass": "toast-top-center",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": 0,
            "extendedTimeOut": 0,
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut",
            "tapToDismiss": false
        };

        let html = '<table class="choose_app_mode">';

        modes.forEach(mode => {
            const label = mode === 7 ? 'Preview' : mode === 8 ? 'Test' : 'Live';
            const id = label.toLowerCase();
            html += '<tr><td class="radio">';
            html += `<input type="radio" id="${id}" value="${mode}" name="choose_mode" class="choose_mode" />`;
            html += '</td><td class="mode">';
            html += `<label>${label}</label>`;
            html += '</td></tr>';
        });

        html += '<tr><td colspan="2" style="text-align: right;"><button type="button" id="selectAppModeBtn" style="display: none;">Open App</button></td></tr>';
        html += '<table>';

        toastr.warning(html, 'Which app mode would you like to open?');
        $('.toast-top-center').css({'top': '100px'});

        $('.choose_mode').change(e => {
            $('#selectAppModeBtn').show();
        });

        $('#selectAppModeBtn').click(e => {
            const mode = $('.choose_mode:checked').val();
            callback(mode)
        });
    }

    function _injectDeployment(deployment, appId, modeId) {
        console.log(`AppLauncherService#_injectDeployment deployment: ${deployment ? 'Found' : deployment}, appId: ${appId}, mode: ${modeId}`);

        if(localStorage.getItem('jumpAppModeId') == null) {
            localStorage.setItem('jumpAppModeId', modeId);
        }

        if(deployment) {

            /* window.ga.trackEvent('NS App', 'Launch', appId, 0, false,
                data => console.log(`GA: NS App:Launch:${appId}. OK. data: ${data}`),
                err => console.error(`GA: NS App:Launch:${appId}. FAIL. err: ${err}`)
            ); */

            $('.applicationData').html(deployment);
            $('#cover').fadeOut(1000);
            $('.applicationData').show('slow');
            window.dispatchEvent(new Event('resize'));
        } else  {
            _deploymentStartError();
        }
    }

    function _deploymentStartError(err) {
        console.log(`AppLauncherService#_deploymentStartError: err`, err);

        $('#cover').hide();
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-top-center",
            "preventDuplicates": true,
            "onclick": function () {
                    NsNavigator.navigateToScreen('home.html');
                },
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": null,
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        let message = 'There seems to be a problem launching this application. Make sure you have successfully synchronised the container.<b>Please tap this message to return to the home page.</b>';
        if(localStorage.getItem('jumpAppModeId') !== null)
            message = 'Nutshell did not find a matching version of the target app you tried to launch, this may be because the app has not been published or not published for the same mode.<br><br>You will be taken back to the app home page';

        rLog.log({err: err}, message, rLog.level.WARNING, [rLog.tag.APP, rLog.tag.EXPLORER]);

        toastr.error(message, 'Problem Detected.');

        var cx = ($(window).width() - 300) / 2;
        $('.toast-top-center').css({
            'left': cx+'px',
            'top': '100px'
        });
    }

    /**
     * Returns true if currently running app has been launched by another app.
     * @private
     */
    const hasParent = function() {
        console.log(`AppLauncherService#_hasParent returning: ${_depReq.parentAppId !== null}`);
        return _depReq.parentAppId !== 0;
    };

    const getCurrentDeploymentMode = function() {
        return Number(localStorage.getItem('jumpAppModeId'));
    };

    const hasCompatibleDeployments = function(app) {
        if (!app.deployments || app.deployments.length === 0) {
            const errMsg = `No deployments found for app id: ${app.id}`;
            rLog.log({app: app}, errMsg, rLog.level.ERROR, [rLog.tag.SERVICE]);
            console.error(errMsg);
        }

        const osType = Utils.getCurrentOsType();

        for (const deployment of app.deployments) {

            // Legacy deployments might not have settings.Assume mobile compatibility.
            if (!deployment.settings) {
                deployment.settings = {'device-type': AppSettingsHelper.consts.deviceType.PHONE};
            }

            const deviceType = deployment.settings['device-type'];

            if (AppSettingsHelper.isCompatible(osType, deviceType)) {
                return true;
            }
        }

        return false;   // No compatible deployments found.
    };

    const errCodes = {
        APP_NOT_FOUND: "app not found",
        UNOPENABLE_APP: "unopenable app cannot be opened",
        APP_TYPE_INCOMPATIBLE: "app type incompatible with current device"
    }

    return {
        init,
        launchApp,
        requestAppLaunch,
        launchOrigin,
        hasParent,
        getCurrentDeploymentMode,
        hasCompatibleDeployments,
        canBeOpened,
        errCodes
    }

})();
