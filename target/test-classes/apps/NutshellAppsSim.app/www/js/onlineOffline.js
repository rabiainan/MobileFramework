var online = true;

function changeScriptTagOffline() {

    online = false;

    showWarning( (localStorage.getItem("session_ID") == null) ? ToastrAlert.OFFLINE_NO_LOGIN : ToastrAlert.OFFLINE_LOGGED_IN);
    showOfflineBanner();
}

function changeScriptTagOnline() {

    if (!online) {
        showOnlineMessage((localStorage.getItem("session_ID") == null) ? ToastrAlert.ONLINE_NO_LOGIN : ToastrAlert.ONLINE_APP);
        showOnlineBanner();
        online = true;
    }
}

function showOfflineBanner() {
    $('#connectionWarningBanner').show().css('background', 'red').html('Offline');
}

function showOnlineBanner() {

    if($('#connectionWarningBanner').is(":visible")) {
        $('#connectionWarningBanner').css('background', 'green').html('Online');

        setTimeout(function(){
            $('#connectionWarningBanner').fadeOut(500);
        }, 3000);
    }
}
