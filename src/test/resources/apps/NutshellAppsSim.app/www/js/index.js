var states = {};
var online = true;

function onDeviceReady() {
    console.log('Index.js: onDeviceReady()');
    initStarted();

    const containerDb = ContainerDatabaseManager.getContainerDb();
    const clientTableDb = ContainerDatabaseManager.getNsAppDb();

    // NOTE! the order here matters!
    FirebaseService.init().then(() => {
        NsNavigator.init(firebase);
        return rLog.init(null, null, null);
    }).then(function() {
        return FirebaseService.authenticate();
    }).then(function() {
        return NS.init();
    }).then(function() {
        return NA.init(null, null);
    }).then(function() {
        return DatabaseMigrationsRepo.init();
    }).then(function() {
        return DatabaseMigrator.updateTo(Conf.DB_VERSION, clientTableDb, DatabaseMigrations_nutshell_db);
    }).then(function() {
        return DatabaseMigrator.updateTo(Conf.DB_VERSION, containerDb, DatabaseMigrations_micro_app);
    }).then(function() {
        FirebaseService.onLogout(() => {
            console.error("Container Firebase user logged out!");
            const content = 'Error occured. Please re-login<br><button type="button" class="btn clear">Logout</button>';
            showToastrMessage(content, 'Error', 0, false, Auth.logout, {"closeButton": false});
        });
        return Promise.resolve();
    }).then(function() {
        return AutoLaunchService.init(null, null, window.location.href);
    }).then(function() {
        return BrandingService.init('demo');
    }).then(function() {
        const deepLinkHandler = new DeepLinkHandlerIndex(EventBus, NS, Auth);
        return DeepLinkService.init(null, null, deepLinkHandler);
    }).then(function() {
        logGA();
        setupEventListeners();
        setupMvpComponents();

        // This is in setTimout to give time for app links callbacks to be called and settled.
        setTimeout(() => processSession(), 1500);

    }).catch(function(err) {
        console.error("index.js failed to initialize NS.", err);
        var content = 'Failed to initialise the app:<br><button type="button" class="btn clear">Logout</button>';

        showToastrMessage(content, 'Configuration Error', 0, false, Auth.logout, {"closeButton": false});
    });

    StatusBar.hide();
    screen.orientation.unlock();
    localStorage.removeItem('networkState');
    localStorage.removeItem('jumpAppModeId');
    localStorage.removeItem('launchStack');
    localStorage.removeItem('defaultStartScreenId');
    checkConnection();

    // testsql.start();

}

function processSession() {

    const sessionId = localStorage.getItem('session_ID');

    if (sessionId !== null) {
        $('.loginContainer').hide();
        NsNavigator.navigateToScreen('home.html');
    } else {
        if(localStorage.getItem('showLogoutMessage') !== null) {
            $('#cover').fadeOut(1000);
            localStorage.removeItem('showLogoutMessage');
            showToastrMessage("You've been logged out successfully", "Logout", 5000, true);
        }

        $('.loginContainer').show();
        EventBus.dispatch(NsEvents.SCREEN_READY);
    }
}

function initStarted() {
    const loadingContainerDiv = document.querySelector('#loading-spinner-container');
    const textDiv = document.querySelector('.loading-spinner.container > .text');
    const model = new LoadingSpinnerModel(BrandingService);
    const view = new LoadingSpinnerView(loadingContainerDiv, textDiv);
    new LoadingSpinnerPresenter(model, view, EventBus);
}

function logGA() {
    //To track a Screen (PageView):
    // window.ga.trackView('index.html');
}

function reload() {
    location.reload();
}

function checkConnection() {
    var networkState = navigator.connection.type;
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';
}

function setupEventListeners() {

    // Attempts login if "Enter" is pressed on any inputs of the form.
    $("#form_domain, #form_username, #form_password").keyup(function(event){
        if(event.keyCode === 13){
            Auth.invokeLogin();
        }
    });
}

function setupMvpComponents() {

    function setupLoginScreen() {
        const model = new LoginScreenModel(BrandingService);
        const view = new LoginScreenView(window.document);
        const presenter = new LoginScreenPresenter(model, view, EventBus);
        window.loginView = view;
    }

    setupLoginScreen();

    NS.setScreenReady(true);
}

/**
 * Called when app was started by a deep link as well as by custom url scheme. (By custom-url-scheme plugin).
 * Its there just to prevent function not found JS errors as deep link logic will be handled by FBDL plugin.
 * @param url
 */
window.handleOpenURL = function(url) {
    console.log("handleOpenURL: received url: " + url);
}

/*function testSqlPlugin() {
    console.log('testSqlPlugin');
    const _db = ContainerDatabaseManager.getContainerDb();


    return new Promise((resolve, reject) => {
        var test_rows = 200000;

        var ts_prefix = 'teststring12345';

        var db = window.sqlitePlugin.openDatabase({name: "test.db"});

        var i, j;
        var cq = 'CREATE TABLE IF NOT EXISTS tt (text1 text';
        for (i=2; i<=25; ++i) cq += ', text'+i+ ' text';
        for (i=1; i<=5; ++i) cq += ', int'+i + ' integer';
        for (i=1; i<=5; ++i) cq += ', float'+i + ' float';
        for (i=1; i<=5; ++i) cq += ', nulltext'+i+ ' text DEFAULT NULL';
        cq += ')';

        console.log('cq: ' + cq);

        console.log('test_rows: ' + test_rows);

        db.executeSql('DROP TABLE IF EXISTS tt');

        db.transaction(function(tx) {
            tx.executeSql(cq);
            for (i=1; i<=test_rows; ++i) {
                var vv = [];
                for (j=1; j<=25; ++j) vv.push(ts_prefix + '-' + i + '-' + j);
                for (j=1; j<=5; ++j) vv.push(i*100 + j);
                for (j=1; j<=5; ++j) vv.push(i*101.11 + j*1.101);
                for (j=1; j<=5; ++j) vv.push(null);
                tx.executeSql('INSERT INTO tt VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', vv);
            }

        }, function(err) {
            console.log('tx error');
        }, function(res) {
            console.log('tx ok');
        });
    });

}*/

/*
function fbtest() {
    // Initialize Cloud Firestore through Firebase
    var db = firebase.firestore();

    db.collection("configurations").get().then(function (qs) {
        qs.forEach(function (doc) {
            console.log('doc.id: ' + doc.id + ', doc.data():' + doc.data());
        });
    });
}

function testCspViolation() {
    $.get( "http://example.com")
        .done(data => console.log(data))
        .fail(err => console.error(err));

}
*/


