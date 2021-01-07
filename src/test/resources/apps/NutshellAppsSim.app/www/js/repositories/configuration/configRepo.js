const ConfigRepo = (function() {

    const _init = function() {
        console.log('ConfigRepo: initiating.');

        return new Promise(function(resolve, reject) {
            console.log('ConfigRepo: initiation successful.');
            resolve();
        });
    };

    const _get = function(domain) {
        console.log(`ConfigRepo: reading config for domain: ${domain}`);

        return new Promise(function (resolve, reject) {

            let rConf = null;

            ConfigRepoRemote.get(domain)
                .then(
                    function (data) {
                        console.log(`ConfigRepo: got data from remote: domain ${domain}, debug ${data.debugFlag}, pullTableUrlVesrions: ${data.pullTableDataUrlVersions}, assetsManagementUrlVersions: ${data.assetsManagementUrlVersions}, clientTableVersionsUrlVersions ${data.clientTableVersionsUrlVersions}, dataStructureCompileUrlVersions: ${data.dataStructureCompileUrlVersions}`);
                        rConf = data;
                        return ConfigRepoLocal.save(domain, data.debugFlag, data.pullTableDataUrlVersions,
                            data.assetsManagementUrlVersions, data.clientTableVersionsUrlVersions, data.dataStructureCompileUrlVersions);
                    },
                    function () {
                        console.error(`ConfigRepo: failed to get data from remote for domain ${domain}`);
                        return ConfigRepoLocal.get();
                    }
                ).then(
                    function (lConf) {

                        if (rConf && !lConf) {    // Fresh read. Cache updated.
                            console.log(`ConfigRepo: Resolving with remote. Cache updated.`);
                            resolve(rConf);
                        } else if (!rConf && lConf) { // Cache only read.
                            console.log(`ConfigRepo: Resolving with cached. Remote unavailable.`);
                            rLog.log({localConfig: lConf}, "Remote config unavailable. Using local", rLog.level.WARNING,
                                [rLog.tag.CONFIG]);
                            resolve(lConf);
                        } else {    // This should never happen.
                            reject();
                        }
                    }
                ).catch(
                    function () {
                        reject();
                    }
                );
        });
    };

    const _clear = function() {
        console.log('ConfigRepo: clearing configurations.');
        return new Promise(function(resolve, reject) {
            ConfigRepoLocal.clear()
                .then(
                    function () {
                        resolve();
                    }
                ).catch(
                    function () {
                        reject();
                    }
                )
        });
    };

    return {
        init: _init,
        get: _get,
        clear: _clear
    };
})();
