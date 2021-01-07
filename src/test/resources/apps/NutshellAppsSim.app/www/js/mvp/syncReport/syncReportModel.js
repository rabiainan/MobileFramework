class SyncReportModel {

    constructor(syncManager, brandingService) {
        this.syncManager = syncManager;
        this.brandingService = brandingService;
        this.setupBrandingChangeListener();
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    getSyncReport() {
        return this.syncManager.getLastSyncReport();
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

}

