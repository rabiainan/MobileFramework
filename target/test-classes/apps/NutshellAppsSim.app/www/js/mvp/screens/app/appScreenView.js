class AppScreenView {

    constructor(dom) {
        this.body = dom.querySelector('body');
        this.header = dom.querySelector("div.container div.appHeader");
        this.hide();
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    setHeaderBackgroundColour(newColour) {
        this.header.style.backgroundColor = newColour;
    }

    hide() {
        this.body.style.visibility = 'hidden';
    }

    show() {
        this.body.style.visibility = 'visible';
    }
}
