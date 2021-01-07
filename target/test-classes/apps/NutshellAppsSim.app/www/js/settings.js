var online = true;

function onDeviceReady() {
    var sessionId = localStorage.getItem('session_ID');

    if(sessionId !== null) {
        getAllTickets();
    } else {
        Auth.logout();
    }
    checkConnection();
}

function changeScriptTagOffline() {
    if ($(document).find("script[src$='connection.js']").length == 0) {
        var my_awesome_script = document.createElement('script');
        my_awesome_script.setAttribute('src', 'js/connection.js');
        document.head.appendChild(my_awesome_script);
    }

    online = showWarning(ToastrAlert.OFFLINE_APP);
}

function changeScriptTagOnline() {
    if ($(document).find("script[src$='connection.js']").length == 0) {
        var my_awesome_script = document.createElement('script');
        my_awesome_script.setAttribute('src', 'js/connection.js');
        document.head.appendChild(my_awesome_script);
    }
    online = showOnlineMessage(ToastrAlert.ONLINE_APP);
}

function onDeviceReadyBrowser() {
    var my_awesome_script = document.createElement('script');
    my_awesome_script.setAttribute('src', 'js/connection.js');
    document.head.appendChild(my_awesome_script);
}

function checkConnection() {
    var networkState = navigator.connection.type;

    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';

    //console.log('Connection type: ' + states[networkState]);
}
