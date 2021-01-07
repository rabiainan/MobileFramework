class LoadingSpinnerPresenter {

    constructor(model, view, eventBus) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        this.eventBus = eventBus;

        this.setupEventListeners();
        this.setupBrandingChangeListener();
        this.init();
    }

    init() {
        const text = this.model.getDefaultText();
        this.view.setText(text);
        this.view.show();
    }

    hide() {
        this.view.hide();
    }

    setupEventListeners() {
        console.log(`SyncPresenter#setupEventListeners`);
        this.eventBus.addEventListener(NsEvents.SCREEN_READY, () => this.hide());
    }

    onBrandingChange(newBranding) {
        // TODO: 24/06/2020 TBI...
        // this.view.setProgressCircleColour(newBranding.getProgressCircleColour());
    }

    setupBrandingChangeListener() {
        this.model.attachBrandingChangeListener(branding => this.onBrandingChange(branding));
    }


}

