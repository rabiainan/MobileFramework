function DeepLinkHandlerApp(currentAppId, navigateToHome, onDeepLinkListener) {
    this.currentAppId = currentAppId;
    this.navigateToHome = navigateToHome;
    this.onDeepLinkListener = onDeepLinkListener;
    this.deepLinkService = null;
    this.user = null;
    this.domain = null;
    this.deepLink = null;
}

Object.assign(DeepLinkHandlerApp.prototype, {
    setService: function(service) {
        this.deepLinkService = service;
    },
    setUser: function(user) {
        this.user = user;
    },
    setDomain: function(domain) {
        this.domain = domain;
    },
    handleDeepLink: function(deepLink) {
        this.deepLink = deepLink;

        const url = new URL(deepLink);
        const pathName = url.pathname;

        if (!pathName) {
            // For future extendability. For now ignore deep links with no path.
        } else if (pathName.match(/\/al$/)) {
            this.handleBuilderGeneratedLink(url.searchParams);
        } else {
            console.warn('Unhandled deep link. data: ', data);
            rLog.log({deepLink: data.deepLink}, 'Unhandled deep link', rLog.level.WARNING, [rLog.tag.DL]);
        }
    },
    handleBuilderGeneratedLink: function(searchParams) {
        const domain = searchParams.get('domain');
        const appId  = searchParams.get('appId');


        if (domain !== this.domain) {
            this.deepLinkService.persistDeepLink(this.deepLink);
            Auth.logout();
        } else if (this.currentAppId === appId) {
            this.deepLinkService.persistSearchParameters(searchParams);
            this.onDeepLinkListener();
            this.linkHandled();
        } else {
            this.deepLinkService.persistDeepLink(this.deepLink);
            this.navigateToHome();
        }
    },
    linkHandled: function() {
        this.deepLinkService.linkHandlingComplete(this.deepLink);
    }
})