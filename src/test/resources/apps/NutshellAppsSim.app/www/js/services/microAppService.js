const MicroAppService = (function() {

    let _repo = null;
    let _user = null;
    let _domain = null;

    const _init = function(repo, user, domain) {
        console.log(`MicroAppService: #init user: ${user}, domain: ${domain}, repo:`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _repo = repo;
                _user = user;
                _domain = domain;
                res();
            } else {
                rej('MicroAppService repository not initialised!');
            }
        });
    };

    const _getById= function(id) {
        console.log(`MicroAppService#_getById id: ${id}`);
        return _repo.getById(id, _user, _domain);
    };

    const _getByIds= function(ids) {
        console.log(`MicroAppService#_getForIds ids:`, ids);
        return _repo.getByIds(ids, _user, _domain);
    };

    const _getByFolderId = function(folderId) {
        return _repo.getByFolderId(_user, _domain, folderId);
    }

    const _getAutoLaunch = function() {
        console.log(`MicroAppService#_getAutoLaunch`);
        return _repo.getAutoLaunch(_user, _domain);
    };

    const _getAll = function() {
        console.log(`MicroAppService#_getAll`);
        return _repo.getAll(_user, _domain);
    };

    const _saveAll = function(microApps) {
        console.log(`MicroAppService#_saveAll`);
        return _repo.saveAll(_user, _domain, microApps);
    };

    return {
        init: _init,
        getById: _getById,
        getByIds: _getByIds,
        getAll: _getAll,
        getAutoLaunch: _getAutoLaunch,
        getByFolderId: _getByFolderId,
        saveAll: _saveAll
    }

})();
