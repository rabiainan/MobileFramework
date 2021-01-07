class SyncReport {

    constructor() {
        this.appSyncWarnings = null;

        // Sync fails completely unless set otherwise.
        this.appSyncStatus = SyncReport.status.FAILED;
        this.transactionSyncStatus = SyncReport.status.FAILED;
        this.dataSyncStatus = SyncReport.status.FAILED;
    }

    getAppSyncWarnings() {
        return this.appSyncWarnings;
    }

    setAppSyncWarnings(appSyncWarnings) {
        this.appSyncWarnings = appSyncWarnings;
    }

    hasWarnings() {
        return this.appSyncWarnings !== null;
    }

    getAppSyncStatus() {
        return this.appSyncStatus;
    }

    setAppSyncStatus(appSyncStatus) {
        this.appSyncStatus = appSyncStatus;
    }

    getTransactionSyncStatus() {
        return this.transactionSyncStatus;
    }

    setTransactionSyncStatus(transactionSyncStatus) {
        this.transactionSyncStatus = transactionSyncStatus;
    }

    getDataSyncStatus() {
        return this.dataSyncStatus;
    }

    setDataSyncStatus(dataSyncStatus) {
        this.dataSyncStatus = dataSyncStatus;
    }

    getSyncStatus() {
        if (this.appSyncStatus === SyncReport.status.FAILED ||
            this.transactionSyncStatus === SyncReport.status.FAILED ||
            this.dataSyncStatus === SyncReport.status.FAILED) {
            return SyncReport.status.FAILED;
        } else {
            return SyncReport.status.SUCCESS;
        }
    }
}

SyncReport.status = {
    FAILED: "failed",
    WARNING: "warning",
    SUCCESS: "success"
};



