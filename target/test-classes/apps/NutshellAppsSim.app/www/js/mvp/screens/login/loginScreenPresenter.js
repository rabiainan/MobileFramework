class LoginScreenPresenter {

    constructor(model, view, eventBus) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        this.previousDomain = null;
        this.eventBus = eventBus;
        this.setupEventListeners();
        this.init();
    }

    setupEventListeners() {
        console.log(`LoginScreenPresenter#setupEventListeners`);
        this.eventBus.addEventListener(NsEvents.REQ_SET_DOMAIN, this.onEventDomainChangeRequest.bind(this));
    }

    init() {
        this.processRememberMe();

        const currentDomain = this.view.getDomain();
        this.onDomainValueChange(currentDomain);
    }

    processRememberMe() {
        const rememberMe = this.model.isRememberMeSet();
        this.view.setRememberMe(rememberMe);

        if (rememberMe) {
            const domain = this.model.getRememberedDomain();
            const username = this.model.getRememberedUserName();
            this.view.setDomain(domain);
            this.view.setUsername(username);
        } else {
            this.view.clearDomain();
            this.view.clearUsername();
        }
    }

    onDomainValueChange(domain) {
        domain = domain.toLowerCase();
        domain = domain.trim();

        if (this.previousDomain === domain) {
            return;
        }

        this.previousDomain = domain;

        this.setupBrandingChangeListener(domain);
    }

    applyBranding(branding) {
        this.view.setMainLogoUrl(branding.getMainLogoUrl());
        this.view.setLoginBtnBackgroundColour(branding.getLoginBtnBackgroundColour());
    }

    onBrandingChange(newBranding) {
        // NOTE: To enable remote branding, uncomment lien below and a block _listenToBrandingChanges() function of BrandingService module.
        // this.applyBranding(newBranding);
    }

    setupBrandingChangeListener(domain) {
        this.model.attachBrandingChangeListener(domain, branding => this.onBrandingChange(branding));
    }

    onEventDomainChangeRequest(event, domain) {
        if (domain) {
            this.view.setDomain(domain);
        }
    }

}
