class SyncReportPresenter {

    constructor(model, view, eventBus) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        this.eventBus = eventBus;
        this.setupEventListeners();
        this.setupBrandingChangeListener();
    }

    show() {
        const syncReport = this.model.getSyncReport();

        if(!(syncReport instanceof SyncReport)) {
            return; // ignore
        }

        this.prepareTitle(syncReport);
        this.prepareIcons(syncReport);

        if (syncReport.hasWarnings()) {
            const warnings = syncReport.getAppSyncWarnings();
            this.prepareWarnings(warnings);
        } else {
            this.clearWarnings();
        }

        this.view.show();
    }

    prepareTitle(syncReport) {
        let title = null;
        let subtitle = null;

        if (syncReport.getSyncStatus() === SyncReport.status.SUCCESS) {
            title = 'Sync Complete!';
            subtitle = 'You’re all up to date and ready to go.';
        } else {
            title = 'Sync Failed';
        }

        this.view.setTitle(title);
        this.view.setSubtitle(subtitle);
    }

    prepareIcons(syncReport) {
        this.view.setAppsStatusIcon(this.syncStatusToIcon(syncReport.getAppSyncStatus()));
        this.view.setQueuedEmailStatusIcon(this.syncStatusToIcon(syncReport.getTransactionSyncStatus()));
        this.view.setQueuedDataStatusIcon(this.syncStatusToIcon(syncReport.getTransactionSyncStatus()));
        this.view.setDatabasesStatusIcon(this.syncStatusToIcon(syncReport.getDataSyncStatus()));
    }

    prepareWarnings(warnings) {
        this.view.showWarningsSection();
        const summary = warnings.buildSummary();
        this.view.setAppWarningSummary(summary);

        const affectedApps = warnings.getAffectedAppList();
        this.view.setAffectedApps(affectedApps);
    }

    clearWarnings() {
        this.view.hideWarningsSection();
    }

    setupEventListeners() {
        console.log(`SyncReportPresenter#setupEventListeners`);
        this.eventBus.addEventListener(NsEvents.SYNC_FINISHED, () => this.show());
    }

    onBrandingChange(newBranding) {
        this.view.setCloseButtonColour(newBranding.getSyncReportBtnColour());
    }

    setupBrandingChangeListener() {
        this.model.attachBrandingChangeListener(branding => this.onBrandingChange(branding));
    }

    syncStatusToIcon(syncStatus) {
        switch (syncStatus) {
            case SyncReport.status.SUCCESS:
                return SyncReportView.icons.SUCCESS;
            case SyncReport.status.WARNING:
                return SyncReportView.icons.WARNING;
            case SyncReport.status.FAILED:
                return SyncReportView.icons.FAIL;
            default:
                console.error(`SyncReportPresenter# syncStatusToIcon unknown sync status:`, syncStatus)
        }
    }

}

