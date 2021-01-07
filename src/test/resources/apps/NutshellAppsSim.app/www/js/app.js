var online = true;
var brandingClickCount = 0;

const loadStartTime = new Date();
console.log("*** app.js load started at: ", loadStartTime.toISOString());


function onDeviceReady() {
    console.log(`*** app.js#onDeviceReady called in: ${new Date() - loadStartTime}`);

    initStarted();

    disableBackButton();
    StatusBar.hide();
    localStorage.removeItem('networkState');

    const domain = localStorage.getItem("domain");
    const user = localStorage.getItem("username");
    const sessionId = localStorage.getItem("session_ID");
    const appName = localStorage.getItem('appName');
    const appID = localStorage.getItem("appID");
    const parentAppId = localStorage.getItem('parentAppID');
    const jumpAppModeId = localStorage.getItem('jumpAppModeId');

    const containerDb = ContainerDatabaseManager.getContainerDb();

    if(!sessionId) {
        Auth.logout();
        return;
    }

    setupKeyboardHideListener();
    NavBar.init();

    // NOTE! the order here matters!
    FirebaseService.init().then(() => {
        NsNavigator.init(firebase);
        return rLog.init(domain, user, sessionId);
    }).then(function() {
        return FirebaseService.authenticate();
    }).then(function() {
        return NS.init();
    }).then(function() {
        return NA.init(user, domain);
    }).then(function() {
        return AppStateRepo.init(containerDb);
    }).then(function() {
        return MicroAppsRepo.init(containerDb);
    }).then(function() {
        return ConfigManager.init(domain, user, sessionId);
    }).then(function() {
        return AppStateService.init(AppStateRepo, AppLauncherService, ConfigManager.user, ConfigManager.domain);
    }).then(function() {
        return MicroAppService.init(MicroAppsRepo, ConfigManager.user, ConfigManager.domain);
    }).then(function() {
        return DeploymentsRepo.init(containerDb);
    }).then(function() {
        return DeploymentsService.init(DeploymentsRepo, user, domain);
    }).then(function() {
        return DataStructuresRepo.init(containerDb);
    }).then(function() {
        return DataStructureService.init(DataStructuresRepo, user, domain);
    }).then(function() {
        return AppLauncherService.init(DeploymentsService, MicroAppService, AppStateService, DataStructureService);
    }).then(function() {
        return ContactsRepo.init(navigator.contacts);
    }).then(function() {
        return ContactsService.init(ContactsRepo);
    }).then(function() {
        return NetworkService.init();
    }).then(function() {
        return NutshellMessageRepo.init(FirebaseService.getFirestore());
    }).then(function() {
        return NutshellMessageService.init(ConfigManager.user, ConfigManager.domain, Utils.getDeviceUuid(), NutshellMessageRepo);
    }).then(function() {
        // const dialogController = new DialogControllerJQUI($('.capi .dialog'));
        const dialogController = new DialogControllerJQConfirm();
        return DialogService.init(dialogController, user, domain);
    }).then(function() {
        const deepLinkHandler = new DeepLinkHandlerApp(appID, navigateToHome, CapiApp.onDeepLink);
        return DeepLinkService.init(user, domain, deepLinkHandler);
    }).then(() => {
        return Capi.init({
            state: CapiState,
            dialog: CapiDialog,
            app: CapiApp,
            contacts: CapiContacts,
            network: CapiNetwork
        });
    }).then(function() {
        FirebaseService.onLogout(() => {
            console.error("Container Firebase user logged out!");
            const content = 'Error occurred. Please re-login<br><button type="button" class="btn clear">Logout</button>';
            showToastrMessage(content, 'Error', 0, false, Auth.logout, {"closeButton": false});
        });
        return Promise.resolve();
    }).then(function() {
        return BrandingService.init(domain);
    }).then(function() {
        return AutoLaunchService.init(MicroAppService, DeploymentsService, window.location.href);
    }).then(function() {
        // window.ga.trackView('app.html');
        setupMvpComponents();
        initDeviceLogger();
        setupErrorHandling();

        console.log(`*** app.js: initialisation completed in: ${new Date() - loadStartTime}`);
    }).then(function() {
        beginDeploymentLoadProcess(appName, appID, parentAppId, jumpAppModeId);
        console.log(`*** app.js: deployment injected in: ${new Date() - loadStartTime}`);
    }).catch(function(err) {
        console.error("app.js failed to initialize NS.");
        console.error(err);

        var content = 'Failed to initialise the app:<br><button type="button" class="btn clear">Logout</button>';

        showToastrMessage(content, 'Configuration Error', 0, false, Auth.logout, {"closeButton": false});
    });
}

