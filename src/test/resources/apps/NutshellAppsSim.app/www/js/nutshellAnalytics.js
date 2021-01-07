const NA = (function() {

    let _user   = null;
    let _domain = null;
    let _analytics = null;

    function _init(user, domain) {
        _analytics = cordova.plugins.firebase.analytics;

        if (user && domain) {
            _domain = domain;
            _user = user;
            _setUserId(`${domain}-${user}`);
        }

        return Promise.resolve();
    }

    function _setUserId (userId) {
        _analytics.setUserId(userId);
    }

    function _setCurrentScreen(screenName) {
        _analytics.setCurrentScreen(screenName);
    }

    function _logEvent(name, params) {
        _analytics.logEvent(name, params);
    }

    return {
        init: _init,
        logEvent: _logEvent,
        setCurrentScreen : _setCurrentScreen
    }

})();