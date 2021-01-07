const testsql = (function () {

    function start() {
        const ROWS = 36000;
        const db = ContainerDatabaseManager.getContainerDb();
        let start,
            end;

        const createStmt = 'CREATE TABLE IF NOT EXISTS testsql (' +
            'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
            'domain TEXT NOT NULL, ' +
            'name INTEGER NOT NULL)';
        db.transaction(
            function (tx) {
                tx.executeSql(createStmt);
            }, function (error) {
                console.error(error);
                reject();
            }, function () {
                console.log('testsql: init() TX success.');
                db.transaction(
                    function (tx) {
                        start = new Date();
                        insert(tx, ROWS);
                    },
                    function (error) {
                        console.error('testsql: get configuration TX error.');
                        console.error(error);
                    },
                    function () {
                        end = new Date();

                        console.log('testsql: get TX success. Resolved configuration: ');
                        console.log(`*** ${ROWS} inserted in ${(end - start) / 1000} seconds.`)
                    });
            });
    }


    function insert(tx, counter) {
        tx.executeSql('INSERT INTO testsql (domain, name) VALUES (?, ?)', ['nutshell long project name', 'donkey balls'],
            function (tx, resultSet) {

                if (counter > 0) {
                    insert(tx, --counter);
                }

            },
            function (tx, error) {
                console.error('testsql: get configuration SELECT SLQ error.');
                console.error(error);
            });
    }

    return {
        start: start
    }

})();