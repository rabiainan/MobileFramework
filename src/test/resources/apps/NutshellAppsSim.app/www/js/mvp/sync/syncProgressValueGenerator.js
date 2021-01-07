class SyncProgressValueGenerator {

    constructor (syncStages) {
        this.syncStages = syncStages;
        this.progressValueStrategy = new SyncValueGeneratorSequential(syncStages);
    }

    setStrategy(strategy) {
        this.progressValueStrategy = strategy;
    }

    getSyncValue(stage) {
        return this.progressValueStrategy.getNext(stage)
    }


}

class SyncValueGeneratorSequential {

    constructor(syncStages) {
        this.syncStages = syncStages;
        this.getNextValue = this.createValueGenerator();
    }

    createValueGenerator() {
        const totalSteps = Object.keys(this.syncStages).length;
        let counter = 1;
        return () => {
            return 1 / totalSteps * counter++
        };
    }

    getNext(stage) {
        return this.getNextValue();
    }
}

class SyncValueGeneratorCustom {

    constructor() {
    }

    getNext(stage) {
        switch (stage) {
            case SyncModel.stages.EXPLORER:
                return 0.25;
            case SyncModel.stages.DEPLOYMENTS:
                return 0.5;
            case SyncModel.stages.DATA_STRUCTURES:
                return 0.5;
            case SyncModel.stages.DS_INJECTION:
                return 0.5;
            case SyncModel.stages.TRANSACTIONS:
                return 0.75;
            case SyncModel.stages.DATA:
                return 1;
        }
    }
}
