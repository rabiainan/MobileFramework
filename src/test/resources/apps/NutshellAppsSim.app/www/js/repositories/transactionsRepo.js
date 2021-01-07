const TransactionsRepo = (function() {

    const TX_TABLE = 'transaction_queue';
    let _db = null;

    const _init = function(db) {
        console.log(`TransactionsRepo #_init db: ${db}`);

        return new Promise((resolve, reject) => {
            if (!db) {
                const msg = 'TransactionsRepo could not be initialised';
                rLog.log({
                    db: db ? 'OK' : db,
                }, msg, rLog.level.ERROR, [rLog.tag.REPO, rLog.tag.TX]);
                reject(msg)
            } else {
                _db = db;
                resolve();
            }
        });

    };

    const _isInit = function () {
        console.log(`TransactionsRepo: #isInit`);
        return _db !== null
    };

    /**
     * Gets the total number of transactions for a gen user and domain.
     * NOTE: Also includes txs with no domain and/or username
     * @param user
     * @param domain
     * @returns {Promise<any>}
     * @private
     */
    const _getTotalCount = function(user, domain) {
        console.log(`TransactionsRepo: #_getTotalCount user: ${user}, domain: ${domain}`);

        return new Promise(function(resolve, reject) {

            let total = null;
            const stmt = `SELECT COUNT(*) AS count FROM ${TX_TABLE} WHERE (domain = ? OR domain IS NULL) AND (user = ? OR user IS NULL)`;
            const params = [domain, user];

            _db.transaction(
                function (tx) {
                    tx.executeSql(stmt, params,
                        (tx, rs) => {
                            console.log(`TransactionsRepo: txs found: ${rs.rows.item(0).count}`);
                            total = rs.rows.item(0).count;
                        },
                        (tx, err) => {
                            const msg = `TransactionsRepo: #_getTotalCount exec SQL failed ${err.message}`;
                            console.error(msg, err);
                            rLog.log({
                                sqlError: err.message,
                                errorCode: err.code
                            }, msg, rLog.level.ERROR, [rLog.tag.TX, rLog.tag.REPO]);
                            return true;
                        });
                },
                err => {
                    const msg = `TransactionsRepo: #_getTotalCount TX failed ${err.message}`;
                    console.error(msg, err);
                    rLog.log({
                        sqlError: err.message,
                        errorCode: err.code
                    }, msg, rLog.level.ERROR, [rLog.tag.SYNC, rLog.tag.REPO]);
                    reject();
                },
                () => {
                    console.log(`TransactionsRepo: #_getTotalCount TX success. Total: ${total}`);
                    resolve(total);
                });
        });
    };

    return {
        init: _init,
        isInitialised: _isInit,
        getTotalCount: _getTotalCount,
    };
})();
