function SqlLiteDb(name, version, size) {
    Database.call(this, name, version, size);
    this.db = null;
}

SqlLiteDb.prototype = Object.create(Database.prototype);
SqlLiteDb.prototype = jQuery.extend(SqlLiteDb.prototype, {
    constructor: SqlLiteDb,
    init: function(callback) {
        try
        {
            this.db = ContainerDatabaseManager.getSqlDb(this.name, this.version, this.size);

            if (this.db) {
                callback(true);
            } else {
                callback(false);
            }
        }
        catch (e)
        {
            const errMsg = `SqlLiteDb: Failed to initialise database name: ${this.name}, version: ${this.version}, size: ${this.size}`;
            rLog.log({
                name: this.name,
                version: this.version,
                size: this.size,
            }, errMsg, rLog.level.CRITICAL, [rLog.tag.DB]);
            console.error(errMsg);
            callback(false);
        }
    },
    queueOfflineTransaction: function (tx, structure, action) {
        console.log(`SqlLiteDb #queueOfflineTransaction: action: ${action}`, structure);
        const ctx = this;

        var uuid = null;

        switch (action) {
            case SqlLiteDb.op.INSERT:
                var tableName = DatabaseManager.extractTableName(structure);
                var id = structure.getValue('id').data;
                structure.setValue('id', null);
                uuid = this.uuidIsh();
                var mapStmt = `INSERT OR ROLLBACK INTO ${SqlLiteDb.HASH_TABLE} (key, value, user, domain) VALUES (?, ?, ?, ?)`;
                var mapParams = [this.makeHashMapKey(tableName, id), uuid, ConfigManager.user, ConfigManager.domain];

                tx.executeSql(mapStmt, mapParams,
                    function(tx, result) {
                    },
                    function(tx, error) {
                        console.log(error);
                    }
                );
                this.prepareOfflineTransaction(tx, structure, action, uuid);
                break;
            case SqlLiteDb.op.DELETE:
                var tableName = DatabaseManager.extractTableName(structure[0]);
                var keys = structure.map(s => ctx.makeHashMapKey(tableName, s.getValue('id').getData()));
                var placeholders = structure.map(() => '?').join(',');
                var hashMapStmt = `SELECT key, value FROM ${SqlLiteDb.HASH_TABLE} WHERE key IN (${placeholders}) AND (user = ? OR user IS NULL) AND (domain = ? OR domain IS NULL)`;
                keys.push(ConfigManager.user);
                keys.push(ConfigManager.domain);
                tx.executeSql(hashMapStmt, keys,
                    function(tx, rs) {
                        console.log(`sqlLiteDb: queueOfflineTransaction() UUIDs found: ${rs.rows.length}`);

                        // UUIDs would only be found if the row has been inserted locally, otherwise IDs should match remote.
                        for (let i = 0; i < rs.rows.length ; i++) {
                            let key = rs.rows.item(i).key;
                            let uuid = rs.rows.item(i).value;
                            let st = structure.find(s => ctx.makeHashMapKey(tableName, s.getValue('id').getData()) === key);

                            if (st) {
                                st.setValue('id', uuid);
                            } else {
                                throw `UUID for key: ${key} was not found while queueing offline transaction for ${SqlLiteDb.op.DELETE} action`
                            }
                        }
                        ctx.prepareOfflineTransaction(tx, structure, action, null);
                    },
                    function(tx, error) {
                        console.log(error);
                    }
                );
                break;
            default:
                var tableName = DatabaseManager.extractTableName(structure);
                var id = structure.getValue('id').data;
                var hashMapStmt = `SELECT value FROM ${SqlLiteDb.HASH_TABLE} WHERE key = ? AND (user = ? OR user IS NULL) AND (domain = ? OR domain IS NULL)`;
                var hashMapKey = this.makeHashMapKey(tableName, id);
                var hashMapParams = [hashMapKey, ConfigManager.user, ConfigManager.domain];
                tx.executeSql(hashMapStmt, hashMapParams,
                    function(tx, result) {
                        // UUID would only be found if the row has been inserted locally, otherwise IDs should match remote.
                        if (result.rows.length > 0) {
                            var uuid = result.rows.item(0).value;
                            structure.setValue('id', uuid);
                        }
                        ctx.prepareOfflineTransaction(tx, structure, action, null);
                    },
                    function(tx, error) {
                        console.log(error);
                    }
                );
        }
    },
    prepareOfflineTransaction: function(tx, structure, action, uuid){
        let fkMap = {};
        let fkArr = [];

        if ($.isArray(structure)) {
            for (let i = 0; i < structure.length; i++) {
                let retObj = this.setForeignKeys(structure[i]);
                Object.assign(fkMap, retObj.fkMap);
                fkArr = fkArr.concat(retObj.fkArr);
            }
        } else {
            let retObj = this.setForeignKeys(structure);
            fkMap = retObj.fkMap;
            fkArr = retObj.fkArr;
        }

        if (fkArr.length !== 0) {
            this.resolveFKsUUIDs(tx, structure, action, uuid, fkMap, fkArr);
        } else {
            this.storeOfflineTransaction(tx, structure, action, uuid);
        }
    },
    setForeignKeys: function(structure) {
        const fkMap = {};
        const fkArr = [];

        structure.eachField(function (fieldName, field) {
            if (fieldName === 'id') {
                return;
            } else if (field.getType() === DataVariant.FK) {
                const compFk = field.getValueRef().getData();

                if (compFk) {
                    // Array to support same key in multiple structure fields.
                    if (!(compFk in fkMap)) {
                        fkMap[compFk] = [];
                    }

                    fkMap[compFk].push(fieldName);
                    fkArr.push(compFk);
                }
            }
        });

        return {
            fkMap: fkMap,
            fkArr: fkArr
        }
    },
    storeOfflineTransaction: function(tx, structure, action, uuid) {
        console.log(`SqlLiteDb #storeOfflineTransaction: action: ${action}`, structure);

        const tableName = DatabaseManager.extractTableName(structure);
        const stmt = 'INSERT OR ROLLBACK INTO ' + SqlLiteDb.TRANS_TABLE
            + ' (data, action, uuid, user, domain) VALUES (?, ?, ?, ?, ?)';
        const sqlData = DatabaseManager.getSqlData(structure, action !== SqlLiteDb.op.DELETE);
        const requestData = DatabaseManager.buildRequestData(tableName, sqlData, true);
        const params = [$.toJSON(requestData), action, uuid === null ? "NULL" : uuid, ConfigManager.user,
            ConfigManager.domain];

        tx.executeSql(stmt, params,
            function (tx, result) {
                console.log(`sqLiteDb: offline TX stored OK.`, result);
            },
            function (tx, error) {
                console.error(`sqLiteDb: offline TX storing FAILED`, error);
                rLog.log({
                    sqlError: error.message,
                    action: action,
                    tableName: tableName
                }, "Failed to store offline tx", rLog.level.ERROR, [rLog.tag.TX]);
            }
        );
    },
    resolveFKsUUIDs: function(tx, structure, action, uuid, fkMap, fkArr) {
        console.log(`SqlLiteDb #resolveFKsUUIDs ${uuid}, fmMap: `, fkMap );
        const ctx = this;

        if (fkArr.length === 0) {
            this.storeOfflineTransaction(tx, structure, action, uuid);
        } else {
            const hashMapStmt = 'SELECT value FROM ' + SqlLiteDb.HASH_TABLE
                + ' WHERE key = ? AND (user = ? OR user IS NULL) AND (domain = ? OR domain IS NULL)';
            const hashMapKey = fkArr.pop();
            const hashMapParams = [hashMapKey, ConfigManager.user, ConfigManager.domain];
            tx.executeSql(hashMapStmt, hashMapParams,
                function (tx, result) {
                    if (result.rows.length > 0) {
                        const iud = result.rows.item(0).value;
                        ctx.setFkUuid(structure, fkMap[hashMapKey], iud);
                    }
                    ctx.resolveFKsUUIDs(tx, structure, action, uuid, fkMap, fkArr);
                },
                function (tx, error) {
                    console.error(error);
                    rLog.log({
                        sqlError: error.message,
                        action: action,
                        hashMapKey: hashMapKey,
                        uuid: uuid
                    }, "Failed to resolve UUID", rLog.level.ERROR, [rLog.tag.TX]);
                }
            );
        }
    },
    /**
     * Replaces values of foreign key fields with their corresponding UUIDs.
     * @param structures
     * @param fieldNames
     * @param uuid
     */
    setFkUuid: function (structures, fieldNames, uuid) {

        if (!$.isArray(structures)) {
            structures = [structures];
        }

        structures.forEach(s => {

           fieldNames.forEach(name => {
                const field = s.getField(name);

                if(field) {
                    field.setValue(uuid);
                }
            })
        });
    },
    buildResponse: function (structure, errMsg) {
        return {
            'id': structure.insertId,
            'succeeded': !errMsg,
            'error': errMsg
        };
    },
    queueServiceRequest: function(callback, context, requestType, requestData) {
        var callbackFn = function(success) {
            if (context === undefined)
                callback(success);
            else
                callback.call(context, success);
        };

        if (this.db)
        {
            this.db.transaction(
                function(tx) {
                    const stmt = `INSERT INTO ${SqlLiteDb.REQUEST_TABLE} (type, data, user, domain) VALUES (?, ?, ?, ?)`;
                    const params =  [requestType, requestData, ConfigManager.user, ConfigManager.domain];
                    tx.executeSql(stmt, params,
                        function(tx, rs) {
                            callbackFn(true);
                        },
                        function(tx) {
                            console.error(`SqlLiteDb #queueServiceRequest`, tx);
                            rLog.log({
                                sqlError: tx.message,
                                requestType: requestType,
                                requestData: requestData,
                            }, "Failed to insert into request_queue", rLog.level.ERROR, [rLog.tag.TX]);
                            callbackFn(false);
                        }
                    );
                },
                function(tx) {
                    console.error(`SqlLiteDb TX error #queueServiceRequest`, tx);
                },
                function() {
                }
            );
        }
        else {
            callbackFn(false);
        }
    },
    save: function(structure, callback, context) {
        var callbackFn = function(success) {
            if (context === undefined)
                callback(success);
            else
                callback.call(context, success);
        };

        if (this.db)
        {
            var _this = this;
            this.db.transaction(
                function(tx) {
                    _this.saveOrUpdate(tx, structure);
                    console.log(structure)
                },
                function(tx) {
                    console.log(tx.message);
                    var response = _this.buildResponse(($.isArray(structure) ? structure[0] : structure),
                        tx.message);
                    callbackFn(response);
                },
                function() {
                    var response = _this.buildResponse($.isArray(structure) ? structure[0] : structure);
                    callbackFn(response);
                }
            );
        }
        else
            callbackFn(false);
    },
    saveOrUpdate: function(tx, structureArr) {

        if (!$.isArray(structureArr)) {
            structureArr = [structureArr];
        }

        for (let i = 0; i < structureArr.length; i++) {
            const structure = structureArr[i];

            const id = structure.getValue('id').getData();
            const create = (id === null) || (id <= 0);

            const params = [];

            let stmt = null;

            if (create) {
                stmt = 'INSERT INTO ' + structure.getTableName() + ' (parent_id';

                params.push(null); // TODO: parent ID if set

                structure.eachField(function (name, field) {
                    if (name !== 'id') {
                        stmt += ', ' + field.getDbFieldName();

                        const value = field.getValue();
                        if (!(value instanceof DataVariant))
                            params.push(null);
                        else
                            params.push(field.getValue().getSQLValue());
                    }
                });

                stmt += ') VALUES (';

                for (let j = 0, e = params.length; j < e; ++j) {
                    stmt += (j === 0) ? '?' : ', ?';
                }

                stmt += ')';
            }
            else {
                stmt = 'UPDATE ' + structure.getTableName() + ' SET ';

                let first = true;

                structure.eachField(function (name, field) {
                    if (name !== 'id') {

                        if (first) {
                            first = false;
                        } else {
                            stmt += ', ';
                        }

                        stmt += field.getDbFieldName() + ' = ?';

                        const value = field.getValue();

                        if (!(value instanceof DataVariant)) {
                            params.push(null);
                        } else {
                            params.push(field.getValue().getSQLValue());
                        }
                    }
                });

                stmt += ' WHERE id = ?';

                params.push(id);
            }

            const ctx = this;

            tx.executeSql(stmt, params,
                function (tx, result) {

                    if (create) {
                        structure.setValue('id', result.insertId);
                        structure.insertId = result.insertId;
                    }

                    ctx.queueOfflineTransaction(tx, structure, create ? "insert" : "update");
                }
            );
        }
    },
    select: function(structure, ruleset, offset, limit, callback, context, onLoad, optionalClause) {
        var results = null;

        var callbackFn = function() {
            if (context === undefined)
                callback(results);
            else
                callback.call(context, results);
        };

        if (this.db)
        {
            var _this = this;
            this.db.transaction(
                function(tx) {
                    results = _this.selectStructure(tx, structure, null, ruleset, offset, limit, optionalClause);
                },
                function(tx, error) {
                    console.log(error);

                    results = null;
                    callbackFn();
                },
                function() {
                    callbackFn();
                }
            );
        }
        else
            callbackFn();
    },
    selectStructure: function(tx, structure, parent, ruleset, offset, limit, optionalClause) {
        const ctx = this;

        var results = [];
        var stmt = "SELECT * FROM " + structure.getTableName();
        var params = [];

        if (ruleset && ruleset.conditions.length > 0) {
            stmt += " WHERE " + ruleset.buildSQLClause(params);
        }

        if (parent === null) {

            if (optionalClause) {
                const orderBy = optionalClause.getOrderBy();
                stmt += " ORDER BY " + orderBy.getField() + " " + orderBy.getDirection();
            }

            if (limit !== null) {
                stmt += " LIMIT " + limit;
            }

            if (offset !== null && offset > 0) {
                stmt += " OFFSET " + offset;
            }
        }

        tx.executeSql(stmt, params,
            function(tx, resultSet) {
                if (resultSet !== null && resultSet.rows !== null)
                {
                    var fieldMap = {};
                    structure.eachField(function(name, field) {
                        fieldMap[name] = field.getDbFieldName();
                    });

                    for (var i = 0, e = resultSet.rows.length; i < e; ++i)
                    {
                        var row = resultSet.rows.item(i);

                        var _structure = DataStructure.Create(structure.getId());

                        _structure.setValue("id", row['id']);

                        var idField = _structure.getField('id');
                        var compositeId = ctx.makeHashMapKey(structure.getTableName(), idField.getValue().getData());
                        ctx.setUuidRef(tx, compositeId, idField);

                        for (var field in fieldMap)
                        {
                            if (row[fieldMap[field]] !== undefined) {
                                _structure.setValue(field, row[fieldMap[field]]);

                                var f = _structure.getField(field);

                                if (f.getType() === DataStructureField.FK) {
                                    compositeId = ctx.makeHashMapKey(structure.getTableName(), f.getValue().getData());
                                    ctx.setUuidRef(tx, compositeId, f);
                                }
                            }
                        }

                        for (var field in fieldMap)
                        {
                            if (row[fieldMap[field]] !== undefined) {
                                const fieldType = structure.fields[field].type;
                                let fieldValue = row[fieldMap[field]];

                                if (fieldType !== DataVariant.STRING && fieldType !== DataVariant.TEXT) {
                                    try {
                                        fieldValue = JSON.parse(fieldValue);
                                    } catch (e) {
                                        // console.log(fieldValue + ', failed to parse as an object.');
                                    }
                                }

                                _structure.setValue(field, fieldValue);
                            }
                        }

                        results.push(_structure);
                    }
                }

            },
            function(tx, error) {
                console.log(error);
                results = null;
            }
        );

        return results;
    },
    remove: function(structure, callback, context) {

        var callbackFn = function(success) {
            var result = {succeeded: success};
            if (context === undefined) {
                callback(result);
            } else {
                callback.call(context, result);
            }
        };

        if (this.db)
        {
            var _this = this;
            this.db.transaction(
                function(tx) {
                    _this.removeStructure(tx, structure, callbackFn);
                },
                function(tx, error) {
                    console.log(error);

                    callbackFn(false);
                },
                function() {
                    callbackFn(true);
                }
            );
        }
        else
            callbackFn(false);
    },
    removeStructure: function(tx, structuresArr) {

        const ctx = this;

        if (structuresArr.length > 0) {

            const tableName = structuresArr[0].getTableName();
            const ids = structuresArr.map(s => s.getValue('id').getData());
            const placeholders = structuresArr.map(() => '?').join(',');

            const stmt = `DELETE FROM ${tableName} WHERE id IN (${placeholders})`;

            tx.executeSql(stmt, ids,
                function (tx, result) {
                    ctx.queueOfflineTransaction(tx, structuresArr, SqlLiteDb.op.DELETE);
                },
                function (tx, error) {
                    console.log(error);
                }
            );
        }
    },
    uuidIsh: function() {
        return 'xxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function() {
            const r = Math.random() * 16 | 0;
            return r.toString(16);
        });
    },
    makeHashMapKey: function(tableName, id) {
        if (tableName.substr(0, 4) !== 'tbl_') {
            tableName = 'tbl_' + tableName;
        }

        return tableName + ':' + id;
    },
    processTransactions: function(callback) {
        console.log('SqlLiteDb: #processTransactions');

        const ctx = this;
        const data = {};

       /* const structures = [];

        try {
            DataStructure.Prototypes.forEach(id => {
                structures.push(DataStructure.Create(id));
            });
        } catch (e) {
            callback(false);
            return;
        }*/

        const processTxCallback = function(key, value) {
            data[key] = value;

            if (data[SqlLiteDb.HASH_TABLE] !== undefined && data[SqlLiteDb.TRANS_TABLE] !== undefined
                && data[SqlLiteDb.REQUEST_TABLE] !== undefined) {

                // Pop transactions if we have them otherwise proceed to pull data.
                if (data[SqlLiteDb.TRANS_TABLE] || data[SqlLiteDb.REQUEST_TABLE]) {

                    ctx.sendQueuedTransactions(data)
                        .then(function() {
                            console.log('SqlLiteDb:Queued transactions sent.');
                            return ctx.clearSyncTables();
                        })/*.then(function () {
                            console.log('SqlLiteDb: Sync tables cleared.');
                            return ClientTableSyncManager.sync(structures);
                        })*/.then(function () {
                            console.log('SqlLiteDb: Database Synced.');
                            callback(true);
                        }).catch(function (reason) {
                            console.error(reason);
                            rLog.log({
                                reason: reason,
                            }, "SqlLiteDb: TX sync FAILED", rLog.level.ERROR, [rLog.tag.SYNC]);
                            callback(false);
                        });
                } else {
                    callback(true);

                    /*ClientTableSyncManager.sync(structures)
                        .then(function () {
                            console.log('SqlLiteDb: Database Synced.');
                            callback(true);
                        }).catch(function (reason) {
                            console.error('SqlLiteDb: Database sync FAILED.', reason);
                            rLog.log({
                                reason: reason,
                            }, "SqlLiteDb: Database sync FAILED", rLog.level.ERROR, [rLog.tag.SYNC]);
                            callback(false);
                        });*/
                }
            }
        };

        this.selectAllFromTable(processTxCallback, SqlLiteDb.TRANS_TABLE);
        this.getHashMap(processTxCallback);
        this.selectAllFromTable(processTxCallback, SqlLiteDb.REQUEST_TABLE);
    },
    selectAllFromTable: function(callback, table) {
        console.log(`SqlLiteDb #selectAllFromTable: table: ${table}`);
        const ctx = this;

        if (!ctx.db) {
            return;
        }

        ctx.db.transaction(
            function(tx) {
                const stmt = `SELECT * FROM ${table} WHERE (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
                const params = [ConfigManager.domain, ConfigManager.user];
                tx.executeSql(stmt, params,
                    function(tx, resultSet) {
                        let results = null;
                        if (resultSet.rows.length > 0) {
                            results = [];
                            for (let i = 0; i < resultSet.rows.length; i++) {
                                const row = resultSet.rows.item(i);
                                results.push(row);
                            }
                        }

                        callback(table, results);
                    },
                    function(tx) {
                        console.log(tx.message);
                    }
                );
            }
        )
    },
    getHashMap: function(callback) {
        const ctx = this;

        if (!ctx.db) {
            return;
        }

        ctx.db.transaction(
            function(tx) {
                const stmt = `SELECT * FROM ${SqlLiteDb.HASH_TABLE} WHERE (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
                const params =
                tx.executeSql(stmt, [ConfigManager.domain, ConfigManager.user],
                    function(tx, resultSet) {
                        let hashMap = null;
                        if (resultSet.rows.length > 0) {
                            hashMap = {};
                            for (let i = 0; i < resultSet.rows.length; i++) {
                                const row = resultSet.rows.item(i);
                                hashMap[row.value] = row.key;
                            }
                        }

                        callback(SqlLiteDb.HASH_TABLE, hashMap);
                    },
                    function(tx) {
                        console.log(tx.message);
                    }
                );
            }
        )
    },
    getUuid: function(compositeId) {
        if (!this.db) {
            return;
        }

        const res = $.Deferred();
        this.db.transaction(
            function(tx) {
                const stmt = `SELECT * FROM ${SqlLiteDb.HASH_TABLE} WHERE key = ? AND (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
                const params = [compositeId, ConfigManager.domain, ConfigManager.user];
                tx.executeSql(stmt, params,
                    function(tx, rs) {
                        let uuid = new DataVariant(null, DataVariant.NULL);
                        if (rs.rows.length > 0) {
                            uuid = new DataVariant(rs.rows.item(0).value, DataVariant.FK);
                        }

                        res.resolve(uuid);
                    },
                    function(tx) {
                        console.error(`SqlLiteDb: #getUuid failed to resolve a composite key (${compositeId})to uuid`,
                            tx);
                        res.resolve(null);
                    }
                );
            }
        );

        return res.promise();

    },
    setUuidRef: function(tx, compositeId, field) {
        // console.log(`SqlLiteDb #setUuidRef: compositeId: ${compositeId}`, field);

        const stmt = `SELECT * FROM ${SqlLiteDb.HASH_TABLE} WHERE key = ? AND (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
        const params = [compositeId, ConfigManager.domain, ConfigManager.user];
        tx.executeSql(stmt, params,
            function(tx, resultSet) {
                let uuid = new DataVariant(null, DataVariant.NULL);
                if (resultSet.rows.length > 0) {
                    uuid = new DataVariant(resultSet.rows.item(0).value, DataVariant.FK);
                    field.setValueRef(uuid);
                }
            }
        );
    },
    sendQueuedTransactions: function(data) {
        console.log(`SqlLiteDb #sendQueuedTransactions data:`, data);

        return new Promise((resolve, reject) => {

            data.domain    = ConfigManager.domain;
            data.sessionId = ConfigManager.sessionId;

            const url = ConfigManager.assetMngUrl;
            const startTime = new Date();

            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "json",
                timeout: 3 * 60 * 1000
            }).done( data => {
                const endTime = new Date();
                const duration = endTime - startTime;
                console.log(`*** Transactions popped in: ${duration / 1000} seconds ***`);

                if(!data.succeeded) {
                    rLog.log(data, 'Failed to dequeue transactions', rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.TX_DEQ]);
                } else {
                    rLog.log(data, `Transactions popped OK: duration ${duration / 1000}`, rLog.level.INFO, [rLog.tag.SYNC, rLog.tag.TX_DEQ]);
                }

                data.succeeded ? resolve(data) : reject('Failed to dequeue transactions');
            }).fail( (xhr, status, err) => {
                console.error(`Failed to send transactions to: ${url}!`, xhr);
                console.error(err);

                rLog.log({
                    textStatus: status,
                    errorThrown: err,
                    code: xhr.status,
                    url: url
                }, 'Transaction dequeue error', rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.TX_DEQ]);
                reject();
            });
        });
    },
    clearSyncTables: function() {
        console.log(`SqlLiteDb: #clearSyncTables`);
        const ctx = this;

        return new Promise((resolve, reject) => {
            const user   = ConfigManager.user;
            const domain = ConfigManager.domain;
            ctx.db.transaction(
                (tx) => {
                    ctx.clearSyncTable(tx, SqlLiteDb.TRANS_TABLE,   user, domain);
                    ctx.clearSyncTable(tx, SqlLiteDb.HASH_TABLE,    user, domain);
                    ctx.clearSyncTable(tx, SqlLiteDb.REQUEST_TABLE, user, domain);
                }, err => {
                    const msg = `SqlLiteDb: #clearSyncTables TX failed ${err.message}`;
                    console.error(msg, err);
                    rLog.log({
                        sqlError: err.message,
                        errorCode: err.code,
                    }, msg, rLog.level.ERROR, [rLog.tag.DB]);
                    reject('Could not clear sync tables');
                }, () => {
                    resolve();
                }
            );
        });
    },
    clearSyncTable: function(tx, table, user, domain) {
        console.log(`SqlLiteDb: #clearSyncTable table: ${table}, user: ${user}, domain: ${domain}`);
        const stmt = `DELETE FROM ${table} WHERE (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
        const params = [domain, user];
        tx.executeSql(stmt, params,
            function(tx, rs) {
                console.log('SqlLiteDb: #clearSyncTable: table cleared: ' + table);
            },
            function(tx, error) {
                console.error(`Failed delete sync table: ${table}`, tx);
                rLog.log({
                    sqlError: error.message,
                    tableName: table
                }, `Failed delete sync table: ${table}`, rLog.level.ERROR, [rLog.tag.TX, rLog.tag.SYNC]);
                return true;
            }
        );
    }
});

SqlLiteDb.isSupported = function() {
    return (window.openDatabase !== undefined || window.sqlitePlugin !== undefined);
};

SqlLiteDb.TRANS_TABLE = 'transaction_queue';
SqlLiteDb.HASH_TABLE = 'hash_map';
SqlLiteDb.REQUEST_TABLE = 'request_queue';
SqlLiteDb.op = {
    INSERT: 'insert',
    UPDATE: 'update',
    DELETE: 'delete'
};
