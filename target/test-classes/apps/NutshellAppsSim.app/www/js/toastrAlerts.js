function showToastrMessage(message, title, timeout, success, onclick, options) {

    toastr.clear();

    const defaultOptions = {
        "debug" : false,
        "timeOut" : timeout,
        "onclick" : onclick || null,
        "showEasing" : "swing",
        "hideEasing" : "linear",
        "showMethod" : "fadeIn",
        "hideMethod" : "fadeOut",
        "closeButton" : true,
        "newestOnTop" : false,
        "progressBar" : true,
        "showDuration" : "300",
        "hideDuration" : "1000",
        "positionClass" : "toast-top-center",
        "extendedTimeOut" : "1000",
        "preventDuplicates" : true
    };

    toastr.options = Object.assign(defaultOptions, options);

    if (success) {
        toastr.success(message, title);
    } else {
        toastr.error(message, title);
    }
}

function showWarning(message, timeout, onclick) {

    toastr.options = {
        "closeButton" : true,
        "debug" : false,
        "onclick" : onclick || null,
        "newestOnTop" : false,
        "progressBar" : true,
        "positionClass" : "toast-top-center",
        "preventDuplicates": true,
        "showDuration" : "300",
        "hideDuration" : "1000",
        "showEasing" : "swing",
        "hideEasing" : "linear",
        "showMethod" : "fadeIn",
        "hideMethod" : "fadeOut",
        "timeOut": (timeout) ? timeout : null,
    };

    toastr.warning(message.message, message.title);
}

function showOnlineMessage(message) {

        toastr.options = {
            "closeButton" : true,
            "debug" : false,
            "newestOnTop" : false,
            "progressBar" : true,
            "positionClass" : "toast-top-center",
            "preventDuplicates" : true,
            "showDuration" : "300",
            "hideDuration" : "1000",
            "timeOut" : 5000,
            "extendedTimeOut" : "1000",
            "showEasing" : "swing",
            "hideEasing" : "linear",
            "showMethod" : "fadeIn",
            "hideMethod" : "fadeOut"
        };


        toastr.success(message.message, message.title);
}

function errorToast(errMsg, title) {

    toastr.clear();

    toastr.options = {
        "closeButton" : false,
        "debug" : false,
        "newestOnTop" : false,
        "progressBar" : true,
        "positionClass" : "toast-top-center",
        "preventDuplicates" : true,
        "onclick" : null,
        "showDuration" : "300",
        "hideDuration" : "1000",
        "timeOut" : "4000",
        "extendedTimeOut" : "1000",
        "showEasing" : "swing",
        "hideEasing" : "linear",
        "showMethod" : "fadeIn",
        "hideMethod" : "fadeOut"
    };

    toastr.error(errMsg, title || 'Error');
}

function forceLogout(domain) {

    /* window.ga.trackEvent('Authentication', 'Force Logout', domain, 0, false,
        data => console.log(`GA: Authentication:Failed:${domain}. OK. data: ${data}`),
        err => console.error(`GA: Authentication:Failed:${domain}. FAIL. err: ${err}`)
    ); */

    navigator.notification.alert(
        'For security reasons, you\'ve been logged out. Please log back in to continue.',
        Auth.logout,
        'Please log in again',
        'Dismiss'
    );
}

ToastrAlert = this;
ToastrAlert.OFFLINE_NO_LOGIN = {"title": "Connection Unavailable", "message": "Nutshell noticed that you don't have a data/WiFi connection, you will not be able to login until you have one."};
ToastrAlert.OFFLINE_LOGGED_IN =  {"title": "Connection Unavailable", "message": "Nutshell noticed that you don't have a data/WiFi connection, you will not be able to use Nutshell's full abilities until you have one."};
ToastrAlert.OFFLINE_APP = {"title": "Connection Lost", "message": "Nutshell noticed that your data/WiFi connection has been lost, please be aware that any actions which require a connection will be unable to complete."};
ToastrAlert.OFFLINE_APP_MODE = {"title": "Connection Lost", "message": "Nutshell noticed that your data/WiFi connection has been lost, you will be unable to download the app. <br><br>If you have a version already loaded please retry and this version will open."};
ToastrAlert.OFFLINE_RESET = {"title": "Connection Lost", "message": "Nutshell noticed that you don't have a data/WiFi connection, in order to reset your password you will need a connection."};
// Online Messages
ToastrAlert.ONLINE_NO_LOGIN = {"title": "Connection Available", "message": "Nutshell noticed that you now have a data/WiFi connection, you will now be able to login."};
ToastrAlert.ONLINE_APP= {"title": "Connection Available", "message": "Nutshell noticed that you now have a data/WiFi connection, all your functionality is now avialable."};
ToastrAlert.FB_DEAD= {"title": "Network Error", "message": "There was a problem with your network connection. Please close and re-open this app at your earliest convenience to avoid further issues."};
ToastrAlert.FB_DEAD_RELOAD= {"title": "Network Error", "message": "There was a problem with your network connection. To avoid further issues please click here to reload the app."};

// Flag to indicate if users have already been notified that FB is dead. Should be removed once the issue is resolved.
ToastrAlert.isFbDeadAlertShown = false;
