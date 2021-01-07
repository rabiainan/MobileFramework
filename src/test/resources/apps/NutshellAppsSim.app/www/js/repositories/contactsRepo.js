const ContactsRepo = (function() {

    const WARNING_THRESHOLD_SECONDS  = 30;

    let _plugin = null;

    const _init = function(plugin) {
        console.log('ContactsRepo: #_init plugin:', plugin);

        return new Promise(function(resolve, reject) {

            if (plugin) {
                _plugin = plugin;
                resolve();
            } else {
                reject("Contacts plugin not found!");
                rLog.log({
                    plugin: plugin
                }, "Contacts plugin not found!", rLog.level.ERROR, [rLog.tag.REPO]);
            }
        });
    };

    const _isInit = function () {
        console.log(`ContactRepo#_isInit`);
        return _plugin !== null
    };


    const _getAll = function() {
        console.log(`ContactsRepo#_getAll`);

        return new Promise((resolve, reject) => {

            const options = new ContactFindOptions();
            options.filter = "";
            options.multiple = true;

            // Cordova contacts plugin is extremely slow if requesting "note" field. Therefore we omit it.
            options.desiredFields =
                Object.values(navigator.contacts.fieldType).filter(field => field !== navigator.contacts.fieldType.note);

            const fields = ["displayName"];

            const onSuccess = function(contacts) {
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000;
                const msg = `Loaded ${contacts.length} contacts in ${duration} seconds.`;
                console.log(msg);

                // RLog is if contact loading took longer than expected.
                if (duration > WARNING_THRESHOLD_SECONDS) {
                    rLog.log({
                        contactsLength: contacts.length
                    }, msg, rLog.level.ERROR, [rLog.tag.REPO]);
                }

                resolve(contacts);
            };

            const onError = function(contactError) {
                const errMsg = "Could not read device contacts";
                console.error(errMsg, contactError);

                rLog.log({
                    contactError: contactError
                }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);

                reject(errMsg);
            };

            // Get all contacts.
            const startTime = Date.now();
            _plugin.find(fields, onSuccess, onError, options);
        });

    };

    return {
        init: _init,
        isInitialised: _isInit,
        getAll: _getAll,
    };
})();
