function DeepLinkHandlerIndex(eventBus, ns, auth) {
    this.eventBus = eventBus;
    this.ns = ns;
    this.auth = auth;
    this.user = null;
    this.domain = null;
    this.deepLinkService = null;
    this.deepLink = null;
}

Object.assign(DeepLinkHandlerIndex.prototype, {
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

        // If users are logged in then save the link and wait for normal session process to take users to home.
        if (this.isLoggedIn()) {
            this.deepLinkService.persistDeepLink(this.deepLink);
            return;
        }

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
        const domain   = searchParams.get('domain');

        if (domain) {

            const domainSetter = () => {
                this.eventBus.dispatch(NsEvents.REQ_SET_DOMAIN, this, domain);
                this.linkHandled();
                this.ns.removeOnScreenReadyListener(domainSetter);
            }

            // Queue at the bottom of event loop as MVC needs time to settle.
            if (this.ns.isScreenReady()) {
                domainSetter();
            } else {
                this.ns.attachOnScreenReadyListener(domainSetter)
            }
        }
    },
    linkHandled: function() {
        this.deepLinkService.linkHandlingComplete();
    },
    isLoggedIn: function() {
        return this.auth.hasValidSession();
    }

});