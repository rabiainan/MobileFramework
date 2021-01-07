const ContainerDatabaseManager = {

    getContainerDb: function() {
        return this.getSqlDb('micro_app', '1.0', 5242880);
    },

    getNsAppDb: function() {
        return this.getSqlDb(DatabaseManager.dbName, DatabaseManager.dbVersion, DatabaseManager.dbSize);
    },

    getSqlDb: function(name, version, size) {

        if (!name || !version || !size) {
            throw 'Invalid getSqlDb() parameters! name: ' + name + ', version: ' + version +', size: ' + size;
        }

        if (device.platform === 'iOS' || device.platform === 'windows') {
            return window.sqlitePlugin.openDatabase({
                name: name + '.db',
                location: 'default',
                androidDatabaseImplementation: 2
            }, () => console.log("*** Database opened OK ***"), err => console.error(err));
        } else {
            return window.openDatabase(name, version, name, size);
        }
    }
};
