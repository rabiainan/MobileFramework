/**
 * Manages data level access for client tables.
 */
const ClientTableRepo = (function() {

    const TABLE_PREFIX = 'tbl_';
    const BACKUP_PREFIX = 'backup_';

    let _db = null;

    const _init = function (db, user, domain) {
        console.log(`ClientTableRepo #init db: ${db}, user: ${user}, domain: ${domain}`);

        return new Promise((resolve, reject) => {
            if (!db || !user || !domain) {
                const msg = 'ClientTableRepo could not be initialised';
                rLog.log({
                    db: db ? 'OK' : db,
                    user: user,
                    domain: domain
                }, msg, rLog.level.ERROR, [rLog.tag.REPO, rLog.tag.SYNC]);
                reject(msg)
            } else {
                _db = db;
                resolve();
            }
        });
    };

    const _getVersions = function () {
        console.log(`ClientTableRepo #_getVersions`);

        return new Promise((resolve, reject) => {
            const versions = {};

            _db.transaction(tx => {
                const stmt = "SELECT tableId, timestamp FROM table_modified";
                tx.executeSql(stmt, [], (tx, rs) => {
                    console.log(`ClientTableRepo #_getVersions tables found: ${rs.rows.length}`);

                    for (let i = 0; i < rs.rows.length; i++) {
                        const row = rs.rows.item(i);
                        versions[row["tableId"]] = row["timestamp"];
                    }

                }, (tx, err) => {
                    const msg = `ClientTableRepo: #_getVersions exec SQL failed ${err.message}`;
                    console.error(msg, err);
                    rLog.log({
                        sqlError: err.message,
                        errorCode: err.code
                    }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                    return true;
                })
            }, err => {
                const msg = `ClientTableRepo: #_getVersions TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not get client table versions')
            }, () => {
                resolve(versions);
            });
        });

    };

    /**
     * Wipes table_modified table
     * @returns {Promise<any>}
     * @private
     */
    const _clearVersions = function () {
        console.log(`ClientTableRepo #_clearVersions`);

        return new Promise((resolve, reject) => {

            _db.transaction(tx => {
                const stmt = "DELETE FROM table_modified";
                tx.executeSql(stmt, [], (tx, rs) => {
                    console.log(`ClientTableRepo #_clearVersions exec SQL OK, rows affected: ${rs.rowsAffected}`);
                }, (tx, err) => {
                    const msg = `ClientTableRepo: #_clearVersions exec SQL failed ${err.message}`;
                    console.error(msg, err);
                    rLog.log({
                        sqlError: err.message,
                        errorCode: err.code
                    }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                    return true;
                })
            }, err => {
                const msg = `ClientTableRepo: #_clearVersions TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not get clear table versions table (table_modified)');
            }, () => {
                resolve();
            });
        });

    };

    /**
     * Persists versions object to the database.
     * @param versions
     * @returns {Promise<any>}
     * @private
     */
    const _persistVersions = function (versions = {}) {
        console.log(`ClientTableRepo #_saveVersions: ${versions}`, versions);
        return _clearVersions().then(() => _storeVersions(versions));
    };

    const _storeVersions = function (versions) {
        console.log(`ClientTableRepo #_storeVersions: ${versions}`, versions);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                Object.keys(versions).forEach(tableId => {
                    _storeVersionsTx(tx, tableId, versions[tableId]);
                });
            }, err => {
                const msg = `ClientTableRepo: #_storeVersions TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    versions: versions
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not save table versions');
            }, () => {
                console.log(`ClientTableRepo: _storeVersions completed successfully`);
                resolve();
            });

        });
    };

    const _storeVersionsTx = function (tx, tableId, timestamp) {
        console.log(`ClientTableRepo #_storeVersionsTx tableId: ${tableId}, timestamp: ${timestamp}`);

        const stmt = `INSERT INTO table_modified (tableId, timestamp) VALUES (?, ?)`;
        const params = [tableId, timestamp];

        tx.executeSql(stmt, params,
            (tx, rs) => {
                console.log(`ClientTableRepo: Table ${tableId} version (${timestamp}) stored OK. (rowsAffected: ${rs.rowsAffected})`);
            }, (tx, err) => {
                const msg = `ClientTableRepo: FAILED to store table version. Table ${tableId}, version: ${timestamp} err: ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    tableId: tableId,
                    version: timestamp instanceof Date ? timestamp.toString() : timestamp
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                return true;
            }
        );
    };

    const _getAllNames = function (type, backups) {
        console.log(`ClientTableRepo #_getAllNames type ${type}, backups flag: ${backups}`);

        const prefix = backups ? BACKUP_PREFIX : TABLE_PREFIX;

        return new Promise((resolve, reject) => {

            let names = [];

            _db.transaction(tx => {
                const stmt = "SELECT name FROM sqlite_master WHERE type = ?";
                const params = [type];
                tx.executeSql(stmt, params,
                    (tx, rs) => {
                        console.log(`ClientTableRepo #_getAllNames tables found: ${rs.rows.length}`);

                        while (names.length < rs.rows.length) {
                            names.push(rs.rows.item(names.length)['name']);
                        }

                        names = names.filter(name => name.startsWith(prefix));

                    }, (tx, err) => {
                        const msg = `ClientTableRepo: #_getAllNamesTx exec SQL failed ${err.message}`;
                        console.error(msg, err);
                        rLog.log({
                            sqlError: err.message,
                            errorCode: err.code
                        }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                        return true;
                    }
                );
            }, err => {
                const msg = `ClientTableRepo: #_getAllNamesTx TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not get client table names')
            }, () => {
                resolve(names)
            });

        });
    };

    const _dropTableTx = function (tx, name) {
        console.log(`ClientTableRepo #_dropTableTx name: ${name}`);

        const stmt = `DROP TABLE IF EXISTS ${name}`;

        tx.executeSql(stmt, [],
            (tx, rs) => {
                console.log(`ClientTableRepo: Table ${name} dropped OK`);
            }, (tx, err) => {
                const msg = `ClientTableRepo: FAILED to drop table ${name} err: ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    tableName: name
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                return true;
            }
        );
    };

    const _dropTables = function (tables) {
        console.log(`ClientTableRepo #_dropTables tables: ${tables.length}`, tables);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                tables.forEach(table => _dropTableTx(tx, table));
            }, err => {
                const msg = `ClientTableRepo: #_dropTables TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    tables: JSON.stringify(tables)
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not drop client tables');
            }, () => {
                console.log(`ClientTableRepo: _dropTables completed successfully`);
                resolve();
            });

        });
    };

    /**
     * Builds and returns an SQL statement to create database table representation of a DataStructure and any required
     * indices.
     * @param structure
     * @private
     */
    const _buildCreateTableStmt = function (structure) {
        console.log(`ClientTableRepo #_buildCreateTableStmt structure:`, structure);

        const tableName = structure.getTableName();
        let stmt = `CREATE TABLE ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER`;

        structure.eachField((name, field) => {

            if (name === 'id') {
                return
            }

            const unique = (field.getUnique() === true) ? ' unique' : '';
            const dbFieldName = field.getDbFieldName();
            const fieldType = field.getSqlType();


            stmt += ', ' + dbFieldName + ' ' + fieldType + (fieldType.match(/(VARCHAR|LONGTEXT)/ig) ? ' COLLATE NOCASE' : '') + ' default null ' + unique;// + pk;
        });

        stmt += ')';

        return stmt;
    };

    /**
     * Compiles a CREATE INDEX... sql statement for a structure with key constraints enabled.
     * @param structure
     * @param keyFields
     * @param suffix
     * @returns {*}
     * @private
     */
    const _buildCreateIndexStmt = function(structure, keyFields, suffix = 0) {
        console.log(`ClientTableRepo #_buildCreateIndexStmt suffix: ${suffix}, keyFields: ${keyFields.length}, structure:`, structure);

        const tableName = structure.getTableName();

        const indexName = `${tableName}_pk_index_${keyFields.join('')}_${suffix}`;
        return `CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${keyFields.join(',')})`;
    };

    /**
     * Extracts key fields from data structure
     * @param structure
     * @returns {Array}
     * @private
     */
    const _getKeyFields = function(structure) {
        console.log(`ClientTableRepo #_getKeyFields structure:`, structure);

        const keyFields = [];

        structure.eachField((name, field) => {
            if (field.getKeyField() === true) {
                keyFields.push(field.getDbFieldName());
            }
        });

        return keyFields;
    };

    const _createTableTx = function (tx, sql) {
        console.log(`ClientTableRepo #_createTable sql: ${sql}`);

        tx.executeSql(sql, [],
            (tx, rs) => {
                console.log(`ClientTableRepo: Table ${sql} created OK`);
            }, (tx, err) => {
                const msg = `ClientTableRepo: FAILED to create table sql ${sql} err: ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    sql: sql
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                return true;
            }
        );
    };

    const _createIndexTx = function (tx, indexStmt) {
        console.log(`ClientTableRepo #_createIndices structure:`, indexStmt);

        tx.executeSql(indexStmt, [],
            (tx, rs) => {
                console.log(`ClientTableRepo: Index stmt ${indexStmt} created OK`);
            }, (tx, err) => {
                const msg = `ClientTableRepo: FAILED to create index ${indexStmt} err: ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    indexStmt: indexStmt
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                return true;
            }
        );
    };

    const _getCurrentIndexNames = function() {
        console.log(`ClientTableRepo #_getCurrentIndexNames`);
        return _getAllNames(tableTypes.INDEX, false);
    };

    /**
     * Creates tables from data structures.
     * @param structures
     * @param currentIndices
     * @returns {Promise<any>}
     * @private
     */
    const _createTables = function (structures, currentIndices) {
        console.log(`ClientTableRepo #_createTables structures: ${structures.length}, currentIndices: ${currentIndices.length}`, structures);

        return new Promise((resolve, reject) => {
            _db.transaction(tx => {
                structures.forEach(structure => {
                    const createTableStmt = _buildCreateTableStmt(structure);
                    _createTableTx(tx, createTableStmt);

                    // Create index if needed.
                    const keyFields = _getKeyFields(structure);

                    if (keyFields.length !== 0) {
                        const nextIndexSuffix = _getNextIndexSuffix(structure, currentIndices);
                        const createIndexStmt = _buildCreateIndexStmt(structure, keyFields, nextIndexSuffix);
                        _createIndexTx(tx, createIndexStmt);
                    }
                });
            }, err => {
                const msg = `ClientTableRepo: #_createTables TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not create client tables');
            }, () => {
                console.log(`ClientTableRepo: _createTables completed successfully`);
                resolve();
            });

        });
    };

    const _createTable = function(structure) {
        console.log(`ClientTableRepo #_createTable structure ${structure}:`, structure);
        return _getCurrentIndexNames().then(indexNames => _createTables([structure], indexNames));
    };

    /**
     * Returns suffix to be used for table index
     * @param structure
     * @param currentIndices
     * @private
     */
    const _getNextIndexSuffix = function(structure, currentIndices) {
        console.log(`ClientTableRepo #_getNextIndexSuffix currentIndices ${currentIndices.length}, structure:`, structure);

        const tableName = structure.getTableName();
        let currentIndexName = currentIndices.filter(name => name.includes(tableName));

        if (currentIndexName.length === 0) {
            return "0";
        } else {
            // There should be no more than 1 index per table.
            currentIndexName = currentIndexName[0];
        }

        const parts = currentIndexName.split('_');
        const currentSuffix = parts[parts.length - 1];
        const nextSuffix = Number(currentSuffix) + 1;
        return String(nextSuffix);
    };

    /**
     * Function to persist Client Table Data as it is returned from PTD microservice (prepared statements).
     * @param stmt
     * @param params
     * @returns {Promise<any>}
     * @private
     */
    const _persistData = function (stmt, params, progressCallback) {
        console.log(`ClientTableRepo #_persistData stmt ${stmt}:`);

        return new Promise((resolve, reject) => {

            _db.transaction(tx => {
                tx.executeSql(stmt, params,
                    (tx, rs) => {
                        if(typeof progressCallback === 'function') {
                            progressCallback();
                        }
                    },
                    (tx, err) => {
                        const msg = `ClientTableRepo #_persistData: Failed to exec bulk stmt`;
                        console.error(msg, err);
                        rLog.log({
                            sqlError: err.message,
                            stmt: stmt
                        }, 'Failed to execute bulk statement', rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);
                        return true;
                    }
                );
            }, err => {
                const msg = `ClientTableRepo: #_persistData TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Failed to persist client table data.');
            }, () => {
                console.log(`ClientTableRepo: _persistData TX completed successfully stmt: ${stmt}`);
                resolve();
            });
        });
    };

    /**
     * Function to persist Client Table Data as it is returned from PTD microservice with init and final statements
     * (prepared statements).
     * @param data - Client data as it is returned by PTD having init and final statements and params
     * @returns {Promise<any>}
     * @private
     */
    const _persistBulkData = function (data, progressCallback) {
        console.log(`ClientTableRepo #_persistBulkData data ${data}:`);

        return new Promise((resolve, reject) => {

            _db.transaction(tx => {

                if (!data) {
                    resolve();
                }

                const initStmt = data.statements.init;
                const finalStmt = data.statements.final;
                const initParams = data.params.init;
                const finalParams = data.params.final;

                for (let i = 0; i < initParams.length; i++) {
                    const param = initParams[i];
                    tx.executeSql(initStmt, param,
                        (tx, rs) => {
                            if(typeof progressCallback === 'function') {
                                progressCallback();
                            }
                        },
                        (tx, err) => {
                            const msg = `ClientTableRepo #_persistBulkData: Failed to exec bulk stmt`;
                            console.error(msg, err);
                            rLog.log({
                                sqlError: err.message,
                                initStmt: initStmt
                            }, 'Failed to execute initStmt bulk statement', rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);
                            return true;
                        }
                    );
                }

                if (finalStmt && finalParams) {
                    tx.executeSql(finalStmt, finalParams,
                        (tx, rs) => {
                            if(typeof progressCallback === 'function') {
                                progressCallback();
                            }
                        },
                        (tx, err) => {
                            const msg = `ClientTableRepo #_persistBulkData: Failed to exec bulk stmt`;
                            console.error(msg, err);
                            rLog.log({
                                sqlError: err.message,
                                finalStmt: finalStmt
                            }, 'Failed to execute finalStmt bulk statement', rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.PTD]);
                            return true;
                        }
                    );
                }
            }, err => {
                const msg = `ClientTableRepo: #_persistBulkData TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Failed to persist client table data.');
            }, () => {
                console.log(`ClientTableRepo: _persistBulkData TX completed successfully `);
                resolve();
            });
        });
    };

    /**
     * Function renames current table with 'backup_' prefix.
     * NOTE: current table would cease to exists under its all name.
     */
    const _renameTables = function (tableNames = [], backup = true) {
        console.log(`ClientTableRepo #_renameTables tableNames: ${tableNames.length}`, tableNames);

        return new Promise((resolve, reject) => {

            _db.transaction(tx => {
                tableNames.forEach(tableName => {
                    if (backup) {
                        _renameTableToBackupTx(tx, tableName);
                    } else {
                        _renameTableToRestoreTx(tx, tableName);
                    }
                });
            }, err => {
                const msg = `ClientTableRepo: #_renameTables TX failed ${err.message}`;
                console.error(msg, err);
                rLog.log({
                    sqlError: err.message,
                    errorCode: err.code,
                    tableNames: JSON.stringify(tableNames),
                }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                reject('Could not get rename table for backup!')
            }, () => {
                resolve();
            });
        });
    };

    const _renameTableToBackupTx = function (tx, tableName) {
        console.log(`ClientTableRepo #_renameTableToBackupTx tableName ${tableName}`);

        const newTableName = BACKUP_PREFIX + tableName;

        const stmt = `ALTER TABLE ${tableName} RENAME TO ${newTableName}`;

        tx.executeSql(stmt, [],
            (tx, rs) => {
                console.log(`ClientTableRepo #_renameTableToBackupTx exec SQL OK, rows affected: ${rs.rowsAffected}`);
            }
        );
    };

    const _renameTableToRestoreTx = function (tx, backupTableName) {
        console.log(`ClientTableRepo #_renameTableToRestoreTx backupTableName ${backupTableName}`);

        const newTableName = backupTableName.replace(BACKUP_PREFIX, '');

        const stmt = `ALTER TABLE ${backupTableName} RENAME TO ${newTableName}`;

        tx.executeSql(stmt, [],
            (tx, rs) => {
                console.log(`ClientTableRepo #_renameTableToRestoreTx exec SQL OK, rows affected: ${rs.rowsAffected}`);
            }
        );
    };

    const _renameTableToBackup = function (tableName) {
        console.log(`ClientTableRepo #_renameTableToBackup tableName ${tableName}`);
        return _renameTables([tableName], true);
    };

    /**
     * Renames tables from backup to standard convention.
     * @param backupTableNames
     */
    const _restoreTables = function (backupTableNames) {
        console.log(`ClientTableService #_restoreTables: backupTableNames: ${backupTableNames.length}`, backupTableNames);
        return _renameTables(backupTableNames, false);
    };

    const tableTypes = {
        TABLE: 'table',
        INDEX: 'index'
    };

    return {
        init: _init,
        getAllNames: _getAllNames,
        createTable: _createTable,
        dropTables: _dropTables,
        getVersions: _getVersions,
        persistData: _persistData,
        persistBulkData: _persistBulkData,
        persistVersions: _persistVersions,
        renameTableToBackup: _renameTableToBackup,
        restoreTables: _restoreTables,
        get BACKUP_PREFIX() {
            return BACKUP_PREFIX;
        },
        get TABLE_PREFIX() {
            return TABLE_PREFIX;
        },
        get type() {
            return tableTypes;
        }
    }
})();