function initStarted() {
    const loadingContainerDiv = document.querySelector('#loading-spinner-container');
    const textDiv = document.querySelector('.loading-spinner.container > .text');
    const model = new LoadingSpinnerModel(BrandingService);
    const view = new LoadingSpinnerView(loadingContainerDiv, textDiv);
    new LoadingSpinnerPresenter(model, view, EventBus);
}

/**
 * Setup handlers for script errors (runtime errors).
 */
function setupErrorHandling() {

    // return true to prevent browser from displaying error
    window.onerror = function (msg, url, line, columnNo, error) {
        console.error(error);

        if (device.platform === 'iOS') {
            /*
             * Code below is just to mitigate firebase issues where it drops dead on iOS 13.6 devices if put to background
             * and network connection gets toggled. See NSS-411 for more info. Logic should be removed once Firebase (or iOS)
             * resolves this issue.
             */
            FirebaseService.isDead().then(isDead => {
                if (isDead) {
                    /*
                    * FB is found dead at this point we will silently ignore all other window errors and hope users reload the
                    * app soon. At this point we'll show the warning toastr every 5 minutes if the issue still persists.
                    */
                    if (!ToastrAlert.isFbDeadAlertShown) {
                        showWarning(ToastrAlert.FB_DEAD);
                        ToastrAlert.isFbDeadAlertShown = true;
                        setTimeout(() => ToastrAlert.isFbDeadAlertShown = false, 5 * 60 * 1000);
                    }
                } else {
                    alert("Error on line " + line + " in " + url + ":\n" + msg);
                }
            }).catch(e => {
                console.error("Failed to check vitals of FB. Presume dead.", e);
                if (!ToastrAlert.isFbDeadAlertShown) {
                    showWarning(ToastrAlert.FB_DEAD);
                    ToastrAlert.isFbDeadAlertShown = true;
                    setTimeout(() => ToastrAlert.isFbDeadAlertShown = false, 5 * 60 * 1000);
                }
            });
        } else {
            alert("Error on line " + line + " in " + url + ":\n" + msg);
        }

        return true;
    };

    window.addEventListener('error', function(e) {
        const acceptedErrors = [
            'ResizeObserver loop limit exceeded'
        ];

        const appName = localStorage.getItem('appName');
        const appID = localStorage.getItem("appID");
        const parentAppId = localStorage.getItem('parentAppID');
        const jumpAppModeId = localStorage.getItem('jumpAppModeId');

        console.error(e);
        const error = e.error;
        const errData = {
            appName: appName,
            appId: appID,
            parentAppId: parentAppId,
            jumpAppModeId: jumpAppModeId,
            Message: e.message || null,
            Line: e.lineno || null,
            Column: e.colno || null,
            filename: e.filename || null,
            errObj: JSON.stringify(e.error) || null
        };

        if (error) {
            errData.errMsg = error.message || null;
            errData.errStack = error.stack || null;

        }

        let logLevel = rlog.level.CRITICAL;
        if (acceptedErrors.includes(e.message)) {
            console.warn('Suppressed error: ', e);
            logLevel = rlog.level.WARNING;
        } else {
            alert("Error on line " + e.lineno + " in " + e.filename + ":\n" + e.message);
        }

        rLog.log(errData, e.message, logLevel, [rLog.tag.APP]);
        return false;
    });
}

/**
 * This function is used to address iOS issue where the keyboard closing by clicking off causes viewport not to return
 * to previous position. This is similar to iOS 12 keyboard viewport issue which is caused by a bug in WebView.
 */
function setupKeyboardHideListener() {
    console.log(`App.js #setupKeyboardHideListener`);

    // Detect the event and apply the normal height in the event the keyboard will hide.
    window.addEventListener('keyboardWillHide', function () {
        console.log(`App.js key board hide detected, adjusting html elem height.`);

        document.getElementsByTagName('html')[0].style.height = '101vh';
        setTimeout(()=>{
            document.getElementsByTagName('html')[0].style.height = '100vh';
        }, 350);
    });
}

function initDeviceLogger() {
    var debugLogContent = $('.debug_console.content');

    if (ConfigManager.isDebug) {
        DeviceLogger.init(debugLogContent);
    }
}

