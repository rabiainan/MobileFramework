const DatabaseMigrations_micro_app = {
    db_name: 'micro_app',
    tables: {
        CONF: 'configurationV3',
        DEPLOY: 'microAppDeployment',
        FOLDER: 'foldersData',
        MICRO_APP: 'microAppData',
        FOLDER_IMG: 'foldersImages',
        STRUCT: 'data_structures',
        MIGRATIONS: 'db_migrations',
        APP_STATE: 'microAppStates',

        TEST1: 'test1',
        TEST2: 'test2',
    },
    versions: {
        1: [
            {
                tableName: 'microAppDeployment',
                sql: 'ALTER TABLE microAppDeployment ADD "created" NUMERIC'
            },
            {
                tableName: 'microAppDeployment',
                sql: 'ALTER TABLE microAppDeployment ADD "domain" TEXT'
            },
            {
                tableName: 'data_structures',
                sql: 'ALTER TABLE data_structures ADD "domain" TEXT'
            },
            {
                tableName: 'data_structures',
                sql: 'ALTER TABLE data_structures ADD "user" TEXT'
            },
            {
                tableName: 'microAppData',
                sql: 'ALTER TABLE microAppData ADD "modes" TEXT'
            },
            {
                tableName: 'test1',
                sql: 'ALTER TABLE test1 ADD "user1" TEXT'
            }
        ],
        2: [    // v1.10.0
            {
                tableName: 'configurationV3',
                sql: 'ALTER TABLE configurationV3 ADD "clientTableVersionsUrlVersions" TEXT'
            },
        ],
        3: [    // v1.11.0
            {
                tableName: 'configurationV3',
                sql: 'ALTER TABLE configurationV3 ADD "dataStructureCompileUrlVersions" TEXT'
            }
        ],
        4: [],  // v1.13.0 microAppStates table added
        5: [    // v2.0
            {
                tableName: 'microAppDeployment',
                sql: 'ALTER TABLE microAppDeployment ADD "settings" TEXT'
            },
            {
                tableName: 'microAppStates',
                sql: 'ALTER TABLE microAppStates ADD "transient" NUMERIC DEFAULT 0'
            }
        ]
    },
    currentSchema: [
        {
            name: 'configurationV3',
            schema: 'CREATE TABLE configurationV3 (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'domain TEXT NOT NULL, ' +
                'debugFlag INTEGER NOT NULL, ' +
                'pullTableDataUrlVersions TEXT NOT NULL, ' +
                'assetsManagementUrlVersions TEXT NOT NULL, ' +
                'clientTableVersionsUrlVersions TEXT NOT NULL, ' +
                'dataStructureCompileUrlVersions TEXT NOT NULL)'
        },
        {
            name: 'microAppDeployment',
            schema: 'CREATE TABLE microAppDeployment (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'username TEXT NOT NULL, ' +
                'microAppDeploymentData TEXT NOT NULL, ' +
                'appId INTEGER NOT NULL, ' +
                'appModeId INTEGER NOT NULL, ' +
                'settings TEXT, ' +
                'created NUMERIC, ' +
                'domain TEXT NOT NULL)'
        },
        {
            name: 'data_structures',
            schema: 'CREATE TABLE data_structures (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'dsId INTEGER NOT NULL, ' +
                'datastructure TEXT NOT NULL, ' +
                'timestamp TEXT NOT NULL, ' +
                'user TEXT, ' +
                'domain TEXT)'
        },
        {
            name: 'foldersData',
            schema: 'CREATE TABLE foldersData (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'username TEXT NOT NULL, ' +
                'domain TEXT NOT NULL, ' +
                'root TEXT NOT NULL)'
        },
        {
            name: 'microAppData',
            schema: 'CREATE TABLE microAppData (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'username TEXT NOT NULL, ' +
                'domain TEXT NOT NULL, ' +
                'appSettingsJSON TEXT NOT NULL, ' +
                'currentWorkflowId INTEGER NOT NULL, ' +
                'deploymentId INTEGER NOT NULL, ' +
                'description TEXT, ' +
                'folderId INTEGER NOT NULL, ' +
                'appId INTEGER NOT NULL, ' +
                'lockedApp INTEGER NOT NULL, ' +
                'microAppBuildId INTEGER NOT NULL, ' +
                'modified DATETIME, ' +
                'name TEXT NOT NULL, ' +
                'organisationId INTEGER NOT NULL, ' +
                'thumbnailId INTEGER NOT NULL, ' +
                'visible BOOLEAN NOT NULL, ' +
                'modes TEXT)'
        },
        {
            name: 'foldersImages',
            schema: 'CREATE TABLE foldersImages (' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'username TEXT NOT NULL, ' +
                'domain TEXT NOT NULL, ' +
                'imgId INTEGER NOT NULL, ' +
                'src TEXT NOT NULL)'
        },
        {
            name: 'db_migrations',
            schema: 'CREATE TABLE db_migrations(' +
                'version INTEGER PRIMARY KEY NOT NULL, ' +
                'migratedAt DATE)'
        },
        {
            name: 'microAppStates',
            schema: 'CREATE TABLE microAppStates(' +
                'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'appId INTEGER NOT NULL, ' +
                'appMode INTEGER NOT NULL, ' +
                'parentAppId INTEGER, ' +
                'username TEXT NOT NULL, ' +
                'domain TEXT NOT NULL, ' +
                'state TEXT NOT NULL, ' +
                'transient NUMERIC DEFAULT 0, ' +
                'UNIQUE(appId, appMode))'
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
        {
            tableName: 'microAppDeployment',
            sql: 'CREATE INDEX IF NOT EXISTS microAppDeployment_appId_appModeId_username_domain_idx ON microAppDeployment (appId, appModeId, username, domain)'
        }
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

