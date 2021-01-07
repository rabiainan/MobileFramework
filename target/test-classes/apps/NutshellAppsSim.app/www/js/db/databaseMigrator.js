const DatabaseMigrator = (function() {

    let _db = null;
    let _migrations = null;
    let _newlyCreatedTables = [];
    let _currentTables = [];
    let _currentVersion = null;

    const _updateTo = function(version, db, migrations) {
        console.log(`DatabaseMigrator: updating to version: ${version}...`);

        _resetFields();

        _db = db;
        _migrations = migrations;
        _newlyCreatedTables = [];

        return new Promise((resolve, reject) => {

            const requiredTables = Object.keys(migrations.tables).map(key => migrations.tables[key]);

            _getAllTables(_db).then(existingTables => {
                _currentTables = Array.from(existingTables);
                return _findMissingTables(existingTables, requiredTables);
            }).then(missingTables => {
                return _createTables(missingTables);
            }).then(() => {
                return _migrateObsoleteTables(version, _db);
            }).then(() => {
                return _createIndices(_db, _migrations.indices);
            }).then(() => {
                return _updateMigrationVersion(_currentVersion, version, _db);
            }).then(() => {
                console.log(`DatabaseMigrator: DONE`);
                resolve();
            }).catch(err => {
                console.error(`DatabaseMigrator: ERROR`, err);
                reject(err);
            });
        });
    };

    const _createIndices = function(db, indexMigrations) {
        console.log(`DatabaseMigrator: creating indices, indexMigrations:`, indexMigrations);
        return DatabaseMigrationsRepo.applyMigration(indexMigrations, db);
    };

    const _resetFields = function() {
        console.log(`DatabaseMigrator: resetting fields`);
        _db = null;
        _migrations = null;
        _newlyCreatedTables = null;
        _currentTables = null;
        _currentVersion = null;
    };

    const _migrateObsoleteTables = function(newVersion, db) {
        console.log(`DatabaseMigrator: migrating obsolete tables to new version: ${newVersion}`);
        return _getCurrentVersion(db).then(currentVersion => {
            _currentVersion = currentVersion;
            const reqMigrations = _migrations.getMigrationsBetween(currentVersion, newVersion);
            const promises = [];

            for (let i = currentVersion + 1; i <= newVersion; i++) {
                let migration = reqMigrations[i];

                if (migration) {
                    promises.push(_performMigration(migration, db));
                }
            }
            console.log(`DatabaseMigrator: versions to migrate: ${promises.length}`);
            return Promise.all(promises);
        })
    };

    const _performMigration = function(migration, db) {
        console.log(`DatabaseMigrator: performing migration: `, migration);
        const filteredMigrations = migration.filter(m => !_newlyCreatedTables.includes(m.tableName));
        return DatabaseMigrationsRepo.applyMigration(filteredMigrations, db);
    };

    const _updateMigrationVersion = function(oldVersion, newVersion, db) {
        console.log(`DatabaseMigrator: saving new version ${newVersion}, old version: ${oldVersion}`);
        return oldVersion === newVersion ? Promise.all([]) : DatabaseMigrationsRepo.save(newVersion, db)
    };

    const _createTables = function(tables) {
        console.log(`DatabaseMigrator: creating tables ${tables.length}...`, tables);
        const promises = [];
        tables.forEach(tbl => {
            promises.push(_createTable(tbl))
        });
        return Promise.all(promises);
    };

    const _createTable = function(tbl) {
        console.log(`DatabaseMigrator: creating table ${tbl}...`, tbl);
        return new Promise((res, rej) => {
            _db.transaction(tx => {
                const stmt = _migrations.getTableSchema(tbl);
                tx.executeSql(stmt, []);
            }, error => {
                console.error(`DatabaseMigrator: failed to create table: ${tbl}`, error);
                rej(error.message);
            }, () => {
                console.log(`DatabaseMigrator: table ${tbl} created OK`);
                _newlyCreatedTables.push(tbl);
                res();
            });
        });
    };

    const _getCurrentVersion = function(db) {
        console.log(`DatabaseMigrator: getting current db version...`);
        return  DatabaseMigrationsRepo.getCurrentVersion(db);
    };

    const _findMissingTables = function(existing, required) {
        console.log(`DatabaseMigrator: filtering required tables`);

        return new Promise((res, rej) => {
            const missingTables = required.filter(table => !existing.includes(table));
            console.log(`DatabaseMigrator: missing tables found: ${missingTables.length}`, missingTables);
            res(missingTables);
        });
    };

    const _getAllTables = function(db) {
        console.log(`DatabaseMigrator: getting current tables...`);
        return DatabaseMigrationsRepo.getCurrentTables(db);
    };

    return {
        updateTo: _updateTo
    }
})();