class NutshellMessagePresenter {

    constructor(model, view) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);

        this.init();
    }

    init() {
        const ctx = this;

        if (this.model.currentUserSynced()) {
            this._processMessages();
        } else {
            const syncComplete = function() {
                EventBus.removeEventListener("syncReportClosed", syncComplete);
                ctx._processMessages();
            };

            EventBus.addEventListener("syncReportClosed", syncComplete);
        }
    }

    _processMessages() {
        const message = this.model.nextMessage();

        if (message) {
            this._onNewMessage(message);
        } else {
            this.model.attachNewMessageListener(() => this._onNewMessageAvailableListener());
        }
    }

    _onNewMessageAvailableListener() {
        this.model.removeNewMessageListener();
        this._processMessages();
    }

    _onNewMessage(message) {
        console.log(`NutshellMessagePresenter: new message received: `, message);

        const action = message.getAction();

        switch (action) {
            case NutshellMessage.action.TRUE_FSYNC:
            case NutshellMessage.action.FSYNC:
            case NutshellMessage.action.SYNC:
                this._performSyncAction(message);
                break;
            case NutshellMessage.action.LOGOUT:
                this._performLogoutAction(message);
                break;
            case NutshellMessage.action.NONE:
                this._performNoAction(message);
                break;
            default:
                const errMsg = `NutshellMessagePresenter: Unknown message action ${action}`;
                console.error(errMsg);
                rLog.log({message: message}, errMsg, rLog.level.ERROR, [rLog.tag.NMS, rLog.tag.MVP]);
                break;
        }
    }

    _performSyncAction(message) {

        let subtext = null;
        let buttons = null;

        if (this.model.getLastSyncTimestamp() > message.getCreatedOn()) {
            buttons = ['OK'];
            subtext = "Sync has already been done. No action required.";
        } else if (message.getAction() === NutshellMessage.action.SYNC) {
            buttons = ['Remind Me Later', 'Sync Now'];
        } else if (message.getAction() === NutshellMessage.action.FSYNC
            || message.getAction() === NutshellMessage.action.TRUE_FSYNC) {
            buttons = ['Sync Now'];
        }

        this._setViewContent(message, subtext, buttons);

        this.view.show().then(choice => {

            this.view.reset();

            switch (choice) {
                case 'OK':
                    this._acknowledgeMessage(message).then(() => {
                        this._messageComplete(message);
                    });
                    break;
                case 'Remind Me Later':
                    this._messageComplete(message);
                    break;
                case 'Sync Now':
                    this._requestSync(message);
                    break;
            }
        });
    }

    _performNoAction(message) {
        let buttons = ['OK'];
        this._setViewContent(message, null, buttons);

        this.view.show().then(() => {
            this.view.reset();
            this._acknowledgeMessage(message).then(() => {
                this._messageComplete(message);
            });
        });
    }

    _performLogoutAction(message) {
        let buttons = ['Logout'];
        this._setViewContent(message, null, buttons);

        this.view.show().then(() => {
            this.view.reset();
            this._acknowledgeMessage(message).then(() => {
                this._requestLogout();
            });
        });
    }

    _setViewContent(message, subtext, buttons) {
        this.view.setTitle(message.getTitle());
        this.view.setMessage(message.getMessage());
        this.view.setSubtext(subtext);
        this.view.setButtons(buttons);
    }

    _acknowledgeMessage(message) {
        const id = message.getId();
        return this.model.acknowledgeMessageId(id);
    }

    _messageComplete(message) {
        this.model.removeMessage(message.getId());
        this._processMessages();
    }

    _requestSync(message) {
        const ctx = this;
        const isTrueForceSync = message === NutshellMessage.action.TRUE_FSYNC;

        const syncComplete = function() {
            EventBus.removeEventListener("syncReportClosed", syncComplete);
            ctx._acknowledgeMessage(message).then(() => {
               ctx._messageComplete(message);
            });
        };

        EventBus.addEventListener("syncReportClosed", syncComplete);

        this.model.requestSync(isTrueForceSync);
    }

    _requestLogout() {
        this.model.requestLogout();
    }

}
