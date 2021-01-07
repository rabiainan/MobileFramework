/**
 * This file is used for quick'n'dirty testing and/or prototyping.
 * Contents of this file should NOT be used in production environment.
 */

function fbtest() {
    // Initialize Cloud Firestore through Firebase
    var db = firebase.firestore();

    db.collection("configurations").get().then(function (qs) {
        qs.forEach(function (doc) {
            console.log('doc.id: ' + doc.id + ', doc.data():' + doc.data());
        });
    });
}

function errlogtest() {
    $.get('asdfasdfds.asdfasdf').error((jxhp, status, err) => {
        rLog.log(jxhp, 'Authentication failed', rLog.level.ERROR, [rLog.tag.AUTH], {domain: 'test', user: 'test'});

    })

}

function testsqlerr() {
    const db = ContainerDatabaseManager.getContainerDb();

    db.transaction(
        function (tx) {
            tx.executeSql('SELECT * FROM noexist WHERE username = ? AND domain = ?', [],
                (tx, resultSet) => {},
                (tx, error) => {});
        },
        function (error) {
            rLog.log({sqlError: error.message}, 'Test', rLog.level.DEV, [rLog.tag.DEV]);
        },
        function () {
            // Success
        });
}

