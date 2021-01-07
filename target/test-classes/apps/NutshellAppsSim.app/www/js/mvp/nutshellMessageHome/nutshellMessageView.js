class NutshellMessageView {

    constructor(dialogService) {
        this.dialogService = dialogService;
        this.message = null;
        this.subtext = null;
        this.title = null;
        this.buttons = null;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    reset() {
        this.message = null;
        this.title = null;
        this.buttons = null;
        this.subtext = null;
    }

    setTitle(title) {
        this.title = title;
    }

    setMessage(msg) {
        this.message = msg;
    }

    setSubtext(text) {
        this.subtext = text;
    }

    setButtons(buttons) {
        this.buttons = buttons;
    }

    show() {
        const content = this._prepareContent();
        return this.dialogService.show(this.title, content, this.buttons);
    }

    _prepareContent() {
        if (this.subtext) {
            return this.message + '<br><br><span class="subtext" style="color: slategrey"><i>' + this.subtext + '</i></span>';
        } else {
            return this.message
        }
    }


}
