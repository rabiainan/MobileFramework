// TODO: Remove after debugging! 24/06/2020
const loadStartTime = new Date();
console.log("*** home.js load started at: ", loadStartTime.toISOString());

function onDeviceReady() {
    initStarted();

    console.log(`*** home.js#onDeviceReady called in: ${new Date() - loadStartTime}`);
    Auth.validateSession();

    StatusBar.hide();
    screen.orientation.unlock();

    prepareLocalStorage();

    const domain = localStorage.getItem("domain");
    const username = localStorage.getItem("username");
    const sessionId = localStorage.getItem('session_ID');
    const serviceUrl = localStorage.getItem("serviceURL");
    const containerDb = ContainerDatabaseManager.getContainerDb();
    const clientTableDb = ContainerDatabaseManager.getNsAppDb();

    NavBar.init();

    // NOTE! the order here matters!
    FirebaseService.init().then(() => {
        NsNavigator.init(firebase);
        return rLog.init(domain, username, sessionId);
    }).then(function() {
        return FirebaseService.authenticate();
    }).then(function () {
        console.log("***** NS.init() loaded at: ", new Date().toISOString());

        return NS.init();
    }).then(function() {
        return NA.init(username, domain);
    }).then(function() {
        return DatabaseMigrationsRepo.init();
    }).then(function() {
        return DatabaseMigrator.updateTo(Conf.DB_VERSION, clientTableDb, DatabaseMigrations_nutshell_db);
    }).then(function() {
        return DatabaseMigrator.updateTo(Conf.DB_VERSION, containerDb, DatabaseMigrations_micro_app);
    }).then(function() {
        return ConfigManager.init(domain, username, sessionId);
    }).then(function() {
        return new Promise((resolve, reject) => {
            DatabaseManager.initDatabase(null, db => {
                db ? resolve() : reject("DatabaseManager has failed to initialise database!");
            });
        });
    }).then(function() {
        return MicroAppsRepo.init(containerDb);
    }).then(function() {
        return MicroAppService.init(MicroAppsRepo, username, domain);
    }).then(function() {
        return DeploymentsRepo.init(containerDb);
    }).then(function() {
        return DeploymentsService.init(DeploymentsRepo, username, domain);
    }).then(function() {
        return FoldersRepo.init(containerDb);
    }).then(function() {
        return FolderImagesRepo.init(containerDb);
    }).then(function() {
        return ClientTableRepo.init(clientTableDb, username, domain);
    }).then(function() {
        return TransactionsRepo.init(clientTableDb);
    }).then(function() {
        return ClientTableService.init(ClientTableRepo, username, domain);
    }).then(function() {
        return DataStructuresRepo.init(containerDb);
    }).then(function() {
        return DataStructureService.init(DataStructuresRepo, username, domain);
    }).then(function() {
        return TransactionsService.init(TransactionsRepo, username, domain);
    }).then(function() {
        return ClientTableSyncManager.init(ClientTableService, DataStructureService, username, domain, sessionId);
    }).then(function() {
        return AppStateRepo.init(containerDb);
    }).then(function() {
        return AppStateService.init(AppStateRepo, AppLauncherService, username, domain);
    }).then(function() {
        return AppLauncherService.init(DeploymentsService, MicroAppService, AppStateService, DataStructureService);
    }).then(function() {
        return BrandingService.init(domain);
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
        return DialogService.init(dialogController, username, domain);
    }).then(function() {
        FirebaseService.onLogout(() => {
            console.error("Container Firebase user logged out!");
            const content = 'Error occurred. Please re-login<br><button type="button" class="btn clear">Logout</button>';
            showToastrMessage(content, 'Error', 0, false, Auth.logout, {"closeButton": false});
        });
        return Promise.resolve();
    }).then(function() {
        // const dialogController = new DialogControllerJQUI($('.capi .dialog'));
        const dialogController = new DialogControllerJQConfirm();
        return DialogService.init(dialogController, username, domain);
    }).then(function() {
        return AutoLaunchService.init(MicroAppService, DeploymentsService, window.location.href);
    }).then(function() {
        const deepLinkHandler = new DeepLinkHandlerHome(AppLauncherService);
        return DeepLinkService.init(username, domain, deepLinkHandler);
    }).then(function() {
        setupErrorHandling();
        const foldersService = new FolderService(username, domain, FoldersRepo);
        const iconService    = new IconService(username, domain, FolderImagesRepo);
        Explorer.create(sessionId, ConfigManager.serviceUrl, foldersService, MicroAppService, iconService, DeploymentsService, AppLauncherService, EventBus);

        initHomeScreen();
        setupMvpComponents();
        logGA();

       if (AutoLaunchService.isDomainSynced()) {

           // TODO: 24/06/2020 This is a dirty hack to prevent auto apps being launched before app links being processed.
           //   Due to a race condition between deep link callback called and app launch.
           //   Is there a better mechanism to solve this problem without using timeouts?
           setTimeout(() => {
                attemptAutoLaunch();
                Explorer.INSTANCE.showFolders();
           }, 300);

       } else {
           attemptSync(null, true);
       }

        console.log(`*** home.js#initialisation completed in: ${new Date() - loadStartTime}`);

    }).catch(function(err) {
        console.error("home.js failed to initialize NS.", err);

        const content = 'Failed to initialise the app:<br><button type="button" class="btn clear">Logout</button>';

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
 * Function to perform any operations needed on localStorage when home screen is loaded. E.g. trim any no longer needed
 * data.
 */
function prepareLocalStorage() {
    localStorage.removeItem('jumpAppModeId');
    localStorage.removeItem('parentAppID');
    localStorage.removeItem("appID");
    localStorage.removeItem("appName");
    localStorage.removeItem('policyPasswordExpired');
    localStorage.removeItem('correctExpiredPassword');
    localStorage.removeItem('dataTransfers');
    localStorage.removeItem('defaultStartScreenId');
    localStorage.removeItem('deepLinkParams');
}

function logGA() {
    //To track a Screen (PageView):
    // window.ga.trackView('home.html');
}

// NOTE: contents of this function were taken from connection.js and placed here temporarily.
// There might be a better structure and location for them.
function attemptSync(dialogMsg, bypassConfirmation) {

    if (ContainerSyncManager.isSyncInProgress()) {
        return;
    }

    const hasConnection = function() {
        return navigator.connection.type !== Connection.NONE;
    }

    const syncAll = function() {
        if (hasConnection()) {
            EventBus.dispatch(NsEvents.SYNC_ALL);
        } else {
            Explorer.INSTANCE.showFolders();
            $('#cover').fadeOut(500);
        }
    }

    const showSyncDeniedDialog = function() {
        Explorer.INSTANCE.showFolders();

        const syncDeniedMsg = 'The sync process cannot be started while you have unfinished sessions saved in your apps. ' +
            'To continue, please clear your saved sessions and try again.';

        const dialog = new DialogControllerJQConfirm();

        dialog.show('Couldn’t Sync', syncDeniedMsg, ['View Saved Sessions', 'Later'], choice => {
            if (choice === 'View Saved Sessions') {
                EventBus.dispatch(StateManagerPresenter.SHOW);
            }
        });
    }

    const showSyncPrompt = function(dialogMsg) {

        const dialog = new DialogControllerJQConfirm();

        if (hasConnection()) {

            const defaultSyncDlgMsg = 'If there are updates available for any of your apps, they’ll be downloaded and ' +
                'installed on your device. It could take a while, depending on how many apps you have. ' +
                'Are you sure you want to do this now?';

            dialog.show('Are you sure?', dialogMsg || defaultSyncDlgMsg, ['Yes', 'Later'], choice => {
                if (choice === 'Yes') {
                    syncAll();
                }
            });

        } else {

            dialog.show('Connection Not Found', 'Network connection is required to refresh the data.', ['OK'], () => {
                // Ignore...
            });

        }
    }

    AppStateService.stateExists().then(stateExists => {

        if (stateExists) {
            showSyncDeniedDialog()
        } else {
            if (bypassConfirmation) {
                syncAll();
            } else {
                showSyncPrompt(dialogMsg);
            }
        }

    }).catch(err => {
        console.error(err);
        showToastrMessage('Something went wrong when trying to sync the container, please try again', 'Sync attempt failed.', 10000);
    });
}

function showAppStateManager() {
    NavBar.toggle(false);
    EventBus.dispatch(StateManagerPresenter.SHOW);
}

/**
 * Bootstrapping. Function initialises and wires up all MVP components to be used on this screen.
 */
function setupMvpComponents() {

    function setupTxIndicator() {
        const model = new TxIndicatorModel(null, TransactionsService);
        const view = new TxIndicatorView('txIndicator');
        const presenter = new TxIndicatorPresenter(model, view);
    }

    function setupStateManager() {
        const model = new StateManagerModel(null, AppStateService, MicroAppService);
        const view = new StateManagerView('txIndicator');
        const presenter = new StateManagerPresenter(model, view, EventBus);
    }

    function setupHomeScreen() {
        const model = new HomeScreenModel(BrandingService);
        const view = new HomeScreenView(window.document);
        const presenter = new HomeScreenPresenter(model, view);
        // TODO: Remove after debugging! 2019-07-18
        window.loginView = view;
    }

    function setupSync() {
        const depSyncManager = new DeploymentSyncManager(ConfigManager.user, ConfigManager.sessionId, ConfigManager.serviceUrl, ConfigManager.domain, DeploymentsService);
        const dsSyncManager  = new DataStructureSyncManager(ConfigManager.user, ConfigManager.domain, ConfigManager.sessionId, ConfigManager.dsCompileUrl, DataStructureService);
        const syncManager = new ContainerSyncManager(Explorer.INSTANCE, depSyncManager, dsSyncManager, ClientTableSyncManager, DataStructureService, DatabaseManager, AppStateService);

        function setupSyncBar() {
            const model = new SyncModel(syncManager, BrandingService);
            const view = new SyncView("#progress-bar", $("#progress-bar-container"), $(".progressbar .subtext"));
            const presenter = new SyncPresenter(model, view, EventBus);
            // TODO: Remove after debugging! 2019-07-18
            window.syncView = view;
            window.syncModel = model;
            window.syncPresenter = presenter;
        }

        function setupSyncReport() {
            const model = new SyncReportModel(syncManager, BrandingService);
            const view = new SyncReportView($("#my_popup"));
            const presenter = new SyncReportPresenter(model, view, EventBus);
            // TODO: Remove after debugging! 2019-07-18
            window.syncReportView = view;
            window.syncReportModel = model;
            window.syncReportPresenter = presenter;
        }

        setupSyncBar();
        setupSyncReport();

    }

    function setupNutshellMessageViewHome() {
        // TODO: 19/11/2019 Pass nutshellMessageService to view.
        const model = new NutshellMessageModel(NutshellMessageService,  ConfigManager.user, ConfigManager.domain, Auth.logout);
        const view = new NutshellMessageView(DialogService);
        const presenter = new NutshellMessagePresenter(model, view);

        // TODO: Remove after debugging! 19/11/2019
        window.nutshellMessageModel = model;
        window.nutshellMessageView = view;
        window.nutshellMessagePresenter = presenter;
    }

    setupSync();
    setupHomeScreen();
    setupTxIndicator();
    setupStateManager();
    setupNutshellMessageViewHome();

    NS.setScreenReady(true);
    EventBus.dispatch(NsEvents.SCREEN_READY);
}

function attemptAutoLaunch() {
    console.log(`Attempting to auto launch...`);
    AutoLaunchService.autoLaunch();
}

function onSyncReportCloseClick() {
    ContainerSyncManager.setSyncInProgress(false);
    attemptAutoLaunch();
    EventBus.dispatch("syncReportClosed");
}

function onSyncReportSyncAgainClick() {
    attemptSync(null, true);
    $('#my_popup').popup('hide');
}

function onBackButtonClick(e) {
    console.log(`BackButton clicked`, e);
    e.preventDefault();
}

function refreshApplicationData() {
    NavBar.toggle(false);
    attemptSync();
}

function toggleSearch(){
    $('#searchMenu').toggleClass('in');
}

function filterFolders(data) {
    if (data.value.length === 0) {
        Explorer.INSTANCE.showFolders();
    }
    $.extend($.expr[":"], {
        "containsIN" : function(elem, i, match, array) {
            return (elem.textContent || elem.innerText || "").toLowerCase()
                .indexOf((match[3] || "").toLowerCase()) >= 0;
        }
    });
    var filter = $("#filter-items").val();
    var filtered = $('.hideName:containsIN(' + filter + ')').parent();
    $('.product').hide();
    $(filtered).show();
    var closing_div = '<div class="microapp product" onclick="Explorer.INSTANCE.showFolders()"><div class="app_container"><div class="app_bg_shadow"></div><div class="close_search" style="border-radius: 0px;"></div></div><p class="name">Close</p><p class="hideName" style="display: none">Close</p></div>';
    $('.products').append(closing_div);
}

function setupEventListeners() {
    document.addEventListener("backbutton", onBackButtonClick, false);
}
function initHomeScreen() {
    setupEventListeners();

    // Initialize the popup dialog plugin.
    $('#my_popup').popup({
        blur: false
    });
}
function initHomeScreen() {
    setupEventListeners();

    // Initialize the popup dialog plugin.
    $('#my_popup').popup({
        blur: false
    });
}
/*
 * Code below is just to mitigate firebase issues where it drops dead on iOS 13.6 devices if put to background
 * and network connection gets toggled. See NSS-411 for more info. Logic should be removed once Firebase (or iOS)
 * resolves this issue.
 */
function setupErrorHandling() {

    if (device.platform === 'iOS') {

        // return true to prevent browser from displaying error
        window.onerror = function (msg, url, line, columnNo, error) {
            console.error(error);

            FirebaseService.isDead().then(isDead => {
                if (isDead) {
                    /*
                    * FB is found dead at this point we will silently ignore all other window errors and hope users reload the
                    * app soon. At this point we'll show the warning toastr every 5 minutes if the issue still persists.
                    */
                    if (!ToastrAlert.isFbDeadAlertShown) {
                        showWarning(ToastrAlert.FB_DEAD_RELOAD, null, () => window.location.reload(true));
                        ToastrAlert.isFbDeadAlertShown = true;
                        setTimeout(() => ToastrAlert.isFbDeadAlertShown = false, 5 * 60 * 1000);
                    }
                }
            }).catch(e => {
                console.error("Failed to check vitals of FB. Presume dead.", e);
                if (!ToastrAlert.isFbDeadAlertShown) {
                    showWarning(ToastrAlert.FB_DEAD_RELOAD, null, () => window.location.reload(true));
                    ToastrAlert.isFbDeadAlertShown = true;
                    setTimeout(() => ToastrAlert.isFbDeadAlertShown = false, 5 * 60 * 1000);
                }
            });

            return true;
        };
    }
}

