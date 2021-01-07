class LoadingSpinnerModel {

    constructor(brandingService) {
        this.defaultText = 'Loading...';
        this.brandingService = brandingService;
        this.setupBrandingChangeListener();
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    attachBrandingChangeListener(listener) {
        this.brandingChangeListener = listener;
        const latestBranding = this.brandingService.getBranding();
        this.onBrandingChange(latestBranding);
    }

    setupBrandingChangeListener() {
        this.brandingService.attachBrandingChangeListener(brandingObj => this.onBrandingChange(brandingObj));
    }

    onBrandingChange(brandingObj) {

        const branding = brandingObj === null ? Branding.getDefault() : Branding.fromObj(brandingObj);

        if (typeof this.brandingChangeListener === 'function') {
            this.brandingChangeListener(branding);
        }
    }

    getDefaultText() {
        return this.defaultText;
    }
}
