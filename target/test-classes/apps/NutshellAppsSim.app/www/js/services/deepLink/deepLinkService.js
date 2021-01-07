const DeepLinkService = (function() {

    const DEEP_LINK_KEY = 'deep_link';
    const LAST_HANDLED_DEEP_LINK_KEY = 'last_handled_deep_link';

    let _user = null;
    let _domain = null;
    let _deepLinkHandler = null;

    function init (user, domain, handler) {
        _user = user;
        _domain = domain;
        _deepLinkHandler = handler;
        _deepLinkHandler.setService(this);
        _deepLinkHandler.setUser(user);
        _deepLinkHandler.setDomain(domain);

        _attachListener();
        _processSavedLink();
    }

    function linkHandlingComplete(deepLink) {
        _dropPersistedDeepLink();
        _persistLastHandledLink(deepLink);
    }

    function persistDeepLink(deepLink) {
        localStorage.setItem(DEEP_LINK_KEY, deepLink);
    }

    function persistSearchParameters(params) {
        const paramsObj = _searchParamsToObj(params)
        localStorage.setItem("deepLinkParams", JSON.stringify(paramsObj));
    }

    function clearSearchParameters() {
        localStorage.removeItem("deepLinkParams");
    }

    function _persistLastHandledLink(deepLink) {
        localStorage.setItem(LAST_HANDLED_DEEP_LINK_KEY, deepLink);
    }

    function _processSavedLink() {
        console.log("DeepLinkService.js processing saved link at: ", new Date().toISOString());

        const savedDeepLink = _obtainDeepLink();

        if (savedDeepLink) {
            _handleDeepLink(savedDeepLink);
        }
    }

    function _attachListener() {
        cordova.plugins.firebase.dynamiclinks.onDynamicLink(function(data) {
            console.log("DeepLinkService#onDynamicLink, data: ", data);
            _dropPersistedDeepLink();
            _handleDeepLink(data.deepLink);
        });

        console.log(`DeepLinkService: deep link listener attached.`);
    }

    function _handleDeepLink(deepLink) {
        _deepLinkHandler.handleDeepLink(deepLink);
    }

    function _dropPersistedDeepLink() {
        return localStorage.removeItem(DEEP_LINK_KEY);
    }

    function _obtainDeepLink() {
        return localStorage.getItem(DEEP_LINK_KEY);
    }

    function _searchParamsToObj(params) {
        const obj = {};
        for (const key of params.keys()) {
            obj[key] = params.get(key);
        }
        return obj;
    }

    return {
        init,
        persistDeepLink,
        linkHandlingComplete,
        persistSearchParameters,
        clearSearchParameters
    }
})();