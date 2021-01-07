class LoginScreenModel {

    constructor(brandingService) {
        this.brandingService = brandingService;
        this.brandingChangeListener = null;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    attachBrandingChangeListener(domain, listener) {
        if (domain === '') {
            listener(Branding.getDefault());
        } else {

            this.brandingChangeListener = listener;

            this.brandingService.setNewDomain(domain).then(() => {
                this.brandingService.attachBrandingChangeListener(branding => this.onBrandingChange(branding));
            }).catch(err => {
                console.error('LoginScreenModel: getting branding error: ', err);
            });
        }
    }

    onBrandingChange(brandingObj) {

        const branding = brandingObj === null ? Branding.getDefault() : Branding.fromObj(brandingObj);

        if (typeof this.brandingChangeListener === 'function') {
            this.brandingChangeListener(branding);
        }
    }

    isRememberMeSet() {
        return localStorage.getItem('remember') === "true";
    }

    setRememberMe(b) {
        localStorage.setItem('remember', b);
    }

    getRememberedDomain() {
        return localStorage.getItem('domain');
    }

    getRememberedUserName() {
        return localStorage.getItem('username');
    }

}
