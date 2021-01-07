function RemoteDb() {
    Database.call(this, 'Remote', null, null);
}

RemoteDb.prototype = Object.create(Database.prototype);
RemoteDb.prototype = jQuery.extend(RemoteDb.prototype, {
    constructor: RemoteDb,
    save: function(structure, callback, context) {

        var tableName = DatabaseManager.extractTableName(structure);
        var sqlData = DatabaseManager.getSqlData(structure, true);
        var requestData = DatabaseManager.buildRequestData(tableName, sqlData);
        var service = new JsonpMultipartService();

        service.setProgressText('Sending Data...');
        service.setURL(MicroAppScript.SERVICE_URL + '/Json/Database/save').setParams(requestData);

        service.invoke(function(data) {
            if (data.succeeded)
            {
                if (!$.isArray(structure)) {
                    if (data.id !== undefined && data.id !== null)
                        structure.setValue('id', data.id);
                }
            }
            if (context === undefined)
                callback(data);
            else
                callback.call(context, data);
        });
    },
    select: function(structure, ruleset, offset, limit, callback, context, onLoad, optionalClause) {
        var clause = null;
        var params = [];
        if (ruleset !== null)
            clause = ruleset.buildSQLClause(params, true);

        var fields = [];
        structure.eachField(function(name, field) {

            if (name !== 'id')
            {

                if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE && !field.isStructure())
                    fields.push(field.getDbFieldName());
                else if (!field.isStructure())
                    fields.push("*"+field.getDbFieldName());
                else
                    console.log('SELECT STRUCTURE MULTIPLICITY NOT YET SUPPORTED');
            }
        });

        var data = {
            'sessionId': 	MicroAppScript.GET_SESSION_ID(),
            'appId': 		MicroAppScript.instance.getMicroAppId(),
            'tableId':		structure.getTableName(),
            'data':			{
                'conditions': 	clause,
                'fields':		fields,
                'offset':		offset,
                'limit':		limit,
                'optionalClause': optionalClause
            },
            'preview':		(MicroAppScript.APP_MODE != null && MicroAppScript.APP_MODE == 9)?false:true
        };
        var service = new JsonpMultipartService();

        service.setProgressText('Retrieving Data...');
        service.setURL(MicroAppScript.SERVICE_URL + '/Json/Database/select').setParams(data);

        service.invoke(function(data) {
            var results = data;

            if (data.succeeded)
            {
                if (data.results !== undefined && data.results !== null)
                {
                    var fieldMap = {};
                    structure.eachField(function(name, field) {
                        if (name !== 'id' && field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE && !field.isStructure())
                        {
                            fieldMap[name] = field.getDbFieldName();
                        }
                    });

                    results = [];
                    for (var i in data.results)
                    {
                        var row = data.results[i];

                        var _structure = DataStructure.Create(structure.getId());

                        _structure.setValue("id", row['id']);

                        for (var field in fieldMap)
                        {
                            if (row[fieldMap[field]] !== undefined)
                                _structure.setValue(field, row[fieldMap[field]]);
                        }

                        _structure.eachField(function(name, field) {
                            if (field.getMultiplicity() != DataStructure.MULTIPLICITY_ONE)
                            {
                                if (!field.isStructure())
                                {
                                    var values = [];

                                    var listResult = row[field.getDbFieldName()];

                                    if (listResult !== undefined)
                                    {
                                        for (var j in listResult)
                                            values.push(new DataVariant(listResult[j], field.getType()));
                                    }

                                    _structure.setValue(field, new DataVariant(values, DataVariant.LIST));
                                }
                                else
                                    console.log('SELECT STRUCTURE MULTIPLICITY NOT YET SUPPORTED');
                            }
                        });

                        results.push(_structure);
                    }
                }
            }

            if (context === undefined)
                callback(results);
            else
                callback.call(context, results);
        }, undefined, undefined, onLoad);
    },
    remove: function(structuresArr, callback, context) {
        var sqlData = [];
        for (var i in structuresArr) {
            var idVal = structuresArr[i].getValue("id").getData();
            sqlData.push( {"id": idVal} );
        }

        if (sqlData.length > 0) {
            var tableName = DatabaseManager.extractTableName(structuresArr);
            var data = DatabaseManager.buildRequestData(tableName, sqlData);
            var service = new JsonpMultipartService();

            service.setProgressText('Sending Request...');
            service.setURL(MicroAppScript.SERVICE_URL + '/Json/Database/delete').setParams(data);

            service.invoke(function(data) {
                if (context === undefined)
                    callback(data);
                else
                    callback.call(context, data);
            });
        }
        else
        {
            if (context === undefined)
                callback(false);
            else
                callback.call(context, false);
        }
    }
});
