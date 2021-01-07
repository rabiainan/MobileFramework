class SyncPresenter {

    constructor(model, view, eventBus) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        this.eventBus = eventBus;

        this.syncValueGenerator = new SyncProgressValueGenerator(SyncModel.stages);
        this.syncValueGenerator.setStrategy(new SyncValueGeneratorCustom());

        this.setupEventListeners();
        this.setupBrandingChangeListener();
    }

    show() {
        if (this.model.isSyncInProgress()) {
            return;
        }

        this.view.setText('Syncing Apps');
        this.view.show();
        this.model.startSync();
    }

    onSyncStageCompleted(stage) {
        console.log(`SyncPresenter#onSyncStageCompleted`, stage);
        this.view.clearSubtext();
        this.setSyncValue(stage);

        // This function will ways be called in order of stages cases listed below.
        switch (stage) {
            case SyncModel.stages.EXPLORER:
                this.view.setText('Syncing Apps');
                break;
            case SyncModel.stages.DEPLOYMENTS:
                this.view.setText('Syncing Apps');
                break;
            case SyncModel.stages.DATA_STRUCTURES:
                this.view.setText('Syncing Apps');
                break;
            case SyncModel.stages.DS_INJECTION:
                this.view.setText('Clearing Queue');
                break;
            case SyncModel.stages.TRANSACTIONS:
                this.view.setText('Syncing Data');
                break;
            case SyncModel.stages.DATA:
                this.view.setText('All Done!');
                this.delayedClose();
                break;
        }
    }

    onSyncFailed() {
        this.delayedClose();
    }

    setSyncValue(stage) {
        const value = this.syncValueGenerator.getSyncValue(stage);
        this.view.setProgressValue(value);
    }

    delayedClose() {
        setTimeout(() => {
            this.view.hide();
            this.view.reset();
            this.eventBus.dispatch(NsEvents.SYNC_FINISHED);
        }, 1500)
    }

    onSyncProgress(msg) {
        console.log(`SyncPresenter#onSyncProgress`);
        this.view.tick(msg);
    }

    setupEventListeners() {
        console.log(`SyncPresenter#setupEventListeners`);
        this.eventBus.addEventListener(NsEvents.SYNC_ALL, () => this.show());
    }

    onBrandingChange(newBranding) {
        this.view.setProgressCircleColour(newBranding.getProgressCircleColour());
    }

    setupBrandingChangeListener() {
        this.model.attachBrandingChangeListener(branding => this.onBrandingChange(branding));
    }



}

