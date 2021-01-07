const ConfigRepoRemote = (function(fb) {

    let fs = null;
    let collRef = null;

    const _init = function() {
        console.log('ConfigRepoRemote: initializing remote repo.');

        return new Promise(function(resolve, reject) {

            if (!fb) {
                reject()
            } else {
                fs = fb.firestore();
            }

            collRef = fs.collection("configurations");
            resolve();

        });
    };

    const _get = function(domain) {
        console.log(`ConfigRepoRemote: reading configuration for subdomain. ${domain}`);

        return new Promise(function(resolve, reject) {

            const docRef = collRef.doc(domain);

            docRef.get().then(function(doc) {
                console.log(`ConfigRepoRemote: reading done. doc.exists ? ${doc.exists}`);

                if (doc.exists) {
                    console.log(`ConfigRepoRemote: doc.data:`);
                    console.log(doc.data());

                    const data = doc.data();
                    const debug = data['debugFlag'];
                    const pullData = data['pullTableDataUrl'];
                    const pullDataVersions = data['pullTableDataUrlVersions'];
                    const clientTableVersionsUrlVersions = data['clientTableVersionsUrlVersions'];

                    if (typeof debug !== 'undefined' && typeof pullDataVersions !== 'undefined'
                        && typeof clientTableVersionsUrlVersions !== 'undefined') {
                        resolve(data);
                    } else {
                        console.error('ConfigRepoRemote: a property missing data: ', data);
                        rLog.log({partialConfigFound: data}, "ConfigRepoRemote: configuration property missing",
                            rLog.level.WARNING, [rLog.tag.CONFIG]);

                        reject();
                    }
                } else {
                    const errMsg = `ConfigRepoRemote: No configuration for domain: ${domain}`;
                    console.error(errMsg);
                    console.error(doc);
                    rLog.log({}, errMsg, rLog.level.WARNING, [rLog.tag.CONFIG]);
                    reject();
                }

            }).catch(function(error) {
                const errMsg = `ConfigRepoRemote: Error getting configuration for domain: ${domain}`;
                rLog.log({}, errMsg, rLog.level.ERROR, [rLog.tag.CONFIG]);
                console.error(errMsg);
                console.error(error);
                reject();
            });

        });
    };

    return {
        init: _init,
        get: _get,
    };
})(firebase);
