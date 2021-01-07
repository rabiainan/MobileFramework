class NutshellMessageView {

    constructor(toast) {
        this.toast = toast;
        this.message = null;
        this.subtext = null;
        this.title = null;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    reset() {
        this.toast.clear();
        this.message = null;
        this.title = null;
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

    setLevel(level) {
        if (!Object.values(NutshellMessageView.level).includes(level)) {
            throw new Error(`NSM: level (${level}) unknown`);
        }

        this.level = level;
    }

    show() {

        return new Promise((resolve, reject) => {

            this.toast.clear();

            this.toast.options = {
                "debug" : false,
                "timeOut" : 0,
                "onclick" : resolve,
                "showEasing" : "swing",
                "hideEasing" : "linear",
                "showMethod" : "fadeIn",
                "hideMethod" : "fadeOut",
                "newestOnTop" : false,
                "showDuration" : "0",
                "hideDuration" : "1000",
                "positionClass": "toast-top-center",
                "extendedTimeOut" : "0",
                "preventDuplicates" : true
            };

            const content = this._prepareContent();

            switch (this.level) {
                case NutshellMessageView.level.GREEN:
                    this.toast.success(content, this.title);
                    break;
                case NutshellMessageView.level.AMBER:
                    this.toast.warning(content, this.title);
                    break;
                case NutshellMessageView.level.RED:
                    this.toast.error(content, this.title);
                    break;
                default:
                    throw new Error(`NutshellMessageView: level unknown: ${this.level}`);
            }

        });
    }

    _prepareContent() {
        if (this.subtext) {
            return this.message + '<br><br><span class="subtext"><i>' + this.subtext + '</i></span>';
        } else {
            return this.message
        }
    }
}

NutshellMessageView.level = {
    GREEN: "green",
    AMBER: "amber",
    RED: "red"
};
