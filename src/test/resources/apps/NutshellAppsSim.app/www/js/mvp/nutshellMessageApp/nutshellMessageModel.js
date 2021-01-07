class NutshellMessageModel {

    constructor(nutshellMessageService, logout) {
        this.nutshellMessageService = nutshellMessageService;
        this.messageQueue = new NutshellMessageQueue();
        this.logout = logout;
        this.subscribeMessages();

        // TODO: Remove after debugging! 03/12/2019
        window.nutshellMessageQueue = this;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    subscribeMessages() {
        this.nutshellMessageService.attachNewMessageOnlyListener(message => this._onNewMessage(message));
    }

    _onNewMessage(message) {
        this.messageQueue.add(message)
    }

    acknowledgeMessageId(messageId) {
        return this.nutshellMessageService.acknowledgeMessageId(messageId);
    }

    nextMessage() {
        return this.messageQueue.remove();
    }

    attachNewMessageListener(listener) {
        this.messageQueue.subscribe(listener);
    }

    removeNewMessageListener() {
        this.messageQueue.unsubscribe();
    }

    getLastSyncTimestamp() {
         return new Date(localStorage.getItem('lastSyncedOn'));
    }

    requestLogout() {
        this.logout();
    }

    initiateSync() {
        localStorage.removeItem('lastSyncedDomain');
        NsNavigator.navigateToScreen('home.html');
    }
}

