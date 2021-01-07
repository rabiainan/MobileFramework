const NutshellMessageRepo = (function() {


    let _fs = null;

    let _newMessageListener = null;
    let _newMessageUnsubscribe = null;

    const _init = function(fs) {
        console.log('NutshellMessageRepo#_init Firestore:', fs);

        return new Promise(function(resolve, reject) {

            if (fs) {
                _fs = fs;
                resolve();
            } else {
                reject("NutshellMessageRepo failed to initialise.");
            }
        });
    };

    const _isInit = function () {
        console.log(`NutshellMessageRepo#_isInit`);
        return _fs !== null
    };

    /**
     * Attaches new message listener, removing previously attached one if exists.
     * @param user
     * @param domain
     * @param listener - listener function to be called with new message data.
     * @param newOnly - If defined only message created after this date will be returned. Can be used to subscribe to
     * new messages only without initially returning existing ones.
     * @private
     */
    const _attachNewMessageListener = function(user, domain, newOnly, listener) {

        if (typeof listener !== 'function') {
            throw new Error('New message listener must be a function.');
        }

        // Reset listener
        if (_newMessageUnsubscribe !== null) {
            _newMessageUnsubscribe();
        }

        _newMessageListener = listener;

        if (newOnly) {
            _subscribeNewMessagesOnly(user, domain);
        } else {
            _subscribeNewMessages(user, domain);
        }
    };

    const _onNewMessage = function(id, data) {
        console.log("New message received. Data: ", data);
        _newMessageListener(id, data);
    };

    const _subscribeNewMessages = function(user, domain) {

        const _messagesCollRef = _getCollectionRef(user, domain);

        let query = _messagesCollRef.where('expiresOn', '>', new Date());

        // TODO: 19/11/2019 Consider implementing limiter, probably remotely configurable one too.
        _newMessageUnsubscribe = query.onSnapshot(querySnapshot => {
            const docs = querySnapshot.docs;

            docs.sort((d1, d2) => d1.data().createdOn.toDate() - d2.data().createdOn.toDate());

            // TODO: Remove after debugging! 03/12/2019
            console.log("Sorted message docs: ", docs);

            docs.forEach(doc => _onNewMessage(doc.id, doc.data()));
        });
    };

    const _subscribeNewMessagesOnly = function(user, domain) {

        const _messagesCollRef = _getCollectionRef(user, domain);

        let query = _messagesCollRef
            .where('createdOn', '>', new Date())
            .orderBy('createdOn');

        _newMessageUnsubscribe = query.onSnapshot(querySnapshot => {
            const changes = querySnapshot.docChanges();

            changes.forEach(change => {
                if (change.type === 'added') {
                    _onNewMessage(change.doc.id, change.doc.data());
                }
            });
        });
    };


    const _acknowledgeMessageId = function(user, domain, messageId, deviceUuid) {
        console.log(`NutshellMessageRepo:_acknowledgeMessageId user: ${user}, domain: ${domain}, messageId: ${messageId}, deviceUuid: ${deviceUuid}`);

        const ack = {
            ackOn: firebase.firestore.FieldValue.serverTimestamp()
        };

        return new Promise((resolve, reject) => {
            const _messagesCollRef = _getCollectionRef(user, domain);
            _messagesCollRef.doc(messageId)
                .collection('acks')
                .doc(deviceUuid)
                .set(ack)
                .then(() => {
                    console.log(`NutshellMessageRepo: messageId: ${messageId} acknowledged with deviceUuid: ${deviceUuid}.`);
                    resolve()
                }).catch(err => {
                    console.error(`Error acknowledging messageId: ${messageId}, deviceUuid: ${deviceUuid}`, err);
                rLog.log({
                    error: err,
                    messageId: messageId,
                    deviceUuid: deviceUuid,
                    messagesCollRefPath: _messagesCollRef.path
                }, 'NutshellMessageRepo: Error acknowledging message', rLog.level.ERROR, [rLog.tag.NMS, rLog.tag.REPO]);
                    reject(err);
                })
        });
    };

    const _getCollectionRef = function(user, domain) {
        return _fs.collection('services').doc('nms')
            .collection('users').doc(user)
            .collection('domains').doc(domain)
            .collection('messages');
    };

    const _checkAck = function(user, domain, messageId, deviceUuid) {

        return new Promise((resolve, reject) => {
            const _messagesCollRef = _getCollectionRef(user, domain);
            _messagesCollRef.doc(messageId)
                .collection("acks")
                .doc(deviceUuid)
                .get()
                .then(qs => {
                    resolve(qs.exists);
                }).catch(err =>{
                    reject(err);
            });
        });
    };

    return {
        init: _init,
        isInitialised: _isInit,
        attachNewMessageListener: _attachNewMessageListener,
        acknowledgeMessageId: _acknowledgeMessageId,
        checkAck: _checkAck
    };
})();
