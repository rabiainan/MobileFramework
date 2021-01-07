class TxIndicatorView {

    constructor(elemId) {
        this.elem = $(`#${elemId}`);
        this.elem.click(e => this.onClick(e));
        this.value = 0;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    onClick (e) {
        this.presenter.onClick()
    }

    setValue(val) {
        this.value = val;
        if (val > 99) {
            this.elem.html('99+');
        } else {
            this.elem.html(val);
        }
    }

    getValue() {
        return this.value;
    }

    show(b){
        this.elem.css('visibility',  (b ? 'visible' : 'hidden'));
        this.elem.css('opacity',  (b ? 1 : 0));
    }
}
