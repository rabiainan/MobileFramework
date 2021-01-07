function ContainerSyncManager(explorer, deploymentSyncManger, dataStructureSyncManager, clientTableSyncManager, dsService, databaseManager, appStateService) {
    console.log(`ContainerSyncManager#constructor, explorer: ${explorer}, deploymentSyncManger: ${deploymentSyncManger}, dataStructureSyncManager: ${dataStructureSyncManager}, databaseManager ${databaseManager}, dsService:${dsService}`);

    ContainerSyncManager.setSyncInProgress(false);

    if (!explorer || !deploymentSyncManger || !dataStructureSyncManager || !clientTableSyncManager || !databaseManager
        || !dsService || !appStateService) {
        throw new Error('Could not initialise SyncManager (invalid arguments)');
    } else {
        this.explorer = explorer;
        this.deploymentSyncManger = deploymentSyncManger;
        this.dataStructureSyncManager = dataStructureSyncManager;
        this.databaseManager = databaseManager;
        this.clientTableSyncManager = clientTableSyncManager;
        this.dsService = dsService;
        this.appStateService = appStateService;
    }

    this.syncReport = null;
}


ContainerSyncManager.prototype.syncAll = function(stageCompletionCallback, progressUpdate) {
    console.log(`ContainerSyncManager#_syncAll`);
    const ctx = this;
    const startTime = new Date();

    ContainerSyncManager.setSyncInProgress(true);

    return new Promise((resolve, reject) => {

        this.initSyncReport();

        let dsMap = null;

        ctx.syncExplorer().then(() => {
            stageCompletionCallback(SyncModel.stages.EXPLORER);
            return ctx.deploymentSyncManger.start(progressUpdate);
        }).then(dsAppModeMap => {
            stageCompletionCallback(SyncModel.stages.DEPLOYMENTS);
            dsMap = dsAppModeMap.getAppModeMap();
            return ctx.dataStructureSyncManager.sync(dsAppModeMap.getDsIds(), progressUpdate);
        }).then(warnings => {
            stageCompletionCallback(SyncModel.stages.DATA_STRUCTURES);

            warnings.dereference(dsMap);

            if(warnings.hasWarnings()) {

                rLog.log({warnings: {
                        affectedApps: warnings.getAffectedApps(),
                        notFound: warnings.getNotFound()
                    }}, 'Partial sync detected.', rLog.level.WARNING, [rLog.tag.SYNC]);

                ctx.syncReport.setAppSyncStatus(SyncReport.status.WARNING);
                ctx.syncReport.setAppSyncWarnings(warnings);
            } else {
                ctx.syncReport.setAppSyncStatus(SyncReport.status.SUCCESS);
            }

            return ctx.dsService.injectDataStructures();
        }).then(() => {
            stageCompletionCallback(SyncModel.stages.DS_INJECTION);
            return ctx.syncTransactions();
        }).then(() => {
            stageCompletionCallback(SyncModel.stages.TRANSACTIONS);
            ctx.syncReport.setTransactionSyncStatus(SyncReport.status.SUCCESS);

            const structures = ctx.getInjectedStructures();
            return ctx.clientTableSyncManager.sync(structures, progressUpdate);
        }).then(() => {
            stageCompletionCallback(SyncModel.stages.DATA);
            ctx.syncReport.setDataSyncStatus(SyncReport.status.SUCCESS);

            const duration = new Date() - startTime;
            const msg = `Full sync SUCCESS. duration: ${duration / 1000}s`;
            console.log(msg);
            rLog.log({}, msg, rLog.level.INFO, [rLog.tag.SYNC, rLog.tag.EXPLORER]);

            ctx.markDomainSynced(ConfigManager.user, ConfigManager.domain);
            return ctx.appStateService.removeAll(true);
        }).then(() => {
            resolve();
        }).catch(err => {
            localStorage.setItem("lastSyncStatus", "fail");
            console.error(`Sync: Failed to sync:`, err);
            reject();
        });
    });
};

ContainerSyncManager.prototype.getInjectedStructures = function() {
    const structures = [];
    DataStructure.Prototypes.forEach(id => {
        structures.push(DataStructure.Create(id));
    });
    return structures;
};

ContainerSyncManager.prototype.syncExplorer = function () {
    console.log(`ContainerSyncManager#syncExplorer`);
    const ctx = this;

    return new Promise((resolve, reject) => {
        ctx.explorer.sync(success => {
            if (success) {
                resolve();
            } else {
                reject();
            }
        });
    });
};

ContainerSyncManager.prototype.syncTransactions = function() {
    console.log(`ContainerSyncManager#syncTransactions`);
    const ctx = this;

    return new Promise((resolve, reject) => {
        ctx.databaseManager.handleQueuedTransactions(function (success) {
            console.log('Sync#syncTransactions finished. success: ' + success);
            if (success) {
                resolve();
            } else {
                reject("Failed to sync transactions");
            }
        });
    });
};

ContainerSyncManager.prototype.markDomainSynced = function (user, domain) {
    localStorage.setItem("lastSyncedUser", user);
    localStorage.setItem("lastSyncedDomain", domain);
    localStorage.setItem('lastSyncedOn', new Date().toString());
    localStorage.setItem("lastSyncStatus", "success");
};

ContainerSyncManager.prototype.initSyncReport = function() {
    this.syncReport = new SyncReport();
};

ContainerSyncManager.prototype.getLastSyncReport = function() {
    return this.syncReport;
};

// TODO: 19/05/2020 This property is being set from various points within the app with the sole purpose to prevent
//      double syncs. This is not ideal making it dependable on external elements. This could potentially be refactored
//      this logic to something less intrusive. Maybe utilising side menu MVP.
ContainerSyncManager.setSyncInProgress = function(syncInProgress) {
    ContainerSyncManager.syncInProgress = syncInProgress;
};

ContainerSyncManager.isSyncInProgress = function() {
    return ContainerSyncManager.syncInProgress;
};

ContainerSyncManager.syncInProgress = false;


