const DataStructuresRepo = (function() {

    let _db = null;

    const _init = function(db) {
        console.log('DataStructuresRepo: #init');

        return new Promise((resolve, reject) => {

            if (db) {
                _db = db;
                resolve();
            } else {
                reject("Container database not found")
            }
        });
    };

    const _isInit = function () {
        console.log(`DataStructuresRepo: #_isInit`);
        return _db !== null
    };

    /**
     * Gets a single data structure row.
     * @param dsId
     * @param user
     * @param domain
     * @returns {Promise<any>}
     * @private
     */
    const _getStructure = function(dsId, user, domain) {
        console.log(`DataStructuresRepo #_getStructure dsId: ${dsId}, user: ${user}, domain: ${domain}`);

        let structure = null;

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {

                const stmt = 'SELECT * FROM data_structures WHERE dsId = ? AND (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)';
                const params = [dsId, domain, user];

                tx.executeSql(stmt, params, (tx, rs) => {
                    if (rs.rows.length > 0) {
                        structure = resolve(rs.rows.item(0));
                    }
                }, (tx, err) => {
                    const errMsg = 'DataStructuresRepo: _getStructure SQL error';
                    console.error(errMsg, err);
                    rLog.log({
                        sqlError: err.message,
                        dsId: dsId,
                        domain: domain,
                        user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DataStructuresRepo: _getStructure modes TX error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    dsId: dsId,
                    domain: domain,
                    user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                resolve(structure);
            });
        });
    };

    /**
     * Inserts a single data structure into database
     * @param tx - database transaction
     * @param dsId
     * @param structure
     * @param user
     * @param domain
     * @param timestamp
     * @returns {Promise<any>}
     * @private
     */
    const _insertStructureTx = function(tx, dsId, structure, user, domain, timestamp) {
        return new Promise((resolve, reject) => {

            const stmt = 'INSERT OR ROLLBACK INTO data_structures (dsId, datastructure, user, domain, timestamp) VALUES (?, ?, ?, ?, ?)';
            const params = [dsId, structure, user, domain, timestamp];

            tx.executeSql(stmt, params, (tx, rs) => {
                console.log(`DataStructuresRepo dsId: ${dsId}, timestamp ${timestamp} inserted. SQL OK. (insertId: ${rs.insertId}, rowsAffected: ${rs.rowsAffected}`);
            }, (tx, err) => {
                const errMsg = 'DataStructuresRepo: _insertStructure SQL error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    dsId: dsId,
                    domain: domain,
                    user: user
                }, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                return true;
            });
        });
    };

    /**
     * Inserts a single data structure into database
     * @param dsArr
     * @param user
     * @param domain
     * @returns {Promise<any>}
     * @private
     */
    const _insertBulkStructures = function(dsArr, user, domain) {
        console.log(`DataStructuresRepo #_insertBulkStructures user: ${user}, domain: ${domain}, dsArr:`, dsArr);
        console.time("_insertBulkStructures");
        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                dsArr.forEach(ds => _insertStructureTx(tx, ds.dsId, ds.dataStructure, user, domain, ds.timestamp));
            }, err =>  {
                const errMsg = 'DataStructuresRepo: _insertStructure modes TX error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    dsArr: dsArr,
                    domain: domain,
                    user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                console.timeEnd("_insertBulkStructures");
                resolve();
            });
        });
    };

    /**
     * Updates data structure based on id, user and domain.
     * @param dsId
     * @param structure
     * @param user
     * @param domain
     * @param timestamp
     * @returns {Promise<any>}
     * @private
     */
    const _updateStructure = function(dsId, structure, user, domain, timestamp) {
        console.log(`DataStructuresRepo #_updateStructure dsId: ${dsId}, structure ${structure}, user: ${user}, domain: ${domain}, timestamp: ${timestamp}`, structure);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {

                const stmt = 'UPDATE data_structures SET datastructure = ?, timestamp = ? WHERE dsId = ? AND (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)';
                const params = [structure, timestamp, dsId, domain, user];

                tx.executeSql(stmt, params, (tx, rs) => {
                    console.log(`DataStructuresRepo dsId: ${dsId}, UPDATED to timestamp ${timestamp}. SQL OK: (rowsAffected: ${rs.rowsAffected})`);
                }, (tx, err) => {
                    const errMsg = 'DataStructuresRepo: _updateStructure SQL error';
                    console.error(errMsg, err);
                    rLog.log({
                        sqlError: err.message,
                        dsId: dsId,
                        domain: domain,
                        user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DataStructuresRepo: _updateStructure TX error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    dsId: dsId,
                    domain: domain,
                    user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                resolve();
            });
        });
    };

    /**
     * Function deletes all data structures for a user and domain pair.
     * @param user
     * @param domain
     * @returns {Promise<any>}
     * @private
     */
    const _dropAll = function(user, domain) {
        console.log(`DataStructuresRepo #_dropAll, user: ${user}, domain: ${domain}`);
        console.time("deleteAllDs");

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {

                const stmt = `DELETE FROM data_structures WHERE (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
                const params = [domain, user];

                tx.executeSql(stmt, params, (tx, rs) => {
                    console.log(`DataStructuresRepo # _dropAll user: ${user}, domain: ${domain}, DELETE SQL OK. (rowsAffected: ${rs.rowsAffected})`);
                }, (tx, err) => {
                    const errMsg = 'DataStructuresRepo: _dropAll SQL error';
                    console.error(errMsg, err);
                    rLog.log({
                        sqlError: err.message,
                        domain: domain,
                        user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                    return true;
                });
            }, err =>  {
                const errMsg = 'DataStructuresRepo: _dropAll TX error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    domain: domain,
                    user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                console.timeEnd("deleteAllDs");
                resolve();
            });
        });
    };

    const _getAllDataStructureIds = function(domain, user) {
        console.log(`DataStructuresRepo #_getAllDataStructureIds user: ${user}, domain: ${domain}`);

        const dsIds = [];

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {

                const stmt = `SELECT dsId FROM data_structures WHERE (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
                const params = [domain, user];

                tx.executeSql(stmt, params,
                    (tx, rs) => {
                        console.log(`DataStructuresRepo #_getAllDataStructureIds SQL OK. (rows: ${rs.rows.length})`);
                        for (let i = 0; i < rs.rows.length; i++) {
                            dsIds.push(rs.rows.item(i).dsId);
                        }
                    }, (tx, err) => {
                        const errMsg = 'DataStructuresRepo: #_getAllDataStructureIds SQL error';
                        console.error(errMsg, err);
                        rLog.log({
                            sqlError: err.message,
                            domain: domain,
                            user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                        return true;
                });
            }, err =>  {
                const errMsg = 'DataStructuresRepo: _getAllDataStructureIds TX error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    domain: domain,
                    user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                resolve(dsIds);
            });
        });
    };

    const _getAllDataStructures = function(domain, user) {
        console.log(`DataStructuresRepo#getAllDataStructures user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {

            const dataStructures = [];

            _db.readTransaction(tx => {

                const stmt = 'SELECT datastructure FROM data_structures WHERE (user = ? OR user IS NULL) AND (domain = ? OR domain IS NULL)';
                const params = [user, domain];

                tx.executeSql(stmt, params,
                    (tx, rs) => {
                        console.log(`DataStructuresRepo#_getAllDataStructures found ${rs.rows.length}`, rs);

                        for (let i = 0; i < rs.rows.length; i++) {
                            const structure = rs.rows.item(i)['datastructure'];
                            dataStructures.push(structure);
                        }

                    }, (tx, err) => {
                        const errMsg = 'DataStructuresRepo:#_getAllDataStructures SQL error';
                        console.error(errMsg, err);
                        rLog.log({
                            sqlError: err.message,
                            domain: domain,
                            user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                        return true;
                    });
            }, err =>  {
                const errMsg = 'DataStructuresRepo:_getAllDataStructures TX error';
                console.error(errMsg, err);
                rLog.log({
                    sqlError: err.message,
                    domain: domain,
                    user: user}, errMsg, rLog.level.ERROR, [rLog.tag.REPO]);
                reject(err.message);
            }, () => {
                resolve(dataStructures);
            });

        });
    };

    return {
        init: _init,
        isInitialised: _isInit,
        getStructure: _getStructure,
        insertBulkStructures: _insertBulkStructures,
        updateStructure: _updateStructure,
        getAllIds: _getAllDataStructureIds,
        getAllDataStructures: _getAllDataStructures,
        dropAll: _dropAll,
    };
})();
