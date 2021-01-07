const SyncPolManager = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

        var userName = localStorage.getItem('username');

        if (!userName) {
            console.error('SyncPolManager: could not establish username! ');
        }

        return {

            getSyncPolFilterHeader: function(table) {
                var syncPol = table.syncPolicy;

                if (!syncPol || (syncPol && syncPol.ruleSet && syncPol.ruleSet.length == 0)) {
                    return null;
                }

                for (var i = 0; i < syncPol.ruleSet.length ; i++) {
                    var rule = syncPol.ruleSet[i];
                    rule.field = rule.field.id;

                    if (rule.type === 'sys_var'){

                        switch (rule.value) {
                            case '__email__':
                                rule.value = userName;
                                break;
                            default:
                                console.error('Sync Policy: Unknown system variable: ' + rule.value);

                        }
                    }
                }

                delete syncPol.table;

                return syncPol;

            },
            shouldOmitSync: function(table) {
                var syncPol = table.syncPolicy;
                var omitSync = (syncPol && syncPol.omitSync !== undefined) ? syncPol.omitSync : false;

                return omitSync;
            }

        };

    }

    return {

        getInstance: function () {

            if ( !instance ) {
                instance = init();
            }

            return instance;
        }

    };

})();
