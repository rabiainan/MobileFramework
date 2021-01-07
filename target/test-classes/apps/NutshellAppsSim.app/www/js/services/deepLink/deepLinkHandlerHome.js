function DeepLinkHandlerHome(appLaunchService) {
    this.appLaunchService  = appLaunchService;
    this.deepLinkService = null;
    this.user = null;
    this.domain = null;
    this.deepLink = null;
}

Object.assign(DeepLinkHandlerHome.prototype, {
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
        const ctx = this;
        const domain = searchParams.get('domain');
        const appId  = searchParams.get('appId');

        if (domain !== this.domain) {
            this.deepLinkService.persistDeepLink(this.deepLink);
            Auth.logout();
        } else if (appId) {
            this.deepLinkService.persistSearchParameters(searchParams);

            this.appLaunchService.requestAppLaunch(appId, true).catch(errCode => {
                rLog.log({deepLink: this.deepLink, errCode }, 'AL: app launch error ', rLog.level.WARNING, [rLog.tag.DL]);

                this.deepLinkService.clearSearchParameters();

                if (errCode === ctx.appLaunchService.errCodes.APP_NOT_FOUND) {
                    errorToast('The app which you attempted to open is not available.', 'App Does Not Exist');
                    rLog.log({deepLink: ctx.deepLink, err: errCode}, 'Deep Link app not found.', rLog.level.WARNING, [rLog.tag.DL]);
                } else if (errCode === ctx.appLaunchService.errCodes.UNOPENABLE_APP) {
                    errorToast('This application is locked. You can only use this application through another workflow.', 'Locked App');
                    rLog.log({deepLink: ctx.deepLink, err: errCode}, 'Deep Link app unopenable.', rLog.level.WARNING, [rLog.tag.DL]);
                } else if (errCode === ctx.appLaunchService.errCodes.APP_TYPE_INCOMPATIBLE) {
                    errorToast('This app is incompatible with current device type.', 'Incompatible Device');
                } else {
                    errorToast('Unknown error occurred.', 'Error');
                    rLog.log({deepLink: ctx.deepLink, err: errCode}, 'Deep link app launch error.', rLog.level.WARNING, [rLog.tag.DL]);
                }
            });
            this.linkHandled();
        }
    },
    linkHandled: function() {
        this.deepLinkService.linkHandlingComplete();
    }

});