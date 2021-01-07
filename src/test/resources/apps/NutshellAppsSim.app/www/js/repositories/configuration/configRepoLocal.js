const ConfigRepoLocal = (function() {

    const VERSION = 'V3';
    const CONFIG_TABLE = 'configuration' + VERSION;

    let _db = null;

    const _init = function() {
        console.log('ConfigRepoLocal: initializing local repo.');

        return new Promise(function(resolve, reject) {
            _db = ContainerDatabaseManager.getContainerDb();
            if (_db) {
                resolve();
            } else {
                reject("Database not found")
            }
        });

    };

    const _get = function() {
        console.log('ConfigRepoLocal: reading configuration data. ');

        return new Promise(function(resolve, reject) {

            let configuration = null;

            _db.transaction(
                function (tx) {
                    tx.executeSql('SELECT * FROM ' + CONFIG_TABLE + ' WHERE id = 1', [],
                        function (tx, resultSet) {
                            console.log(`ConfigRepoLocal: resultSet.length: ${resultSet.rows.length}`);

                            if (resultSet.rows.length > 0) {
                                const row = resultSet.rows.item(0);
                                configuration = {
                                    domain: row.domain,
                                    debugFlag: row.debugFlag,
                                    pullTableDataUrlVersions: JSON.parse(row.pullTableDataUrlVersions),
                                    assetsManagementUrlVersions: JSON.parse(row.assetsManagementUrlVersions),
                                    clientTableVersionsUrlVersions: JSON.parse(row.assetsManagementUrlVersions)
                                }
                            }

                        },
                        function (tx, err) {
                            const errMsg = 'ConfigRepoLocal: get configuration SELECT SLQ error.';
                            console.error(errMsg, err);
                            rLog.log({
                                sqlError: err.message,
                                appId: id,
                                localConfiguration: configuration}, errMsg, rLog.level.ERROR,
                                [rLog.tag.REPO, rLog.tag.CONFIG]);
                            return true;
                        });
                },
                function (error) {
                    console.error('ConfigRepoLocal: get configuration TX error.', error);
                    reject();
                },
                function () {
                    console.log('ConfigRepoLocal: get TX success. Resolved configuration:', configuration);
                    resolve(configuration);
                });
        });
    };

    const _save = function(domain, debugFlag, pullTableDataUrlVersions, assetsManagementUrlVersions, clientTableVersionsUrlVersions, dataStructureCompileUrlVersions) {
        console.log(`ConfigRepoLocal: saving configuration domain: ${domain}, debugFlag ${debugFlag}, pullTableDataUrlVersions: ${pullTableDataUrlVersions}, assetsManagementUrlVersions ${assetsManagementUrlVersions}, clientTableVersionsUrlVersions ${clientTableVersionsUrlVersions}, dataStructureCompileUrlVersions ${dataStructureCompileUrlVersions}`);

        return new Promise(function(resolve, reject) {
            _db.transaction(
                function (tx) {

                    const stmt = 'INSERT OR REPLACE INTO ' + CONFIG_TABLE +
                        ' (id, domain, debugFlag, pullTableDataUrlVersions, assetsManagementUrlVersions, clientTableVersionsUrlVersions, dataStructureCompileUrlVersions) ' +
                        'VALUES (1, ?, ?, ?, ?, ?, ?)';
                    const params = [domain, debugFlag, JSON.stringify(pullTableDataUrlVersions),
                        JSON.stringify(assetsManagementUrlVersions), JSON.stringify(clientTableVersionsUrlVersions),
                        JSON.stringify(dataStructureCompileUrlVersions)];

                    tx.executeSql(stmt, params,
                        function (transaction, resultSet) {
                            console.log(`ConfigRepoLocal: _save execSql success. affected rows: ${resultSet.rows.length}`);
                        },
                        function (transaction, error) {
                            console.error('ConfigRepoLocal: _save execSql error.', error);
                            return true;
                        }
                    );
                },
                function (error) {
                    console.error('ConfigRepoLocal: _save TX error.', error);
                    reject();
                },
                function () {
                    console.log('ConfigRepoLocal: _save TX success.');
                    resolve();
                });
        });
    };

    const _deleteAll = function() {
        console.log('ConfigRepoLocal: all configurations');

        return new Promise(function(resolve, reject) {
            _db.transaction(
                function (tx) {
                    tx.executeSql('DELETE FROM ' + CONFIG_TABLE, [],
                        function (tx, resultSet) {
                            console.log(`ConfigRepoLocal: deleted rows: ${resultSet.rows.length}`);
                        },
                        function (transaction, error) {
                            console.error('ConfigRepoLocal: _deleteAll() execSql error.', error);
                        }
                    );
                },
                function (error) {
                    console.error('ConfigRepoLocal: _deleteAll TX error.', error);
                    reject();
                },
                function () {
                    console.log('ConfigRepoLocal: _deleteAll TX success.');
                    resolve();
                });
        });

    };

    return {
        init: _init,
        get: _get,
        save: _save,
        clear: _deleteAll
    };
})();
