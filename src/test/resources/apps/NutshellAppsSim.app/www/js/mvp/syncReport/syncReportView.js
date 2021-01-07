class SyncReportView {

    constructor($container) {
        this.extractElements($container);
        this.$container = $container;
    }

    extractElements($container) {
        this.$title = $container.find('#popup-title');
        this.$subTitle = $container.find('#popup-subtitle');
        this.$appIcon = $container.find('.syncReport.apps span.icon');
        this.$appWarningsContainer = $container.find('.syncReport.apps div.warnings');
        this.$appWarningsSummary = $container.find('.syncReport.apps div.warnings summary.summary');
        this.$appWarningsAffectedApps = $container.find('.syncReport.apps div.warnings div.affectedApps');
        this.$emailIcon = $container.find('.syncReport.email span.icon');
        this.$queuedDataIcon = $container.find('.syncReport.queuedData span.icon');
        this.$data = $container.find('.syncReport.data span.icon');
        this.$closeButton = $container.find('.my_popup_close');
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    show() {
        this.$container.popup('show');
    }

    hide() {
        this.$container.popup('hide');
    }

    reset () {
        this.$title.html('');
        this.$content.html('');
    }

    setTitle(text) {
        this.$title.html(text);
    }

    setSubtitle(text) {
        this.$subTitle.html(text);
    }

    setAppsStatusIcon(icon) {
        this.$appIcon.html(icon);
    }

    setAppWarningSummary(summary) {
        this.$appWarningsSummary.html(summary);
    }

    setAffectedApps(affectedApps) {
        let appsList = `<ul>`;

        for (let i = 0; i < affectedApps.length; i++) {
            const app = affectedApps[i];
            appsList += `<li>${app}</li>`
        }

        appsList += `</ul>`;

        this.$appWarningsAffectedApps.html(appsList);
    }

    setQueuedEmailStatusIcon(icon) {
        this.$emailIcon.html(icon);
    }

    setQueuedDataStatusIcon(icon) {
        this.$queuedDataIcon.html(icon);
    }

    setDatabasesStatusIcon(icon) {
        this.$data.html(icon);
    }

    setCloseButtonColour(colour) {
        this.$closeButton.css("background-color", colour);
    }

    hideWarningsSection() {
        this.$appWarningsContainer.hide();
    }

    showWarningsSection() {
        this.$appWarningsContainer.show();
    }

}

SyncReportView.icons = {
    SUCCESS: '✅',
    WARNING: '&#x26A0;&#xFE0F',
    FAIL: '❌'
};
