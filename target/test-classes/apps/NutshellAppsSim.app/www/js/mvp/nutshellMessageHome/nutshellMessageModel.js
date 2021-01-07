class NutshellMessageModel {

    constructor(nutshellMessageService, user, domain, logout) {
        this.nutshellMessageService = nutshellMessageService;
        this.messageQueue = new NutshellMessageQueue();
        this.user = user;
        this.domain = domain;
        this.logout = logout;

        this.subscribeMessages();

        // TODO: Remove after debugging! 03/12/2019
        window.nutshellMessageQueue = this;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    subscribeMessages() {
        this.nutshellMessageService.attachNewMessageListener(message => this.onNewMessage(message));
    }

    onNewMessage(message) {
        this.messageQueue.add(message)
    }

    acknowledgeMessageId(messageId) {
        return this.nutshellMessageService.acknowledgeMessageId(messageId);
    }

    nextMessage() {
        return this.messageQueue.remove();
    }

    removeMessage(id) {
        this.messageQueue.removeById(id);
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

    currentUserSynced() {
        return localStorage.getItem('lastSyncedDomain') === this.domain
            && localStorage.getItem('lastSyncedUser') === this.user;
    }

    requestSync(trueForce) {
        // TODO: 03/12/2019 Once sync service has been extracted into a module pass it rather than sync function.
        if (typeof attemptSync === "function" ) {
            attemptSync(null, true);
        }
    }

    requestLogout() {
        this.logout();
    }
}
