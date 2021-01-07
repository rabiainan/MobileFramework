class HomeScreenView {

    constructor(dom) {
        this.body = dom.querySelector('body');
        this.header = dom.querySelector("nav#homeTopNav");
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
