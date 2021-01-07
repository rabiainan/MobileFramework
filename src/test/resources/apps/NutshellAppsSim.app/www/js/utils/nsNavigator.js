const NsNavigator = (function () {

    let _firebase = null;

    function init(fb) {
        console.log('NsNavigator: Initiating...', fb);
        _firebase = fb;
    }

    function navigateToScreen(url) {
        try {
            firebase.app().delete()
                .then(function () {
                    console.log("NsNavigator: FB App deleted successfully... navigating to:", url);
                    location.href = url;
                }).catch(function (error) {
                    console.error("NsNavigator: Error deleting FB app:", error);
                    rLog.log({error}, 'NsNavigator: Error deleting FB app', rLog.level.ERROR, [rLog.tag.FB]);
                    location.href = url;    // Still navigate to another screen but and hope for no white screen issues.
            });
        } catch (e) {
            console.error("NsNavigator: Error deleting FB app:", e);
            rLog.log({error: e }, 'NsNavigator: Error deleting FB app', rLog.level.ERROR, [rLog.tag.FB]);
            location.href = url;    // Still navigate to another screen but and hope for no white screen issues.
        }
    }

    return {
        init,
        navigateToScreen
    };

})();
