/**
 * Module to provide access to device contacts. Module should be exposed to compiled app via Nutshell API.
 * NOTE: All functions exposed by this module are to be treated as part of container API. Changes, therefore, are most
 * likely to be breaking ones.
 */
const CapiContacts = (function() {

    let _contactsService = null;

    const _init = function (contactsService) {
        console.log(`Capi.contacts#_init: contactsService: ${contactsService}`);
        return new Promise((resolve, reject) => {

            if (!contactsService) {

                const errMsg = "Cannot initialise Capi Contacts ";
                console.error(errMsg);
                rLog.log({
                    service: contactsService,
                }, errMsg, rLog.level.CRITICAL, [rLog.tag.CAPI]);

                reject(errMsg)

            } else {
                _contactsService = contactsService;
                resolve();
            }
        });
    };

    /**
     * Returns a promise which resolves to an array of contact objects.
     */
    const _getAll = function (format) {
        console.log(`Capi.contacts#_getAll`);

        return new Promise((resolve, reject) => {

            let formatStrategy = null;

            switch (format) {
                case _format.FLAT:
                    formatStrategy = new ContactFormatFlat();
                    break;
                case _format.RAW:
                    /*
                     *  Unformatted contacts as they are returned by the plugin. This might be used for testing or
                     *  prototyping purposes without the need to republish the container.
                     */
                    formatStrategy = new ContactFormatRaw();
                    break;
                default:
                    console.error("Capi.contacts#_getAll: Unknown formatting requested. format: " + format);
                    reject("Format unknown: " + format);
            }

            _contactsService.getAll(formatStrategy).then(contacts => {

                const response = {
                    contacts: contacts
                };

                resolve(response);
            }).catch(err => {
                console.error(`Error getting contacts`, err);
                reject(err);
            });
        });
    };

    const _format = {
        FLAT: "flat",
        RAW: "raw"
    };

    return {
        init: _init,
        getAll: _getAll,
        format: _format
    }

})();
