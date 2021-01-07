class AppScreenPresenter {

    constructor(model, view) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);
        this.setupBrandingChangeListener();
    }

    onBrandingChange(newBranding) {
        this.view.setHeaderBackgroundColour(newBranding.getHeaderBackgroundColour());
        this.view.show();
    }

    setupBrandingChangeListener() {
        this.model.attachBrandingChangeListener(branding => this.onBrandingChange(branding));
    }

}
