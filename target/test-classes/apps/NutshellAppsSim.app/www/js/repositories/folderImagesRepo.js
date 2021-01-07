const FolderImagesRepo = (function() {

    let _db = null;

    const init = function(db) {
        console.log('FolderImagesRepo: #init');

        if (db) {
            _db = db;
            return Promise.resolve()
        } else {
            return Promise.reject('Database could not be found');
        }

    };

    const getAll = function(userName, domain) {
        console.log('FolderImagesRepo: reading folder images for user: ' + userName + ', domain: ' + domain);

        return new Promise((resolve, reject) => {
            // Returns empty if not found in db.
            const result = [];

            _db.transaction(
                function (tx) {
                    const params = [userName, domain];
                    tx.executeSql('SELECT * FROM foldersImages WHERE username = ? AND domain = ?', params,
                        function (tx, resultSet) {
                            console.log('FolderImagesRepo: folder images read: ' + resultSet.rows.length);

                            for (let i = 0; i < resultSet.rows.length; i++) {
                                const row = resultSet.rows.item(i);
                                const folderImg = row2img(row);
                                result.push(folderImg);
                            }
                        },
                        function (tx, error) {
                            console.error('FolderImagesRepo: get SELECT SLQ error.');
                            console.error(error);
                        });
                },
                function (error) {
                    const errMsg = 'FolderImagesRepo: get TX error.';
                    console.error(errMsg);
                    console.error(error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('FolderImagesRepo: get TX success.');
                    resolve(result);
                });
        });

    };

    const saveAll = function(userName, domain, folderImages) {
        console.log('FolderImagesRepo: saving folderImages for user: ' + userName + ', domain: ' + domain + ', apps: ');
        console.log(folderImages);

        return new Promise((resolve, reject) => {

            _db.transaction(
                function (tx) {

                    deleteAll(tx, userName, domain, function() {
                        for (let i = 0; i < folderImages.length; i++) {
                            const image = folderImages[i];
                            saveOne(tx, image, userName, domain);
                        }
                    });

                },
                function (error) {
                    const errMsg = 'FolderImagesRepo: saveAll TX error.';
                    console.error(errMsg);
                    console.error(error);
                    rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR, [rLog.tag.EXPLORER, rLog.tag.REPO]);
                    reject();
                },
                function () {
                    console.log('FolderImagesRepo: saveAll TX success.');
                    resolve();
                });
        });
    };

    const saveOne = function(tx, folderImg, userName, domain) {
        console.log(`FolderImagesRepo: saving folderImg: ${folderImg['id']}`);

        var selectStmt = 'SELECT * FROM foldersImages WHERE username = ? AND domain = ? AND imgId = ?';
        var selectParams = [userName, domain, folderImg['id']];

        tx.executeSql(selectStmt, selectParams,
            function (tx, result) {
                if (result.rows.length > 0) {
                    var updateStmt = 'UPDATE foldersImages SET src = ? WHERE username = ? AND domain = ? AND imgId = ?';

                    var updateParams = [folderImg['src'], userName, domain, folderImg['id']];

                    tx.executeSql(updateStmt, updateParams,
                        function (tx, result) {
                            console.log('FolderImagesRepo: folderImg UPDATE success. id: ' + folderImg['id']);
                        },
                        function (transaction, error) {
                            const errMsg = 'Explorer: microApps UPDATE FAIL.';
                            console.error(errMsg);
                            rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR,
                                [rLog.tag.EXPLORER, rLog.tag.REPO]);
                            console.error(error);
                        }
                    );
                } else {
                    var insertStmt = 'INSERT INTO foldersImages (username, domain, imgId, src) VALUES (?, ?, ?, ?)';
                    var insertParams = [userName, domain, folderImg['id'], folderImg['src']];

                    tx.executeSql(insertStmt, insertParams,
                        function (tx, result) {
                            console.log('FolderImagesRepo: folderImg INSERT success. id: ' + folderImg['id']);
                        },
                        function (transaction, error) {
                            const errMsg = 'FolderImagesRepo: microApps INSERT FAIL.';
                            console.error(errMsg);
                            console.error(error);
                            rLog.log({sqlError: error.message}, errMsg, rLog.level.ERROR,
                                [rLog.tag.EXPLORER, rLog.tag.REPO]);
                        }
                    );
                }
            });
    };

    const deleteAll = function(tx, userName, domain, callback) {
        console.log('FolderImagesRepo: deleting folder images for userName: ' + userName + ', domain: ' + domain);

        const params = [userName, domain];

        tx.executeSql('DELETE FROM foldersImages WHERE username = ? AND domain = ?', params,
            function (tx, resultSet) {
                console.log('FolderImagesRepo: images deleted: ' + resultSet.rows.length);
                callback(true)
            },
            function (transaction, error) {
                rLog.log({sqlError: error.message}, 'FolderImagesRepo: images delete failed', rLog.level.ERROR,
                    [rLog.tag.EXPLORER, rLog.tag.REPO]);
                callback(false)
            }
        );
    };

    const row2img = function(row) {
        return {
            id: row['imgId'],
            src: row['src']
        };
    };

    const _isInit = function () {
        console.log(`MicroAppsRepo: #isInit`);
        return _db !== null
    };

    return {
        init: init,
        getAll: getAll,
        saveAll: saveAll,
        isInitialised: _isInit,
    };
})();
