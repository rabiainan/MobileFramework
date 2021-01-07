const NetworkService = (function(){

    function init () {
        console.log(`NetworkService#init`);
        return Promise.resolve();
    }

    function addOnlineListener (listener) {
        if (typeof listener === "function") {
            document.addEventListener("online", listener, false);
        } else {
            console.warn('NetworkService#addOnlineListener. online listener must be a function!')
        }
    }

    function removeOnlineListener (listener) {
        document.removeEventListener("online", listener, false);
    }

    function isOnline() {
        if (navigator !== undefined && navigator.connection !== undefined) {
            return (navigator.connection.type !== 'none');
        } else {
            return true;
        }

    }

    return {
        init,
        addOnlineListener,
        removeOnlineListener,
        isOnline
    }

})();
