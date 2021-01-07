const rLog = (function(fb) {

    let _collection = null;
    let _domain = null;
    let _user = null;
    let _sessionId = null;

    const _init = function(domain, user, sessionId) {
        console.log('rLog: initializing...');

        return new Promise(function(resolve, reject) {

            if (!fb) {
                reject()
            }

            _collection = fb.firestore().collection("rLogs");
            _domain = domain;
            _user = user;
            _sessionId = sessionId;
            console.log('rLog: initialized.');
            resolve();
        });
    };

    const _log = function(data, message, level, tags, opt = {}) {
        console.log(`rLog: logging... message: ${message}, data: ${data}, tags: ${tags}, level ${level}, opt: ${opt}`);

        return new Promise(function(resolve, reject) {

            const sanitisedData = Object.assign({}, data);
            _sanitise(sanitisedData);

            try {

                _collection.add({
                    domain: opt['domain'] || _domain,
                    user: opt['user'] || _user,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    level: level,
                    tags: tags,
                    data: sanitisedData,
                    message: message,
                    client: _buildContextInfo(),
                    sessionId: _sessionId,
                    app: _buildAppMeta(),
                }).then(function (docRef) {
                        console.log(`rLog written. ID: ${docRef.id}`);
                        resolve();
                }).catch(function (error) {
                    console.error("Error adding document: ", error);
                    reject()
                });

            } catch (e) {

                _collection.add({
                    domain: opt['domain'] || _domain,
                    user: opt['user'] || _user,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    level: level,
                    tags: tags,
                    data: 'FAILED TO PARSE DATA!',
                    message: message,
                    client: _buildContextInfo(),
                    sessionId: _sessionId,
                    app: _buildAppMeta(),
                }).then(function (docRef) {
                        console.log(`rLog written. ID: ${docRef.id}`);
                        resolve();
                }).catch(function (error) {
                    console.error("Error adding document: ", error);
                    reject()
                });

            }
        });
    };

    const _sanitise = function(obj) {
        _removeFunctions(obj);
        _stringifyUndefined(obj);
        _convertToSimpleObject(obj);
    };

    const _removeFunctions = function(obj) {
        for (const key in obj) {
            const item = obj[key];
            if (typeof item === 'function') {
                delete obj[key];
            } else if (typeof item === "object") {
                _removeFunctions(item);
            }
        }
    };

    const _stringifyUndefined = function(obj) {
        for (const key in obj) {
            const item = obj[key];
            if (typeof item === 'undefined') {
                obj[key] = 'undefined';
            } else if (typeof item === "object") {
                _stringifyUndefined(item);
            }
        }
    };

    const _convertToSimpleObject = function(obj) {
        for (const key in obj) {
            const item = obj[key];
            if (typeof item === "object") {

                if (item instanceof Error){
                    obj[key] = {
                        error: item.toString(),
                        stack: item.stack,
                        name: item.name
                    };
                } else {
                    obj[key] = Object.assign({}, item);
                   _stringifyUndefined(obj[key]);
                }
            }
        }
    };

    const _buildContextInfo = function() {
        return {
            containerVersion: Conf.CONTAINER_VERSION,
            hasContainerUser: !!firebase.auth().currentUser,
            timestamp: new Date(),
            device: Object.assign({}, device) || null,
            userAgent: navigator.userAgent || null,
            deviceMemory: navigator.deviceMemory || null,
            connection: Object.assign({},navigator.connection) || null,
            href: location.href
        };
    };

    const _buildAppMeta = function() {
        return {
            appId: localStorage.getItem('appID'),
            appName: localStorage.getItem('appName'),
            jumpModeId: localStorage.getItem('jumpAppModeId')
        }
    };

    const _levels = {
        CRITICAL: 'critical',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        DEV: 'dev'
    };

    const _tags = {
        AUTH: 'auth',
        SYNC: 'sync',
        PTD: 'ptd',
        ASSET_MNG: 'asset mng',
        TX_DEQ: 'tx dequeue',
        TX: 'tx',
        CONFIG: 'config',
        EXPLORER: 'explorer',
        REPO: 'repo',
        APP: 'app',
        DB_MIG: 'db_migration',
        DEV: 'dev',
        DB: 'database',
        FB: 'firebase',
        CAPI: 'container_api',
        STATE: 'state',
        SERVICE: 'service',
        MVP: 'mvp',
        NMS: 'nms',
        DL: 'deep_link'
    };

    return {
        init: _init,
        log: _log,
        level: _levels,
        tag: _tags
    };

})(firebase);
