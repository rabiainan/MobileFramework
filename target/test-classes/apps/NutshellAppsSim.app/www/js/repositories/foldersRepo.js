const FoldersRepo = (function() {

    let _db = null;

    const init = function(db) {
        console.log('FoldersRepo: #init');

        if (db) {
            _db = db;
            return Promise.resolve()
        } else {
            return Promise.reject('Database could not be found');
        }
    };

    const getRoot = function(userName, domain) {
        console.log('FoldersRepo: reading folders for user: ' + userName + ', domain: ' + domain);

        return new Promise((resolve, reject) => {

            // Returns empty if not found in db.
            let result = {'children': []};

            _db.transaction(
                function (tx) {
                    const params = [userName, domain];
                    tx.executeSql('SELECT * FROM foldersData WHERE username = ? AND domain = ?', params,
                        function (tx, resultSet) {
                            console.log('FoldersRepo: rot folder read: ' + resultSet.rows.length === 1);

                            if (resultSet.rows.length > 0) {
                                const row = resultSet.rows.item(0);
                                result = JSON.parse(row['root']);
                            } else {
                                rLog.log({}, 'No root folder found', rLog.level.WARNING,
                                    [rLog.tag.EXPLORER, rLog.tag.REPO]);
                            }
                        },
                        function (tx, error) {
                           console.error('FoldersRepo: getRoot SELECT SLQ error.');
                           console.error(error);
                        });
                },
                function (error) {
                    const errMsg = 'FoldersRepo: getRoot TX error.';
                    console.error(errMsg);
                    console.error(error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject(error.message);
                },
                function () {
                    console.log('FoldersRepo: getRoot TX success.');
                    resolve(result);
                });

        });
    };

    const _getByFolderId = function(userName, domain, folderId, callback) {
        console.log('FoldersRepo: reading microApps for folderId: ' + folderId + ' user: ' + userName
            + ', domain: ' + domain);

        return new Promise((resolve, reject) => {
            getRoot(userName, domain).then(rootFolder => {
                const folder = findFolderById(folderId, rootFolder);
                resolve(folder);
            }).catch(err => {
                reject(err);
            });
        });
    };

    const findFolderById = function(folderId, folder) {
        var result = null;

        if (!folder) {
            return null;
        }

        if (folder['id'] === folderId) {
            result = folder;
        } else {
            for (let i = 0; i < folder['children'].length; i++ ) {
                result = findFolderById(folderId, folder['children'][i]);
                if (result) {
                    break;
                }
            }
        }

        return result;
    };

    const _saveFolderStructure = function(userName, domain, rootFolder) {
        console.log('FoldersRepo: saving rootFolder for user: ' + userName + ', domain: ' + domain);
        console.log(rootFolder);

        rootFolder = JSON.stringify(rootFolder);

        return new Promise((resolve, reject) => {
            _db.transaction(
                function (tx) {

                    _deleteAll(tx, userName, domain, function() {
                        const selectStmt = 'SELECT * FROM foldersData WHERE username = ? AND domain = ?';
                        const selectParams = [userName, domain];

                        tx.executeSql(selectStmt, selectParams,
                            function (tx, result) {
                                if (result.rows.length > 0) {

                                    var updateStmt = 'UPDATE foldersData SET root = ? WHERE username = ? AND domain = ?';
                                    var updateParams = [rootFolder, userName, domain];

                                    tx.executeSql(updateStmt, updateParams,
                                        function (tx, result) {
                                            console.log('FoldersRepo: folder UPDATE success.');
                                        },
                                        function (transaction, error) {
                                            const errMsg = 'Explorer: folder UPDATE FAIL.';
                                            console.error(errMsg);
                                            console.error(error);
                                            rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR,
                                                [rLog.tag.EXPLORER, rLog.tag.REPO]);
                                        }
                                    );
                                } else {
                                    const insertStmt = 'INSERT INTO foldersData (username, domain, root) VALUES (?, ?, ?)';
                                    const insertParams = [userName, domain, rootFolder];
                                    tx.executeSql(insertStmt, insertParams,
                                        function (tx, result) {
                                            console.log('FoldersRepo: folder INSERT success.');
                                        },
                                        function (transaction, error) {
                                            const errMsg ='FoldersRepo: folder INSERT FAIL.';
                                            console.error(errMsg);
                                            console.error(error);
                                            rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR,
                                                [rLog.tag.EXPLORER, rLog.tag.REPO]);
                                        }
                                    );
                                }
                            });
                    });
                },
                function (error) {
                    const errMsg = 'FoldersRepo: saveAll TX error.';
                    console.error(errMsg);
                    console.error(error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('FoldersRepo: saveAll TX success.');
                    resolve();
                });
        });

    };

    const _deleteAll = function(tx, userName, domain, callback) {
        console.log('FoldersRepo: deleting folders for userName: ' + userName + ', domain: ' + domain);

        var params = [userName, domain];

        tx.executeSql('DELETE FROM foldersData WHERE username = ? AND domain = ?', params,
            function (tx, resultSet) {
                console.log('FoldersRepo: folder delete result: ' + resultSet.rows.length);
                callback(true)
            },
            function (transaction, error) {
                rLog.log({sqlError: error.message}, 'Delete folders failed', rLog.level.ERROR,
                    [rLog.tag.EXPLORER, rLog.tag.REPO]);
                callback(false)
            }
        );
    };

    const _isInitialised = function() {
        return _db !== null;
    }

    return {
        init: init,
        getByFolderId: _getByFolderId,
        saveFolderStructure: _saveFolderStructure,
        isInitialised: _isInitialised
    };
})();
