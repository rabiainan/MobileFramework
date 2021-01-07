const DatabaseManager = {
    openedDatabases: {},

    remoteDb: new RemoteDb(),
    localDb: null,

    queueDb: null,
    queuedIds: [],
    queueCurrent: 0,

    dbName: "nutshell_db",

    dbSize: 1 * 1024 * 1024,
    dbVersion: 1,

    dbPrefix: '',

    getDatabase: function (database) {
        if (database === undefined || database === null)
            database = this.dbName;

        if (DatabaseManager.openedDatabases[database] !== undefined)
            return DatabaseManager.openedDatabases[database];

        return null;
    },

    initDatabase: function (database, callback, context) {

        if (database === undefined || database === null)
            database = DatabaseManager.dbName;

        // Is already opened?
        if (DatabaseManager.openedDatabases[database] !== undefined) {
            if (context === undefined) {
                callback(DatabaseManager.openedDatabases[database]);
            } else {
                callback.call(context, DatabaseManager.openedDatabases[database]);
            }

        } else if (SqlLiteDb.isSupported()) {
            const db = new SqlLiteDb(database, DatabaseManager.dbVersion, DatabaseManager.dbSize);

            if (db) {
                db.init(success  => {

                    if (success) {
                        DatabaseManager.openedDatabases[database] = db;
                        DatabaseManager.localDb = db;
                    }

                    if (context === undefined) {
                        callback(success ? db : null);
                    } else {
                        callback.call(context, success ? db : null);
                    }

                });
            } else {
                callback(null);
            }

        } else if (IndexedDb.isSupported()) {
            var db = new IndexedDb(database, DatabaseManager.dbVersion, DatabaseManager.dbSize);
            if (db) {
                db.init(function (success) {
                    if (success) {
                        DatabaseManager.openedDatabases[database] = db;
                        this.localDb = db;
                    }

                    if (context === undefined)
                        callback(success ? db : null);
                    else
                        callback.call(context, success ? db : null);
                });
            } else {
                callback(null);
            }
        } else {
            console.error(`DatabaseManager#initDatabase: No supported databases found to be initialised.`);
            callback(null);
        }
    },

    dropDatabase: function (database, callback, context) {
        if (database === undefined || database === null)
            database = this.getDatabaseName();

        if (SqlLiteDb.isSupported()) {
            var db = new SqlLiteDb(database, DatabaseManager.dbVersion, DatabaseManager.dbSize, false);
            if (db) {
                db.dropDatabase(callback, context);
            } else {
                if (context === undefined)
                    callback(false);
                else
                    callback.call(context, false);
            }
        } else if (IndexedDb.isSupported())
            IndexedDb.dropDatabase(database, callback, context);
        else {
            if (context === undefined)
                callback(false);
            else
                callback.call(context, false);
        }
    },

    save: function (structure, callback, context) {
        var db = MicroAppScript.OFFLINE_MODE_ENABLED ? this.localDb : this.remoteDb;

        if (db) {
            db.save(structure, callback, context);
        } else {

            if (context === undefined)
                callback(false);
            else
                callback.call(context, false);
        }
    },

    select: function(structure, ruleset, offset, limit, callback, context, onLoad, optionalClause) {
        const db = MicroAppScript.OFFLINE_MODE_ENABLED ? this.localDb : this.remoteDb;

        if (db)
            db.select(structure, ruleset, offset, limit, callback, context, onLoad, optionalClause);
        else {
            if (context === undefined)
                callback(false);
            else
                callback.call(context, false);
        }
    },

    remove: function (structure, callback, context) {
        var db = MicroAppScript.OFFLINE_MODE_ENABLED ? this.localDb : this.remoteDb;

        if (db)
            db.remove(structure, callback, context);
        else {
            if (context === undefined)
                callback(false);
            else
                callback.call(context, false);
        }
    },

    handleQueuedTransactions: function (callback) {
        const db = DatabaseManager.getDatabase();
        if (db) {
            db.processTransactions(callback);
        } else {
            callback(false);
        }
    },

    dequeueRequest: function () {
        if (!MicroAppScript.SHUTDOWN && DatabaseManager.requestIds.length > 0) {
            var id = DatabaseManager.requestIds[0];
            DatabaseManager.requestIds.splice(0, 1);

            setTimeout(function () {
                if (!MicroAppScript.SHUTDOWN) {
                    var db = DatabaseManager.getDatabase();
                    if (db) {
                        db.getServiceRequest(function (request) {
                            if (request !== null) {
                                DatabaseManager.resendRequest(request);
                            }
                        }, null, id);
                    }
                }
            }, 10);
        }
    },

    resendRequest: function (request) {
        var service = new JsonpMultipartService();

        var data = $.parseJSON(request['data']);
        data['sessionId'] = MicroAppScript.GET_SESSION_ID();

        var url = data['url'];
        delete data['url'];

        service.setURL(url).setParams(data);

        service.invoke(DatabaseManager.removeRequest, null, request['id']);
    },

    removeRequest: function (data, requestId) {
        if (data !== null && data.succeeded) {
            var db = DatabaseManager.getDatabase();
            if (db) {
                db.deleteServiceRequest(DatabaseManager.dequeueRequest, null, requestId);
            }
        } else
            DatabaseManager.dequeueRequest();
    },

    getDatabaseName: function () {
        return 'app_' + DatabaseManager.dbPrefix + '_' + DatabaseManager.dbPrefix + '_' +
            parseInt(MicroAppScript.instance.getId());
    },

    extractTableName: function (structure) {
        return $.isArray(structure) ? structure[0].getTableName() : structure.getTableName();
    },

    getSqlData: function (structure, includeFields) {
        if ($.isArray(structure)) {
            const sqlData = [];

            for (let i in structure) {
                let structureData = this.extractStructureData(structure[i], includeFields);
                sqlData.push(structureData);
            }

            return sqlData;
        } else {
            return this.extractStructureData(structure, includeFields);
        }
    },

    buildRequestData: function (tableName, sqlData, offline) {
        const data = {
            'tableId': tableName,
            'data': sqlData,
            'preview': !(MicroAppScript.APP_MODE != null && MicroAppScript.APP_MODE == 9),
            'appId': MicroAppScript.instance.getMicroAppId()
        }

        if (!offline) {
            data.sessionId = MicroAppScript.GET_SESSION_ID();
        }

        return data;
    },

    extractStructureData: function (structure, includeFields) {
        const ctx = this;
        const id = structure.getValue("id").getData();
        const create = (id === null) || (id <= 0);
        const utc = moment.utc();
        const structureData = {
            'id': create ? null : id,
            'parent_id': null,
            'modified': utc.format('YYYY-MM-DD HH:mm:ss')
        };

        if (includeFields) {
            structure.eachField(function (name, field) {
                if (name !== 'id') {
                    structureData[field.getDbFieldName()] = ctx.extractFieldData(name, field);
                }
            });
        }

        return structureData;
    },

    extractFieldData: function (name, field) {
        var value;

        if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE && !field.isStructure()) {
            value = field.getValue();
            if (!(value instanceof DataVariant))
                value = null;
            else {
                if (value.type == 10 && !($.isArray(value.data))) {
                    value = (value.data === ' ') ? null : value.data;
                } else if (value.data == null)
                    value = null;
                else
                    value = value.getSQLValue();
            }
            return value;
        } else {
            if (!field.isStructure()) {
                var values = [];

                value = field.getValue();
                if (value instanceof DataVariant) {
                    if (value.getType() == DataVariant.LIST) {
                        var dataValues = value.getData();
                        for (var i in dataValues) {
                            var _value = dataValues[i];

                            if (value instanceof DataVariant)
                                values.push(_value.getSQLValue());
                        }
                    } else
                        values.push(value.getSQLValue());
                }

                return values;
            } else
                console.log('INSERT STRUCTURE MULTIPLICITY NOT YET SUPPORTED');
        }
    }
};
