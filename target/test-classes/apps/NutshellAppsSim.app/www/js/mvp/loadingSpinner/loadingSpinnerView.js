class LoadingSpinnerView {

    constructor(containerDiv, textDiv) {
        this.containerDiv = containerDiv;
        this.textDiv = textDiv;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    show() {
        this.containerDiv.style.display = 'block';
        this.containerDiv.classList.remove('hidden');
    }

    hide() {
        this.containerDiv.classList.add('fadeout');
        setTimeout(() => this.containerDiv.style.display = 'none', 2000);
    }

    setText(text) {
        this.textDiv.innerHTML = text;
    }
}
