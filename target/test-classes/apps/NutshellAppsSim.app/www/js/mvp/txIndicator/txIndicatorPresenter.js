class TxIndicatorPresenter {

    constructor(model, view) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        // Init
        model.update();
    }

    onClick() {

        if (attemptSync) {
            const msg = this.getSyncDialogMessage();
            attemptSync(msg);
        }
    }

    getSyncDialogMessage() {
        const count = Number(this.view.getValue());

        if (count < 1) {
            return TxIndicatorPresenter.SYNC_DLG_MSG_TEMPLATE.replace(TxIndicatorPresenter.COUNT_PLACEHOLDER, `are no items`);
        } else if (count === 1){
            return TxIndicatorPresenter.SYNC_DLG_MSG_TEMPLATE.replace(TxIndicatorPresenter.COUNT_PLACEHOLDER, `is 1 item`);
        } else {
            return TxIndicatorPresenter.SYNC_DLG_MSG_TEMPLATE.replace(TxIndicatorPresenter.COUNT_PLACEHOLDER, `are ${count} items`);
        }
    }

    startSync() {
        this.model.sync();
    }

    onCountChange(val) {
        this.setValue(val);
    }

    setValue(val, countDownInterval = null) {
        if (val === 0) {

            const currentValue = Number(this.view.getValue());

            // regulates the speed of countdown
            if (!countDownInterval) {
                countDownInterval = TxIndicatorPresenter.COUNTDOWN_PERIOD / currentValue;
            }

            if (currentValue <= 0) {
                this.view.show(false);
            } else {
                this.view.setValue(currentValue - 1);
                setTimeout(() => this.setValue(val), countDownInterval)
            }
        } else {
            this.view.setValue(val);
            this.view.show(true);
        }
    }

    getValue() {
        this.model.update();
    }

    onCountChanged() {
        const count = this.model.getCount();
        this.view.setValue(count);
    }
}

TxIndicatorPresenter.COUNT_PLACEHOLDER = '$COUNT$';
TxIndicatorPresenter.SYNC_DLG_MSG_TEMPLATE = `Any emails and/or data you’ve sent whilst using offline apps have been queued automatically. There ${TxIndicatorPresenter.COUNT_PLACEHOLDER} in this queue that need to be sent. Would you like to send these now?`;
TxIndicatorPresenter.COUNTDOWN_PERIOD = 500;
