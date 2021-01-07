const DataStructureService = (function(){

    let _repo = null;
    let _user = null;
    let _domain = null;
    let _injector = null;

    const _init = function(repo, user, domain) {
        console.log(`DataStructureService: #_init user: ${user}, domain: ${domain}`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _repo = repo;
                _user = user;
                _domain = domain;
                _injector = new DataStructureInjector(user, domain);
                res();
            } else {
                rej('DataStructure repo is not initialised!');
            }
        });
    };

    /**
     * Stores an array of data structures.
     * @param structuresArr
     * @returns {Promise<void>}
     * @private
     */
    const _storeDataStructures = function(structuresArr) {
        console.log(`DataStructureService #_storeDataStructures structuresArr ${structuresArr.length}`, structuresArr);
        return _repo.insertBulkStructures(structuresArr, _user, _domain);
    };

    const _removeAll = function() {
        console.log(`DataStructureService #_removeAll`);
        return _repo.dropAll(_user, _domain);
    };

    const _getAllIds = function() {
        return _repo.getAllIds(_domain, _user);
    };

    const _injectDataStructures = function(){
        console.log(`DataStructureService#_injectDataStructures`);

        return new Promise((resolve, reject) => {
            _repo.getAllDataStructures(_domain, _user).then(dataStructures => {
                _injector.inject(dataStructures);
                resolve();
            }).catch(err => {
                reject(err);
            })
        });

    };

    return {
        init: _init,
        storeDataStructures: _storeDataStructures,
        getAllIds: _getAllIds,
        injectDataStructures: _injectDataStructures,
        removeAll: _removeAll
    }

})();
