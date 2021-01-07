class NutshellMessagePresenter {

    constructor(model, view) {
        this.model = model;
        this.model.registerPresenter(this);
        this.view = view;
        this.view.registerPresenter(this);

        this.init();
    }

    init() {

        const onDeploymentLoaded = () => {
            EventBus.removeEventListener("deploymentLoaded", onDeploymentLoaded);
            this._processMessages();
        };

        EventBus.addEventListener("deploymentLoaded", onDeploymentLoaded);
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

        let action = message.getAction();
        let subtext = null;
        let syncNotRequired = this.model.getLastSyncTimestamp() > message.getCreatedOn();

        if (syncNotRequired) {
            subtext = "Sync has already been done. No action required.";
        }

        this._setViewContent(message, subtext);

        if (action === NutshellMessage.action.SYNC) {
            this.view.setLevel(NutshellMessageView.level.GREEN)
        } else if (action === NutshellMessage.action.FSYNC || action === NutshellMessage.action.TRUE_FSYNC) {
            this.view.setLevel(NutshellMessageView.level.AMBER)
        }

        this.view.show().then(() => {

            this.view.reset();

            if (syncNotRequired) {

                // Sync not required. ack message and listen other incoming.
                this._acknowledgeMessage(message).then(() => {
                    this._processMessages();
                });

            } else {

                if (action === NutshellMessage.action.TRUE_FSYNC) {

                    this._acknowledgeMessage(message).then(() => {
                        this._initiateSync();
                    });

                } else {

                    // Message not acknowledged on purpose so that sync it would be shown next time on home screen.
                    this._processMessages();
                }
            }
        });
    }

    _performNoAction(message) {
        this._setViewContent(message, null);
        this.view.setLevel(NutshellMessageView.level.GREEN);

        this.view.show().then(() => {
            this.view.reset();
            this._acknowledgeMessage(message).then(() => {
                this._processMessages();
            });
        });
    }

    _performLogoutAction(message) {
        this._setViewContent(message, null);
        this.view.setLevel(NutshellMessageView.level.RED);

        this.view.show().then(() => {
            this.view.reset();
            this._acknowledgeMessage(message).then(() => {
                // TODO: 09/12/2019 Make sure it works offline.
                this._requestLogout();
            });
        });
    }

    _setViewContent(message, subtext) {
        this.view.setTitle(message.getTitle());
        this.view.setMessage(message.getMessage());
        this.view.setSubtext(subtext);
    }

    _acknowledgeMessage(message) {
        const id = message.getId();
        return this.model.acknowledgeMessageId(id);
    }

    _requestLogout() {
        this.model.requestLogout();
    }

    _initiateSync() {
        this.model.initiateSync()
    }

}
