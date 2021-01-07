/**
 * Service to handle business logic associated with client logic.
 */
const ClientTableService = (function() {

    let _repo = null;
    let _user = null;
    let _domain = null;

    let _currentTableNames = [];

    const _init = function (repo, user, domain) {
        console.log(`ClientTableService #_init, repo: ${repo}, user ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            if (!repo || ! user || !domain) {
                reject('Could not initialise ClientTableService')
            } else {
                _repo = repo;
                _user = user;
                _domain = domain;
                resolve();
            }
        });
    };

    const _getLocalVersions = function() {
        console.log(`ClientTableService #_getLocalVersions`);
        return _repo.getVersions();
    };

    /**
     * Function takes care of preparing table and persisting its data.
     * @param structure
     * @param data
     */
    const _saveClientTable = function(structure, data) {
        console.log(`ClientTableService #_saveClientTable: structure: ${structure}, data: ${data}`);

        // TODO: 06/02/2019 Cater for PK index
        if(_currentTableNames.includes(structure.getTableName())){
            return _repo.renameTableToBackup(structure.getTableName())
                .then(() => _repo.createTable(structure))
                .then(() => _storeData(data));
        } else {
            return _repo.createTable(structure).then(() => _storeData(data));
        }
    };

    /**
     * Function to store data as returned from Pull Table Data microservice.
     * @param data
     * @private
     */
    const _storeData = function(data) {
        console.log(`ClientTableService #_storeData: data: ${data}`);

        if (!data) {
            return Promise.resolve();
        }

        return _repo.persistBulkData(data);
    };

    /**
     * Function creates an empty object for
     * @private
     */
    const _createEmptyStorageRequest = function() {
        return {
            statements: {
                init: '',
                final: ''
            },
            params: {
                init: [],
                final: ''
            }
        };
    };

    /**
     * Function to replace current client table versions with new ones.
     * @param versions
     * @private
     */
    const _saveVersions = function(versions) {
        console.log(`ClientTableService #_saveVersions: versions: ${versions}`, versions);

        return _repo.persistVersions(versions)
    };

    /**
     * Must be called before sync process is started. Drops all backup tables and prepares a list of current client
     * tables.
     * @returns {Promise<any>}
     * @private
     */
    const _prepareToSync = function() {
        console.log(`ClientTableService #_prepareToSync`);

        return new Promise((resolve, reject) => {
            _dropAllBackupTables().then(() =>{
                return _repo.getAllNames(ClientTableRepo.type.TABLE, false);
            }).then(currentTableNames => {
                console.log(`ClientTableService #_prepareToSync saving current tables ${currentTableNames.length}`, currentTableNames);
                _currentTableNames = [];
                currentTableNames.forEach(name => _currentTableNames.push(name));
                resolve();
            }).catch(err => reject(err));
        });

    };

    /**
     * Must be called for sync process to be finalised.
     * @returns {Promise<any>}
     * @private
     */
    const _completeSync = function() {
        console.log(`ClientTableService #_completeSync`);
        _currentTableNames = [];
        return _dropAllBackupTables();
    };

    /**
     * Function drops all backup tables.
     * @returns {Promise<unknown>}
     * @private
     */
    const _dropAllBackupTables = function() {
        console.log(`ClientTableService #_dropAllBackupTables`);

        return new Promise((resolve, reject) => {
            _repo.getAllNames(ClientTableRepo.type.TABLE, true).then(backupTableNames => {
                return _repo.dropTables(backupTableNames);
            }).then(() => {
                resolve();
            }).catch(err => reject(err));
        });
    };

    /**
     * Must be called if sync process has failed.
     * @returns {Promise<any>}
     * @private
     */
    const _revertSync = function() {
        console.log(`ClientTableService #_revertSync`);

        let _backupTableNames = null;

        return new Promise((resolve, reject) => {
            _repo.getAllNames(ClientTableRepo.type.TABLE, true).then(backupTableNames => {
                _backupTableNames = backupTableNames;
                const derivedTableNames = backupTableNames.map(name => name.replace(_repo.BACKUP_PREFIX, ""));
                return _repo.dropTables(derivedTableNames);
            }).then(() => {
                return _repo.restoreTables(_backupTableNames);
            }).then(() => {
                return _repo.getAllNames(ClientTableRepo.type.TABLE, false);
            }).then(tableNames => {
                // Tables which were not here before sync started. will be deleted.
                const tablesToDelete = tableNames.filter(name => !_currentTableNames.includes(name));
                return _repo.dropTables(tablesToDelete);
            }).then(() => {
                console.log(`ClientTableService #_revertSync RESTORE completed OK.`);
                _currentTableNames = null;
                resolve();
            }).catch(err => {
                console.error(`ClientTableService #_revertSync RESTORE FAILED`, err);
                _currentTableNames = null;
                reject(err)
            });
        });

    };

    const _getTableIds = function() {
        console.log(`ClientTableService #_getTableIds`);

        return new Promise((resolve, reject) => {
            _repo.getAllNames(ClientTableRepo.type.TABLE, false)
                .then(names => {
                    names = names.map(name => name.replace(_repo.TABLE_PREFIX, "")).map(id => Number(id));
                    console.log(`ClientTableService #_getTableIds returning table ids: ${names.length}`, names);
                    resolve(names);
                }).catch(err => reject(err));
        });
    };

    const _removeTables = function(tableIds) {
        console.log(`ClientTableService #_removeTables ${tableIds.length}`, tableIds);

        const namesToDelete = tableIds.map(id => _repo.TABLE_PREFIX.concat(id));
        return _repo.dropTables(namesToDelete);
    };

    return {
        init: _init,
        getLocalVersions: _getLocalVersions,
        getNoDataRequest: _createEmptyStorageRequest,
        saveVersions: _saveVersions,
        saveClientTable: _saveClientTable,
        prepareToSync: _prepareToSync,
        completeSync: _completeSync,
        revertSync: _revertSync,
        getTableIds: _getTableIds,
        removeTables: _removeTables,
        dropAllBackupTables: _dropAllBackupTables
    }
})();
