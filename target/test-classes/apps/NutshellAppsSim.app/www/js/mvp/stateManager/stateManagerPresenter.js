class StateManagerPresenter {

    constructor(model, view, eventBus) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        this.eventBus = eventBus;
        this.eventBus.addEventListener(StateManagerPresenter.SHOW, () => this.show());
    }

   show() {
        this.model.getStatesVm().then(states => {

            if(states.isEmpty()) {
                this.view.showNoStates();
            } else {
                this.view.show(states);
            }

        }).catch(err => {
            console.log(err)
        });
   }

   onClearAllClick() {
        console.log(`StateManagerPresenter#onClearAllClick`);
        this.model.clearAllStates()
   }

    onCancelClick() {
        console.log(`StateManagerPresenter#onCancelClick`);
        // Ignore. Dialog will be closed by jQuery confirm library.
    }

    onStateCleared() {
        console.log(`StateManagerPresenter#onStateCleared`);
        this.view.showStateClearedAlert();
    }
}

StateManagerPresenter.SHOW = 'StateManagerPresenter.show';
