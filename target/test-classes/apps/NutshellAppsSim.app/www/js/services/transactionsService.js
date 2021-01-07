const TransactionsService = (function(){

    let _repo = null;
    let _user = null;
    let _domain = null;

    const _init = function(repo, user, domain) {
        console.log(`TransactionsService: #_init user: ${user}, domain: ${domain}`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _repo = repo;
                _user = user;
                _domain = domain;
                res();
            } else {
                rej('Transactions repo is not initialised!');
            }
        });
    };

    const _getTotalCount = function() {
        console.log(`TransactionsService: #_getTotalCount`);
        return _repo.getTotalCount(_user, _domain);
    };

    return {
        init: _init,
        getTotalCount: _getTotalCount
    }

})();