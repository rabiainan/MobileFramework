class TxIndicatorModel {

    constructor(syncManager, txService) {
        this.syncManager = syncManager;
        this.txService = txService;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
        EventBus.addEventListener(NsEvents.SYNC_FINISHED, () => this.update());
    }

    update() {
        this.txService.getTotalCount()
            .then(total => this.presenter.onCountChange(total))
            .catch(err => console.error(`TxIndicatorModel: Could not get transactions count. ${err}`));
    }

}