function brandingClickListener(event) {
    if (!ConfigManager.isDebug) {
        return;
    }

    brandingClickCount++;
    if (brandingClickCount >= 5) {
        brandingClickCount = 0;
        toggleDebugConsole();
    } else {
        setTimeout(() => brandingClickCount = 0, 1500);
    }
}

function toggleDebugConsole() {
    var debugLogContainer = $('.debug_console.container');

    if (debugLogContainer.is(":visible")) {
        debugLogContainer.hide();
    } else {
        debugLogContainer.show();
    }
}

/**
 * Called from compiled app MicroAppScript#init
 * @param orientation
 */
function setAppOrientation(orientation) {
    if(orientation === 'any_orientation' || orientation ==='any' || orientation === undefined || orientation === null) {
        orientation = 'portrait';
    }
    screen.orientation.lock(orientation);
}

/**
 * Called from ImageCaptureInput#createElement
 * TODO: Expose it via capi
 */
function capturePhoto() {
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, { quality: 50, destinationType: 0, sourceType: 1, correctOrientation: true });
}

function capturePhotoEdit() {
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, { quality: 50, allowEdit: true, destinationType: 0, correctOrientation: true });
}

function getPhoto() {
    navigator.camera.getPicture(onGetPhotoDataSuccess, onFail, { quality: 50, destinationType: 0, sourceType: 0, correctOrientation: true });
}

function onPhotoDataSuccess(imageData) {
    ImageCaptureInput.AddImageCallback(imageData);
}

function onGetPhotoDataSuccess(imageData) {
    ImageContainer.AddImageCallback(imageData);
}

function onFail(message) {
    console.log('Failed because: ' + message);
}

function onSuccess(position) {
    var element = document.getElementById('geolocation');
    element.innerHTML =
    'Latitude: '           + position.coords.latitude              + '<br />' +
    'Longitude: '          + position.coords.longitude             + '<br />' +
    'Altitude: '           + position.coords.altitude              + '<br />' +
    'Accuracy: '           + position.coords.accuracy              + '<br />' +
    'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
    'Heading: '            + position.coords.heading               + '<br />' +
    'Speed: '              + position.coords.speed                 + '<br />' +
    'Timestamp: '          + position.timestamp                    + '<br />';
}

function beginDeploymentLoadProcess(appName, appID, parentAppId, jumpAppModeId) {
    console.log(`App.js#beginDeploymentLoadProcess: appName: ${appName}, appID: ${appID}, parentAppId: ${parentAppId}, jumpAppMOdeId: ${jumpAppModeId}`);
    const depReq = new DeploymentRequest(appID, parentAppId, null, jumpAppModeId, appName);
    AppLauncherService.launchApp(depReq);
}

function errorCB(err) {
    console.log("Error processing SQL: "+err.message);
}

// Called from compiled app.
function getSessionId() {
    const session = localStorage.getItem("session_ID");
    return session;
}

function onHomeClick(event) {
    console.log("app.js onHomeClick()", event);
    AutoLaunchService.disableAutoLaunch();
    navigateToHome();
}

function navigateToHome () {
    NsNavigator.navigateToScreen('home.html');
}

/**
 * Bootstrapping. Function initialises and wires up all MVP components to be used on this screen.
 */
function setupMvpComponents() {

    function setupAppScreen() {
        const model = new AppScreenModel(BrandingService);
        const view = new AppScreenView(window.document);
        const presenter = new AppScreenPresenter(model, view);
        // TODO: Remove after debugging! 2019-07-18
        window.appView = view;
    }


    function setupNutshellMessageViewApp() {
        // TODO: 19/11/2019 Pass nutshellMessageService to view.
        const model = new NutshellMessageModel(NutshellMessageService, Auth.logout);
        const view = new NutshellMessageView(toastr);
        const presenter = new NutshellMessagePresenter(model, view);

        // TODO: Remove after debugging! 19/11/2019
        window.nutshellMessageModel = model;
        window.nutshellMessageView = view;
        window.nutshellMessagePresenter = presenter;
    }

    setupAppScreen();
    setupNutshellMessageViewApp();

    EventBus.dispatch(NsEvents.SCREEN_READY);
}

function onBackButtonClick(e) {
    console.log(`BackButton clicked`, e);
    e.preventDefault();
}

function disableBackButton() {
    document.addEventListener("backbutton", onBackButtonClick, false);
}

/**
 * Called from compiled app AppointmentContainer
 */
function showEventPopup() {
    $(".blackout").css("display", "block");
    $('#start_date, #end_date, #eventTitle, #eventLocation, #eventNotes').val('');
    $(".spell-content-holder").fadeIn('slow');
}

