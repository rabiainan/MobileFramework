class SyncModel {

    constructor(syncManager, brandingService) {
        this.syncManager = syncManager;
        this.brandingService = brandingService;
        this.setupBrandingChangeListener();
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    startSync() {
        this.syncManager.syncAll(stage => this.onSyncStageCompleted(stage), msg => this.onProgressMade(msg))
            .catch(() => this.presenter.onSyncFailed());
    }

    onProgressMade(msg) {
        console.log(`SyncModel#onProgressMade msg: ${msg}`);
        this.presenter.onSyncProgress(msg);
    }

    onSyncStageCompleted(stage) {
        console.log(`SyncModel#onSyncStageCompleted`);
        this.presenter.onSyncStageCompleted(stage);
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

    isSyncInProgress() {
        return ContainerSyncManager.isSyncInProgress();
    }

}

SyncModel.stages = {
    EXPLORER: 'explorer',
    DEPLOYMENTS: 'deployments',
    DATA_STRUCTURES: 'data_structures',
    DS_INJECTION: 'ds injection',
    TRANSACTIONS: 'transactions',
    DATA: 'client tables'
};
