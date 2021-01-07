const ContactsService = (function(){

    let _repo = null;

    const _init = function(repo) {
        console.log(`ContactsService#_init, repo:`, repo);

        return new Promise((res, rej) => {
            if (repo.isInitialised()) {
                _repo = repo;
                res();
            } else {
                rej('ContactsService repository not initialised!');
            }
        });
    };

    const _getAll = function(formatStrategy) {

        return new Promise((resolve, reject) => {
            _repo.getAll().then(contacts => {

                const formatter = new ContactsFormatter();
                formatter.setStrategy(formatStrategy);
                const formattedContacts = formatter.getFormatted(contacts);
                resolve(formattedContacts);

            }).catch(err => {
                reject(err);
            })
        });
    };


    return {
        init: _init,
        getAll: _getAll
    }

})();
