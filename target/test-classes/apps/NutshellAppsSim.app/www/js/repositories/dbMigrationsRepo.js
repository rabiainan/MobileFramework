const DatabaseMigrationsRepo = (function() {

    const _init = function() {
        console.log('DatabaseMigrationsRepo: initializing database migrations repo.');
        return Promise.resolve();
    };

    const _getCurrentVersion = function(db) {
        console.log('DatabaseMigrationsRepo: reading current _db version');

        return new Promise((resolve, reject) => {

            let version = 0;

            db.transaction(
                function (tx) {
                    const stmt = 'SELECT MAX(version) AS maxVersion FROM db_migrations';
                    tx.executeSql(stmt, [],
                        function (tx, resultSet) {
                            console.log(`DatabaseMigrationsRepo: resultSet.length: ${resultSet.rows.length}`);

                            const storedVer = resultSet.rows.item(0)['maxVersion'];

                            if (storedVer) {
                                version = storedVer;
                            }

                        },
                        function (tx, error) {
                            console.error('DatabaseMigrationsRepo: get _db migrations SLQ error.', error);
                            return true;
                        });
                },
                function (err) {
                    const errMsg = 'DatabaseMigrationsRepo: current _db version TX error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message}, errMsg, rLog.level.CRITICAL, [rLog.tag.REPO, rLog.tag.DB_MIG]);
                    reject();
                },
                function () {
                    console.log(`DatabaseMigrationsRepo: current db version TX success. version: ${version}`);
                    resolve(version);
                });
        });
    };

    const _save = function(version, db) {
        console.log(`DatabaseMigrationsRepo: saving new db migration with version domain: ${version}`);

        return new Promise((resolve, reject) => {
            db.transaction(
                function (tx) {
                    const stmt = 'INSERT INTO db_migrations (version, migratedAt) VALUES (?, ?)';
                    const params = [version, new Date()];

                    tx.executeSql(stmt, params,
                        function (transaction, resultSet) {
                            console.log(`DatabaseMigrationsRepo: _save execSql success. affected rows: ${resultSet.rows.length}`);
                        },
                        function (transaction, error) {
                            console.error('DatabaseMigrationsRepo: _save execSql error.', error);
                            return true;
                        }
                    );
                },
                function (err) {
                    const errMsg = 'DatabaseMigrationsRepo: _save TX error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message}, errMsg, rLog.level.CRITICAL, [rLog.tag.REPO, rLog.tag.DB_MIG]);
                    reject();
                },
                function () {
                    console.log('DatabaseMigrationsRepo: _save TX success.');
                    resolve();
                });
        });
    };

    const _getCurrentTables = function(db) {
        console.log(`DatabaseMigrationsRepo: getting current tables...`);

        return new Promise((res, rej) => {
            const tables = [];
            db.transaction(
                function (tx) {
                    const stmt = 'SELECT name FROM sqlite_master WHERE type = "table"';
                    tx.executeSql(stmt, [],
                        function (tx, rs) {
                            console.log(`DatabaseMigrationsRepo: tables in database found: ${rs.rows.length}`);

                            for (let i = 0; i < rs.rows.length; i++) {
                                tables.push(rs.rows.item(i).name)
                            }

                        },
                        function (tx, err) {
                            console.error('DatabaseMigrationsRepo: get all tables SQL error', err);
                            return true;
                        });
                },
                function (err) {
                    const errMsg = 'DatabaseMigrationsRepo: get all tables TX error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message}, errMsg, rLog.level.CRITICAL, [rLog.tag.REPO, rLog.tag.DB_MIG]);
                    rej();
                },
                function () {
                    console.log('DatabaseMigrationsRepo: get all tables TX success.');
                    res(tables);
                });
        });
    };

    const _applyMigration = function(migration, db) {
        console.log(`DatabaseMigrationsRepo: applying migration:`, migration);

        return new Promise((res, rej) => {
            db.transaction(
                function (tx) {
                    migration.forEach(mig => {
                        tx.executeSql(mig.sql, [],
                            function (tx, rs) {
                                console.log(`DatabaseMigrationsRepo: migration application result:`, rs);
                            },
                            function (tx, err) {
                                console.error('DatabaseMigrationsRepo: migration application SQL error', err);
                                return true;
                            });
                    })
                },
                function (err) {
                    const errMsg = 'DatabaseMigrationsRepo: migration application TX error';
                    console.error(errMsg, err);
                    rLog.log({sqlError: err.message}, errMsg, rLog.level.CRITICAL, [rLog.tag.REPO, rLog.tag.DB_MIG]);
                    rej();
                },
                function () {
                    console.log('DatabaseMigrationsRepo: migration application TX success.');
                    res();
                });
        });
    };

    return {
        init: _init,
        save: _save,
        getCurrentVersion: _getCurrentVersion,
        getCurrentTables: _getCurrentTables,
        applyMigration: _applyMigration
    }
})();
