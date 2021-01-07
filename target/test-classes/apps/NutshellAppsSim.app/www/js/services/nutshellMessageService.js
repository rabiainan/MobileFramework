const NutshellMessageService = (function(){

    let _repo = null;
    let _user = null;
    let _domain = null;
    let _deviceUuid = null;

    let _newMessageListener = null;

    const _init = function(user, domain,  deviceUuid, repo) {
        console.log(`NutshellMessageService#_init, repo:`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _user = user;
                _domain = domain;
                _repo = repo;
                _deviceUuid = deviceUuid;
                res();
            } else {
                rej('NutshellMessageService repository not initialised!');
            }
        });
    };

    const _attachNewMessageOnlyListener = function(listener) {

        if (typeof listener !== 'function') {
            throw new Error('New message listener must be a function.');
        }

        _newMessageListener = listener;
        _setupNewMessageOnlyListener();
    };

    const _setupNewMessageOnlyListener = function() {
        _repo.attachNewMessageListener(_user, _domain, true, (messageId, messageData) => _onNewMessage(messageId, messageData));
    };

    const _attachNewMessageListener = function(listener) {

        if (typeof listener !== 'function') {
            throw new Error('New message listener must be a function.');
        }

        _newMessageListener = listener;
        _setupNewMessageListener();
    };

    const _setupNewMessageListener = function() {
        _repo.attachNewMessageListener(_user, _domain, null, (messageId, messageData) => _onNewMessage(messageId, messageData));
    };

    const _onNewMessage = function(id, messageData) {
        console.log(`NutshellMessageService:_onNewMessage. New message received ${id}. Checking its ACK...`, messageData);

        let message = null;
        try {
            message = NutshellMessage.fromObj(id, messageData);

            _checkAck(message).then(hasAck => {
                console.log(`NutshellMessageService:_onNewMessage. New message ID ${id}. Has ACK = ${hasAck}`);

                if (!hasAck && _newMessageListener) {
                    _newMessageListener(message);
                }
            });

        } catch (e) {
            rLog.log({
                error: e,
                messageId: id,
                messageData: messageData
            }, 'Error parsing NM', rLog.level.ERROR, [rLog.tag.NMS]);
        }
    };

    const _checkAck = function (message) {
        return _repo.checkAck(_user, _domain, message.getId(), _deviceUuid)
    };

    const _acknowledgeMessageId = function(messageId) {
        return _repo.acknowledgeMessageId(_user, _domain, messageId, _deviceUuid);
    };

    return {
        init: _init,
        attachNewMessageOnlyListener: _attachNewMessageOnlyListener,
        attachNewMessageListener: _attachNewMessageListener,
        acknowledgeMessageId: _acknowledgeMessageId
    }

})();
