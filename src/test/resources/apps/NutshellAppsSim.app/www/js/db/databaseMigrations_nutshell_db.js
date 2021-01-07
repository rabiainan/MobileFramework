const DatabaseMigrations_nutshell_db = {
    db_name: 'nutshell_db',
    tables: {
        TX_QUEUE: 'transaction_queue',
        REQ_Q: 'request_queue',
        MASH_MAP: 'hash_map',
        MIGRATIONS: 'db_migrations',
        MODIFIED: 'table_modified',
        TEST1: 'test1',
        TEST2: 'test2',
    },
    versions: {
        1: [
            {
                tableName: 'transaction_queue',
                sql: 'ALTER TABLE transaction_queue ADD "domain" TEXT'
            },
            {
                tableName: 'transaction_queue',
                sql: 'ALTER TABLE transaction_queue ADD "user" TEXT'
            },
            {
                tableName: 'request_queue',
                sql: 'ALTER TABLE request_queue ADD "domain" TEXT'
            },
            {
                tableName: 'request_queue',
                sql: 'ALTER TABLE request_queue ADD "user" TEXT'
            },
            {
                tableName: 'hash_map',
                sql: 'ALTER TABLE hash_map ADD "domain" TEXT'
            },
            {
                tableName: 'hash_map',
                sql: 'ALTER TABLE hash_map ADD "user" TEXT'
            }
        ],
        2: [],  // v1.10.0
        3: [],  // v1.11.0
        4: [],  // v1.13.0
        5: [],  // v2.0.0

    },
    currentSchema: [
        {
            name: 'transaction_queue',
            schema: 'CREATE TABLE transaction_queue (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'data BLOB NOT NULL, ' +
                'action TEXT NOT NULL, ' +
                'uuid TEXT, ' +
                'domain TEXT, ' +
                'user TEXT, ' +
                'timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'
        },
        {
            name: 'request_queue',
            schema: 'CREATE TABLE request_queue (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'type TEXT NOT NULL, ' +
                'data BLOB NOT NULL, ' +
                'domain TEXT, ' +
                'user TEXT, ' +
                'timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'
        },
        {
            name: 'hash_map',
            schema: 'CREATE TABLE hash_map (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'key TEXT NOT NULL, ' +
                'value TEXT NOT NULL, ' +
                'domain TEXT, ' +
                'user TEXT, ' +
                'timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'
        },
        {
            name: 'db_migrations',
            schema: 'CREATE TABLE db_migrations(' +
                'version INTEGER PRIMARY KEY NOT NULL, ' +
                'migratedAt DATE)'
        },
        {
            name: 'table_modified',
            schema: 'CREATE TABLE table_modified(' +
                'tableId TEXT PRIMARY KEY NOT NULL, ' +
                'timestamp DATE NOT NULL)'
        },
        {
            name: 'test1',
            schema: 'CREATE TABLE test1(' +
                'id1 INTEGER PRIMARY KEY NOT NULL, ' +
                'count1 INTEGER)'
        },
        {
            name: 'test2',
            schema: 'CREATE TABLE test2(' +
                'id2 INTEGER PRIMARY KEY NOT NULL, ' +
                'count2 INTEGER)'
        }
    ],
    indices: [

    ],
    getTableSchema: function(name) {
        return this.currentSchema.find(schema => schema.name === name).schema;
    },
    getMigrationsBetween: function(startVer, endVer) {
        const migrations = {};
        Object.keys(this.versions).forEach(migVer => {
            if (startVer < migVer && migVer <= endVer) {
                migrations[migVer] = this.versions[migVer];
            }
        });
        return migrations;
    }

};

