function DataStructureSyncPolicy(omitSync, ruleSet, operator) {
    this.omitSync = omitSync;
    this.ruleSet = ruleSet;
    this.operator = operator;
}

function DataStructureSyncPolRule(field, operator, value, type) {
    this.field = field;
    this.operator = operator;
    this.value = value;
    this.type = type;
}

function DataStructureField(table, id, multiplicity, type, size, size_ext, join, unique, keyField) {

    this.id				= id;
    this.table			= table;
    this.multiplicity 	= multiplicity;
    this.type			= type;
    this.size			= size;
    this.size_ext		= size_ext;
    this.value			= null;
    this.valueRef       = null;
    this.join			= join;
    this.unique			= (unique===undefined)?false:unique;
    this.keyField		= (keyField===undefined)?false:keyField;

    this.reset();
}

DataStructureField.prototype = {
    getId: function() {
        return this.id;
    },
    getTable: function() {
        return this.table;
    },
    getType: function() {
        return this.type;
    },
    getUnique: function() {
        return this.unique;
    },
    getKeyField: function() {
        return this.keyField;
    },
    reset: function() {
        if (this.multiplicity === 1) {
            this.value = this.createEmptyValue();
            this.valueRef = this.createEmptyValueRef();
        } else {
            this.value = new DataVariant(null, DataVariant.LIST);
            this.valueRef = new DataVariant(null, DataVariant.LIST);
        }
    },
    isStructure: function() {
        return isNaN(this.type);
    },
    getStructureId: function() {
        return parseInt(this.type.substr(13), 10);
    },
    createStructure: function() {
        var data = new window[this.type](this.getStructureId());
        data.setParent(this.table);

        return data;
    },
    createEmptyValue: function() {
        if (this.isStructure())
            return new DataVariant(this.createStructure(), DataVariant.OBJECT);
        else if (this.type == DataVariant.MEDIA)
            return new Media("", null);
        else
            return new DataVariant(null, this.type);
    },
    createEmptyValueRef: function() {
        if (this.isStructure())
            return new DataVariant(this.createStructure(), DataVariant.OBJECT);
        else if (this.type == DataVariant.MEDIA)
            return new Media("", null);
        else
            return new DataVariant(null, this.type);
    },
    getValue: function(ix) {
        if (this.value == null)
            this.reset();

        if (this.multiplicity == 1)
            return this.value;
        else if (this.value !== null)
        {
            if (ix===undefined||ix===null)
                return this.value;
            else
                return this.value.getAt(ix);
        }
        else
            return null;
    },
    setValue: function(value) {
        if (this.value == null)
            this.reset();

        const validity = this.validateValue(value);
        if (!validity.success) {
            return validity.error;
        }
        if (value instanceof DataStructure)
            value.setParent(this.table);

        this.value.setData(value);

        return this;
    },
    getValueRef: function(ix) {
        if (this.valueRef == null)
            this.reset();

        if (this.multiplicity === 1)
            return this.valueRef;
        else if (this.valueRef !== null)
        {
            if (ix===undefined||ix===null)
                return this.valueRef;
            else
                return this.valueRef.getAt(ix);
        }
        else
            return null;
    },
    setValueRef: function(valueRef) {
        if (this.valueRef == null) {
            this.reset();
        }

        this.valueRef.setData(valueRef);
    },
    /*
        validateValue() introduced to cater for sqlLite DB on device unable to enforce same rules as MySQL
        If there are any more rules for data type consistency they should be introduced here
     */
    validateValue: function(value) {
        let data = (value instanceof DataVariant) ? value.getData() : value;
        let valid = true;
        let error = null;

        // null would be a valid value. No need to validate.
        if (data !== null) {

            switch (this.getType()) {
                case DataVariant.STRING:
                    const dataType = typeof(data);
                    if (dataType === 'number') {
                        data = data.toString();
                    } else if (dataType === 'object') {
                        try {
                            data = JSON.stringify(data);
                        } catch (e) {
                            console.error(e);
                            valid = false;
                            error = new DataStructureFieldError(3000,
                                "JSON data for column 'field_" + this.getId() + "' at row {row} cannot be converted");
                        }
                    }

                    if (valid) {

                        valid = (data.length < 257);
                        if (!valid) {
                            error = new DataStructureFieldError(1406,
                                "Data truncation: Data too long for column 'field_" + this.getId() + "' at row {row}");
                        }
                    }
                    break;
                default:
                    valid = true;
            }
        }

        return {
            success: valid,
            error: error
        };
    },
    pushValue: function(value) {
        if (this.multiplicity != 1)
        {
            if (this.value == null)
                this.reset();

            this.value.add(new DataVariant(value, this.type));
        }
    },
    copy: function(source) {
        if (this.multiplicity == 1)
            this.copyValue(source.value, this.value);
        else if (source.value !== null && source.value.data !== null && source.value.data.length > 0)
        {
            this.value.clear();
            for (var i in source.value.data)
            {
                var value = this.copyValue(source.value.data[i], this.createEmptyValue());
                this.value.add(value);
            }
        }
    },
    copyValue: function(source, dest) {
        if (source.getType() == dest.getType())
        {
            if (dest.getType() == DataVariant.OBJECT)
            {
                if (source.getData() === null)
                {
                    this.reset();
                }
                else if (source.getData() instanceof DataStructure)
                {
                    if (dest.getData() === null || !(dest.getData() instanceof DataStructure))
                    {
                        var record = source.getData().copy();
                        record.setParent(this.table);

                        dest.setData(record);
                    }
                    else
                        dest.getData().copyFields(source.getData());
                }
                else
                {
                    console.log('DataStructure::copyValue: copy not supported for object type ' + dest.getType());
                }
            }
            else
                dest.setData(source.getData());
        }

        return dest;
    },
    getMultiplicity: function() {
        return this.multiplicity;
    },
    getMultiplicityTableName: function() {
        if (this.getMultiplicity() != DataStructure.MULTIPLICITY_ONE)
            return 'tbl_'+this.getTable().getId()+'_'+this.getId();
        else
            return null;
    },
    getDbFieldName: function() {
        var id = this.getId();
        return id === 'id' ? id : 'field_' + id;
    },
    getSqlField: function() {
        if (this.getMultiplicity() == DataStructure.MULTIPLICITY_ONE) {
            if (this.getId() == "id")
                return 'tbl_'+this.getTable().getId()+'.'+this.getId();
            else
                return 'tbl_'+this.getTable().getId()+'.field_'+this.getId();
        }
        else
            return 'tbl_'+this.getTable().getId()+'_'+this.getId()+'.field_'+this.getId();
    },
    getSqlType: function() {
        var sql = '';

        if (this.isStructure())
            sql = 'INTEGER';
        else
        {
            switch (this.type)
            {
                case DataVariant.STRING:
                {
                    if (this.size === null || this.size <= 0 || this.size > 512)
                        sql = 'VARCHAR(256)';
                    else
                        sql = 'VARCHAR('+this.size+')';

                    break;
                }

                case DataVariant.INT:
                case DataVariant.FK:
                {
                    sql = 'BIGINT(11)';

                    break;
                }

                case DataVariant.DECIMAL:
                {
                    sql = 'FLOAT';

                    break;
                }

                case DataVariant.BOOLEAN:
                {
                    sql = 'TINYINT(1)';

                    break;
                }

                case DataVariant.DATE:
                {
                    sql = 'DATE';

                    break;
                }

                case DataVariant.TIME:
                {
                    sql = 'TIME';

                    break;
                }

                case DataVariant.DATETIME:
                {
                    sql = 'DATETIME';

                    break;
                }

                case DataVariant.LATLNG:
                {
                    sql = 'VARCHAR(64)';

                    break;
                }

                case DataVariant.MEDIA:
                case DataVariant.SIGNATURE:
                case DataVariant.TEXT:
                {
                    sql = 'LONGTEXT';

                    break;
                }
            }
        }

        return sql;
    },
    getSqlValue: function(ix) {
        if (this.getValue().getData() === null)
            return null;

        return this.getValue(ix).getSQLValue();
    },
    select: function(callback, context, param, ruleset, offset, limit) {
        if (this.getTable())
            this.getTable().selectField(callback, context, param, this, ruleset, offset, limit);
        else
        {
            if (context !== undefined && context !== null)
                callback.call(context, null, param);
            else
                callback(null, param);
        }
    },
    removeCircularDependencies: function() {
        delete this.table;
        return this;
    }
};

function DataStructureFieldError(code, msg, type) {
    this.errorCode = code;
    this.msg = msg;
    this.type = type;
}

DataStructureFieldError.prototype = {
    getErrorCode: function() {
        return this.errorCode;
    },
    setErrorCode: function(code) {
        this.errorCode = code;
    },
    getMessage: function() {
        return this.msg;
    },
    setMessage: function(msg) {
        this.msg = msg;
    },
    getType: function() {
        return this.type;
    },
    setType: function(type) {
        this.type = type;
    }
}

function DataStructure(id, type) {
    this.type = (type===undefined)?DataStructure.TYPE_CLASS:type;
    this.parent = null;
    this.shared	= false;
    this.syncPolicy = null;

    this.setId(id);

    if (this.constructor.name === undefined)
        this.constructor.name = /function (.+)\(/.exec(this.constructor.toString())[1];
};

DataStructure.prototype = {
    clear: function() {
        this.fields = {};

        this.addField('id', 'id', DataStructure.MULTIPLICITY_ONE, DataVariant.INT, 16, 0);
        this.setValue('id', new DataVariant(DataStructure.NextId--, DataVariant.INT));
    },
    reset: function() {
        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (!field.isStructure())
                field.reset();
            else
                field.getValue().getData().reset();
        }
    },
    isPersistent: function() {
        var key = this.getValue('id');
        if (key !== null && key.getData() !== null && key.getData() >= 0)
            return true;

        return false;
    },
    getId: function() {
        return this.id;
    },
    setId: function(id) {
        switch (this.type)
        {
            case DataStructure.TYPE_CLASS:
                this.prototypeObject 	= null;
                this.id					= id;

                this.clear();

                break;

            case DataStructure.TYPE_SCREEN:
                this.prototypeObject	= id;
                this.id					= 'screen_'+id.getId();

                this.clear();

                break;

            case DataStructure.TYPE_JSON:
                this.clear();

                this.prototypeObject	= null;
                this.id					= 'json_'+(DataStructure.NextJsonId++);

                DataStructure.structureFromJson(this, id);

                break;
        }
    },
    getParent: function() {
        return this.parent;
    },
    setParent: function(parent) {
        this.parent = parent;
    },
    setShared: function(shared) {
        this.shared = shared;
    },
    isShared: function() {
        return this.shared;
    },
    setSyncPolicy: function(obj) {
        let omitSync = (obj.omitSync === undefined) ? false : obj.omitSync;
        let rulesArr = null;
        let ruleSetOperator = null;

        if (obj.ruleSet && obj.ruleSet.length > 0) {
            rulesArr = [];
            ruleSetOperator = obj.ruleSetOperator;

            for (var i = 0 ; i < obj.ruleSet.length ; i++) {
                var rule = obj.ruleSet[i];
                var field = this.getFieldById(rule.field);

                if (field != null) {
                    rulesArr.push(new DataStructureSyncPolRule(field, rule.operator, rule.value, rule.type))
                }
            }
        }

        this.syncPolicy = new DataStructureSyncPolicy(omitSync, rulesArr, ruleSetOperator);
    },
    addField: function(fieldId, name, multiplicity, type, size, size_ext, join, unique, keyField)
    {
        if (fieldId === null) {
            fieldId = DataStructure.NextFieldId++;
        }

        this.fields[name] = new DataStructureField(this, fieldId, multiplicity, type, (size===undefined)?null:size, (size_ext===undefined)?null:size_ext, (join===undefined)?null:join, unique, keyField);

        return this;
    },
    getValue: function(name, ix) {
        if (name instanceof DataStructureField)
        {
            for (var i in this.fields)
            {
                if (this.fields[i].getId() == name.getId())
                    return this.fields[i].getValue(ix);
            }
        }
        else
        {
            if (this.fields[name] !== undefined)
                return this.fields[name].getValue(ix);
        }

        return null;
    },
    setValue: function(name, p0, p1) {
        if (this.fields[name] !== undefined)
        {
            var value = null;

            if (p1 === undefined)
                value = this.fields[name].getValue();
            else
                value = this.fields[name].getValue(p0);

            if (value !== null)
            {
                if (p1 === undefined)
                {
                    if (value.getType() == DataVariant.LIST)
                    {
                        value.clear();

                        if (!(p0 instanceof DataVariant) && !p0.getType() != DataVariant.LIST)
                            value.add(this.fields[name].createEmptyValue().setData(p0));
                        else if (p0)
                        {
                            for (var i in p0.data)
                                value.add(this.fields[name].createEmptyValue().setData(p0.data[i]));
                        }
                    }
                    else
                        value.setData(p0);
                }
                else
                    value.setData(p1);

                return true;
            }
        }

        return false;
    },
    pushValue: function(field, value) {
        if (this.fields[name] !== undefined)
            this.fields[name].pushValue(value);
    },
    setValueByReference: function(reference, value) {
        var parts = reference.split('.');

        if (this.fields[parts[0]] !== undefined)
        {
            if (parts.length == 1)
                this.setValue(parts[0], value);
            else
            {
                var child = this.getValue(parts[0]);
                if (child.getData() instanceof DataStructure)
                    child.getData().setValueByReference(reference.substr(parts[0].length + 1), value);
            }
        }
    },
    getValueByReference: function(reference) {
        var parts = reference.split('.');

        if (this.fields[parts[0]] !== undefined)
        {
            if (parts.length == 1)
                return this.getValue(parts[0]);
            else
            {
                var child = this.getValue(parts[0]);
                if (child.getData() instanceof DataStructure)
                {
                    var result = child.getData().getValueByReference(reference.substr(parts[0].length + 1));
                    if (result !== null)
                        return result;
                }
            }
        }

        return null;
    },
    getField: function(name) {
        if (this.fields[name] !== undefined)
            return this.fields[name];

        return null;
    },
    getFieldById: function(id) {
        var field = null;

        for (var f in this.fields) {
            if (this.fields[f].id == id) {
                field = this.fields[f];
                break;
            }
        }

        return field;
    },
    getFieldValues: function(fieldList) {
        var fields = fieldList.split(/[.\[]/);

        for (var i in fields)
        {
            var field = fields[i];
            if (field == '*]')
                fields[i] = '*';
            else if (field.substr(field.length - 1) == ']')
                fields[i] = parseInt(field.substr(0, field.length - 1));
        }

        return this._getFieldValues(fields, 0);
    },
    _getFieldValues: function(fields, ix) {
        var result = null;

        if (fields.length > 0)
        {
            var fieldName = fields[ix];

            var field = this.getField(fieldName);
            if (field !== null)
            {
                if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
                {
                    if (field.getType() == DataVariant.OBJECT && ix < (fields.length - 1))
                        result = field.getValue().getData()._getFieldValues(fields, ix+1);
                    else
                        result = field.getValue();
                }
                else if (ix < (fields.length - 1))
                {
                    var listIndex = fields[++ix];

                    var fieldList = field.getValue().getData();

                    if (listIndex == '*')
                    {
                        result = new DataVariant(null, DataVariant.LIST);

                        for (var i in fieldList)
                        {
                            var fieldValue = fieldList[i];

                            if (fieldValue && fieldValue.getData() instanceof DataStructure)
                            {
                                var _value = fieldValue.getData()._getFieldValues(fields, ix+1);

                                if (_value !== null)
                                    result.add(_value);
                            }
                            else
                                result.add(value);
                        }
                    }
                    else if (listIndex < fieldList.length)
                    {
                        var fieldValue = fieldList[listIndex];

                        if (fieldValue.getType() == DataVariant.OBJECT && ix < (fields.length - 1))
                            result = fieldValue.getData()._getFieldValues(fields, ix+1);
                        else
                            result = fieldValue.getData();
                    }
                }
                else
                    result = field.getValue();
            }
        }

        return result;
    },
    setFieldValues: function(fieldList, value, options) {
        var fields = fieldList.split(/[.\[]/);

        if (options === DataStructure.OPTIONS_IGNORE_INDICES)
        {
            for (var i = fields.length - 1; i >= 0; --i)
            {
                var field = fields[i];

                if (field.substr(field.length - 1) == ']')
                    fields.splice(i, 1);
            }
        }
        else
        {
            for (var i in fields)
            {
                var field = fields[i];
                if (field == '*]')
                    fields[i] = '*';
                else if (field.substr(field.length - 1) == ']')
                    fields[i] = parseInt(field.substr(0, field.length - 1));
            }
        }

        this._setFieldValues(fields, value, 0);
    },
    _setFieldValues: function(fields, value, ix) {
        if (fields.length > 0)
        {
            var fieldName = fields[ix];

            var field = this.getField(fieldName);
            if (field !== null)
            {
                if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
                {
                    if ((field.isStructure() || (field.getValue().getData() instanceof DataStructure)) && ix < (fields.length - 1))
                        field.getValue().getData()._setFieldValues(fields, value, ix+1);
                    else
                        field.setValue(value);
                }
                else if (ix < (fields.length - 1))
                {
                    var listIndex = fields[++ix];

                    var fieldList = field.getValue().getData();

                    if (listIndex == '*')
                    {
                        result = new DataVariant(null, DataVariant.LIST);

                        for (var i in fieldList)
                        {
                            var fieldValue = fieldList[i];

                            if (fieldValue && fieldValue.getData() instanceof DataStructure)
                            {
                                var _value = fieldValue.getData()._setFieldValues(fields, value, ix+1);

                                if (_value !== null)
                                    result.add(_value);
                            }
                            else
                                result.add(value);
                        }
                    }
                    else if (listIndex < fieldList.length)
                    {
                        var fieldValue = fieldList[listIndex];

                        if (fieldValue.getType() == DataVariant.OBJECT && fieldValue.getData() instanceof DataStructure && ix < (fields.length - 1))
                            result = fieldValue.getData()._setFieldValues(fields, value, ix+1);
                        else
                            fieldValue.setData(value);
                    }
                }
                else
                    field.setValue(value);
            }
        }
    },
    create: function() {
        if (this.type == DataStructure.TYPE_CLASS)
            return new window['DataStructure'+this.getId()](this.getId());
        else if (this.type == DataStructure.TYPE_SCREEN && this.prototypeObject)
            return DataStructure.createPrototype(this.prototypeObject);
        else
            return null;

    },
    copy: function(source) {
        if (source !== undefined && source instanceof DataStructure)
        {
            this.copyFields(source);
        }
        else if (this.type == DataStructure.TYPE_CLASS)
        {
            var duplicate = this.create();

            duplicate.copyFields(this);

            return duplicate;
        }
        else
        {
            return DataStructure.createPrototype(this.getJSONObject());
        }
    },
    copyFields: function(source) {
        if (this.getId() == source.getId())
        {
            for (var field in this.fields)
            {
                this.fields[field].copy(source.fields[field]);
            }
        }
        else
        {
            for (var field in source.fields)
            {
                if (this.fields[field] !== undefined)
                    this.fields[field].copy(source.fields[field]);
            }
        }
    },
    remove: function(forRemove) {
        var removed = false;
        if (removed = this.merge(forRemove, true))
            forRemove.setParent(null);

        return removed;
    },
    merge: function(source, remove) {
        if (source instanceof DataStructure)
        {
            var sourceId = source.getValue("id");
            if (sourceId !== null && sourceId instanceof DataVariant)
            {
                sourceId = sourceId.getData();

                for (var fieldId in this.fields)
                {
                    var field = this.fields[fieldId];
                    if (field.isStructure())
                    {
                        if (field.getValue() && field.getValue().getData())
                        {
                            var structure = field.getValue().getData();

                            var fieldId = structure.getValue("id");
                            if (fieldId !== null && fieldId instanceof DataVariant)
                            {
                                fieldId = fieldId.getData();

                                if (fieldId == sourceId)
                                {
                                    if (remove===true)
                                        field.reset();
                                    else
                                        field.setValue(source);

                                    return true;
                                }
                                else
                                {
                                    if (structure.merge(source, remove))
                                        return true;
                                }
                            }
                        }
                    }
                    else if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ANY)
                    {
                        var values = field.getValue();
                        if (values.getType() == DataVariant.LIST)
                        {
                            values = values.getData();
                            for (var j in values)
                            {
                                if (values[j].getType() == DataVariant.OBJECT && values[j].getData() instanceof DataStructure)
                                {
                                    var structure = values[j];

                                    var fieldId = structure.getValue("id");
                                    if (fieldId !== null && fieldId instanceof DataVariant)
                                    {
                                        fieldId = fieldId.getData();

                                        if (fieldId == sourceId)
                                        {
                                            if (remove === true)
                                                values.splice(j, 1);
                                            else
                                                values[j] = source;

                                            return true;
                                        }
                                        else
                                        {
                                            if (structure.merge(source, remove))
                                                return true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return false;
    },
    clearIds: function() {
        this.setValue('id', new DataVariant(DataStructure.NextId--, DataVariant.INT));

        for (var fieldId in this.fields)
        {
            var field = this.fields[fieldId];
            if (field.isStructure())
            {
                if (field.getValue() && field.getValue().getData())
                {
                    var structure = field.getValue().getData();

                    structure.clearIds();
                }
            }
            else if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ANY)
            {
                var values = field.getValue();
                if (values.getType() == DataVariant.LIST)
                {
                    values = values.getData();
                    for (var j in values)
                    {
                        if (values[j].getType() == DataVariant.OBJECT && values[j].getData() instanceof DataStructure)
                            values[j].clearIds();
                    }
                }
            }
        }
    },
    hasMultiplicities: function() {
        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (field.getMultiplicity() != DataStructure.MULTIPLICITY_ONE && !field.isStructure())
                return true;
        }

        return false;
    },
    countReferences: function(childTable) {
        var defaultValue = 1;
        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (field.isStructure() && field.getStructureId() == childTable.getId())
            {
                defaultValue = 0;

                if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
                    return 1;
                else
                {
                    if (field.getValue() instanceof DataVariant && field.getValue().getType() == DataVariant.LIST)
                        return (field.getValue().getData()===null)?0:field.getValue().getData().length;
                    else
                        return 0;
                }
            }
        }

        return defaultValue;
    },
    getHierarchy: function(parent, hierarchy) {
        if (parent === undefined)
            parent = null;

        if (hierarchy === undefined)
            hierarchy = new Array();

        hierarchy.push([parent, this]);

        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (field.isStructure())
                hierarchy = field.createStructure().getHierarchy(this, hierarchy);
        }

        return hierarchy;
    },
    getTableName: function() {
        return 'tbl_' + this.getId();
    },
    eachField: function(fn) {
        for (var name in this.fields)
        {
            var r = fn(name, this.fields[name]);
            if (r !== undefined && !r)
                return;
        }
    },
    eachFieldMultiplicity: function(fn) {
        for (var name in this.fields)
        {
            var field = this.fields[name];
            if (field.getMultiplicity() != DataStructure.MULTIPLICITY_ONE)
            {
                var r = fn(name, field);
                if (r !== undefined && !r)
                    return;
            }
        }
    },
    eachStructure: function(fn) {
        for (var name in this.fields)
        {
            var field = this.fields[name];
            if (field.isStructure())
            {
                var structure = new window[field.type](field.getStructureId());
                var r = fn(structure);
                if (r !== undefined && !r)
                    return;

                structure.eachStructure(fn);
            }
        }
    },
    getTableSql: function(tx, parentTable, statements) {
        var childTablesSql = new Array();

        if (statements === undefined)
            statements = new Array();

        var sql = 'CREATE TABLE tbl_' + this.getId() + '(';

        var firstField = true;

        var childTables = new Array();
        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (field.isStructure())
                childTables.push(field.createStructure());
            else if (field.getMultiplicity() == 1)
            {
                if (firstField)
                    firstField = false;
                else
                    sql += ', ';

                if (fieldName == 'id')
                {
                    sql += 'id integer primary key autoincrement';

                    if (parentTable !== undefined)
                        sql += ', parent_id integer not null';
                }
                else
                {
                    sql += '`'+((field.getId()===null)?DataStructure.getSqlSafeName(fieldName):('field_'+field.getId()))+'` '+field.getSqlType();
                }
            }
            else if (!field.isStructure())
            {
                var sqlMultiple = 'CREATE TABLE tbl_' + this.getId() + '_' + field.getId() + ' (id integer primary key autoincrement, parent_id integer not null';

                sqlMultiple += ', `'+((field.getId()===null)?DataStructure.getSqlSafeName(fieldName):('field_'+field.getId()))+'` '+field.getSqlType();

                sqlMultiple += ', FOREIGN KEY (parent_id) REFERENCES tbl_'+this.getId()+'(id) ON DELETE CASCADE)';

                childTablesSql.push(sqlMultiple);
            }
        }

        if (parentTable !== undefined)
            sql += ', FOREIGN KEY (parent_id) REFERENCES '+parentTable+'(id) ON DELETE CASCADE';

        sql += ')';

        statements.push(sql);
        for (var i in childTablesSql)
            statements.push(childTablesSql[i]);

        for (var i in childTables)
            childTables[i].getTableSql(tx, 'tbl_' + this.getId(), statements);

        return statements;
    },
    getInsertSql: function(parentTable) {
        var sql = 'INSERT INTO tbl_' + this.getId() + '(';

        var values = new Array();

        var first = true;
        if (parentTable)
        {
            var key = parentTable.getValue('id');
            if (key !== null && key.getData() !== null && key.getData() >= 0)
            {
                sql += '`parent_id`';
                values.push(key.getData());

                first = false;
            }
        }

        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (!field.isStructure())
            {
                if (fieldName != 'id' && field.getMultiplicity() == 1)
                {
                    if (first)
                        first = false;
                    else
                        sql += ', ';

                    sql += '`'+((field.getId()===null)?DataStructure.getSqlSafeName(fieldName):('field_'+field.getId()))+'`';

                    values.push(field.getSqlValue());
                }
            }
        }

        sql += ') VALUES (';

        for (var i in values)
        {
            if (i > 0)
                sql += ',';

            sql += '?';
        }

        sql += ')';

        return [sql, values];
    },
    getUpdateSql: function() {
        var sql = 'UPDATE tbl_' + this.getId() + ' SET ';

        var values = new Array();

        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];
            if (!field.isStructure())
            {
                if (fieldName != 'id' && field.getMultiplicity() == 1)
                {
                    if (first)
                        first = false;
                    else
                        sql += ', ';

                    sql += '`'+((field.getId()===null)?DataStructure.getSqlSafeName(fieldName):('field_'+field.getId()))+'` = ?';

                    values.push(field.getSqlValue());
                }
            }
        }

        sql += ' WHERE id = ?';
        values.push(this.getValue('id').getData());

        return [sql, values];
    },
    getDeleteSql: function(parent) {
        var statements = new Array();

        var parentId = null;
        if (parent.getValue('id') !== null && parent.getValue('id').getData() !== null)
            parentId = parent.getValue('id').getData();

        if (parentId)
        {
            statements.push(
                'DELETE FROM tbl_' + this.getId() + ' WHERE parent_id = ?',
                [parentId]
            );
        }

        return statements;
    },
    getMultiplicityUpdateSql: function() {
        var statements = new Array();

        var tableId = null;
        if (this.getValue('id') !== null && this.getValue('id').getData() !== null)
            tableId = this.getValue('id').getData();

        if (tableId)
        {
            for (var fieldName in this.fields)
            {
                var field = this.fields[fieldName];
                if (!field.isStructure() && field.getMultiplicity() != DataStructure.MULTIPLICITY_ONE)
                {
                    statements.push(
                        [
                            'DELETE FROM tbl_' + this.getId() + '_' + field.getId(),
                            []
                        ]
                    );

                    if (field.getValue().getData() !== null && field.getValue().getData().length > 0)
                    {
                        for (var i = 0, e = field.getValue().getData().length; i < e; ++i)
                        {
                            var sql = 'INSERT INTO tbl_' + this.getId() + '_' + field.getId() + ' (parent_id, `'+((field.getId()===null)?DataStructure.getSqlSafeName(fieldName):('field_'+field.getId()))+'`) VALUES (?, ?)';
                            statements.push([sql, [tableId, field.getSqlValue(i)]]);
                        }
                    }
                }
            }
        }

        return statements;
    },
    buildJoinClause: function() {
        var hierarchy = this.getHierarchy();

        var joins = null;
        var fields = null;
        if (hierarchy.length > 1)
        {
            var fieldId = 0;
            fields = '';
            for (var i in hierarchy)
            {
                for (var fieldName in hierarchy[i][1].fields)
                {
                    var field = hierarchy[i][1].fields[fieldName];

                    if (!field.isStructure())
                    {
                        if (fieldName != 'id')
                            fieldName = 'field_'+field.getId();

                        var tableName = '';

                        if (field.getMultiplicity() != DataStructure.MULTIPLICITY_ONE)
                        {
                            tableName = 'tbl_'+hierarchy[i][1].getId()+'_'+field.getId();

                            if (fields != '')
                                fields += ', ';

                            fields += tableName+'.parent_id AS '+tableName+'_parent_id';
                        }
                        else
                        {
                            tableName = 'tbl_'+hierarchy[i][1].getId();

                            if (i > 0)
                            {
                                if (fields != '')
                                    fields += ', ';

                                fields += tableName+'.parent_id AS '+tableName+'_parent_id';
                            }
                        }

                        if (fields != '')
                            fields += ', ';

                        fields += tableName+'.'+fieldName+' AS '+tableName+'_'+fieldName;

                        ++fieldId;
                    }
                }
            }

            joins = '';
            for (var i in hierarchy)
            {
                if (i > 0)
                    joins += ' LEFT OUTER JOIN tbl_'+hierarchy[i][1].getId()+' ON (tbl_'+hierarchy[i][1].getId()+'.parent_id = tbl_'+hierarchy[i][0].getId()+'.id)';

                for (var fieldName in hierarchy[i][1].fields)
                {
                    var field = hierarchy[i][1].fields[fieldName];
                    if (!field.isStructure() && field.getMultiplicity() != DataStructure.MULTIPLICITY_ONE)
                        joins += ' LEFT OUTER JOIN tbl_'+hierarchy[i][1].getId()+'_'+field.getId()+' ON (tbl_'+hierarchy[i][1].getId()+'_'+field.getId()+'.parent_id = tbl_'+hierarchy[i][1].getId()+'.id)';
                }
            }
        }

        return {
            'joins': joins,
            'fields': fields
        };
    },
    select: function(callback, context, param, ruleset, offset, limit) {
        var fields = null;
        var joins = null;
        var params = new Array();

        var hierarchy = this.getHierarchy();

        ruleset = null;

        if (hierarchy.length == 1)
            fields = 'tbl_'+this.getId()+'.*';
        else
        {
            var joinData = this.buildJoinClause();
            if (joinData['joins'] !== null)
            {
                joins = joinData['joins'];
                fields = joinData['fields'];
            }
        }

        var success = false;
        if (fields !== null)
        {
            var statement = 'SELECT tbl_'+this.getId()+'.id FROM tbl_'+this.getId();
            if (joins !== null && joins != '')
                statement += ' ' + joins;

            if (ruleset)
            {
                var clause = ruleset.buildSQLClause(params);

                if (clause !== null && clause != '')
                    statement += ' WHERE ' + clause;
            }

            statement += ' GROUP BY tbl_'+this.getId()+'.id';

            if (limit !== null)
                statement += ' LIMIT '+limit;

            if (offset > 0)
                statement += ' OFFSET '+offset;

            /*var db = SqlLite.openDatabase();
            if (db)
            {
                db.select(this.onSelect, this, [callback, context, fields, joins, param, limit], statement, params);

                success = true;
            }*/
        }

        if (!success)
        {
            if (context)
                callback.call(context, null, param);
            else
                callback(null, param);
        }
    },
    selectField: function(callback, context, param, field, ruleset, offset, limit) {
        var statement = null;
        var params = new Array();

        var selectField = '';

        if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
            selectField = 'tbl_'+this.getId()+'.`field_'+field.getId()+'`';
        else
            selectField = 'tbl_'+this.getId()+'_'+this.getFieldId()+'.`field_'+field.getId()+'`';

        statement = 'SELECT '+selectField+' FROM tbl_'+this.getId();

        var joinData = this.buildJoinClause();
        if (joinData['joins'] !== null)
            statement += ' ' + joinData['joins'];

        if (ruleset)
        {
            var clause = ruleset.buildSQLClause(params);

            if (clause !== null && clause != '')
                statement += ' WHERE ' + clause;
        }

        statement += ' GROUP BY tbl_'+this.getId()+((field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)?'':('_'+this.getFieldId()))+'.id, '+selectField;

        if (limit !== null)
            statement += ' LIMIT '+limit;

        if (offset > 0)
            statement += ' OFFSET '+offset;

        var success = false;
        if (statement !== null)
        {
            /*var db = SqlLite.openDatabase();
            if (db)
            {
                db.select(this.onSelectField, this, [callback, context, param, field, limit], statement, params);

                success = true;
            }*/
        }

        if (!success)
        {
            if (context)
                callback.call(context, null, param);
            else
                callback(null, param);
        }
    },
    onSelect: function(sqlResult, params) {
        var callback 	= params[0];
        var context		= params[1];
        var fields		= params[2];
        var joins		= params[3];
        var param		= params[4];
        var limit		= params[5];

        console.log('onSelect');
        console.log(sqlResult);

        var ids = new Array();
        for (var i = 0, e = sqlResult.rows.length; i < e; ++i)
        {
            var row = sqlResult.rows.item(i);

            ids.push(row['id']);
        }

        this.onSelectTable(null, [ids, callback, context, fields, joins, param, limit, new Array()]);
    },
    onSelectTable: function(sqlResult, params) {
        var ids			= params[0];
        var callback 	= params[1];
        var context		= params[2];
        var fields		= params[3];
        var joins		= params[4];
        var param		= params[5];
        var limit		= params[6];
        var results		= params[7];

        if (sqlResult !== null)
        {
            // Create new table instance

            var hierarchy = this.getHierarchy();

            var structures = this.setTableData(hierarchy, sqlResult);
            for (var i in structures)
                results.push(structures[i]);
        }

        if (ids.length == 0)
        {
            if (limit == 1)
            {
                if (results.length > 0)
                    results = results[0];
                else
                    results = null;
            }

            if (context)
                callback.call(context, results, param);
            else
                callback(results, param);
        }
        else
        {
            var id = ids[0];
            ids.splice(0, 1);

            var statement = 'SELECT ' + fields + ' FROM tbl_'+this.getId();
            if (joins !== null && joins != '')
                statement += ' ' + joins;

            statement += ' WHERE tbl_'+this.getId()+'.id = ?';

            var _params = [id];

            if (ruleset)
            {
                var clause = ruleset.buildSQLClause(_params);

                if (clause !== null && clause != '')
                    statement += ' AND ' + clause;
            }

            var success = false;
            if (statement !== null)
            {
                /*var db = SqlLite.openDatabase();
                if (db)
                {
                    db.select(this.onSelectTable, this, params, statement, _params);

                    success = true;
                }*/
            }

            if (!success)
                this.onSelectTable(null, params);
        }
    },
    populateTableData: function(structure, rowIx, sqlResult) {
        var row = sqlResult.rows.item(rowIx);

        var id = row['tbl_'+structure.getId()+'_id'];
        if (id !== undefined)
        {
            for (var fieldName in structure.fields)
            {
                var field = structure.fields[fieldName];

                if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
                {
                    if (!field.isStructure())
                    {
                        if (fieldName != 'id')
                            fieldName = 'field_'+field.getId();

                        tableName = 'tbl_'+structure.getId();

                        var alias = tableName+'_'+fieldName;

                        if (row[alias] !== undefined)
                            field.setValue(row[alias]);
                    }
                }
                else if (!field.isStructure())
                {
                    var key = 'tbl_'+structure.getId()+'_'+field.getId()+'_parent_id';
                    var fieldKey = 'tbl_'+structure.getId()+'_'+field.getId()+'_field_'+field.getId();

                    for (var i = 0, e = sqlResult.rows.length; i < e; ++i)
                    {
                        row = sqlResult.rows.item(i);

                        if (row['tbl_'+structure.getId()+'_id'] == id)
                        {
                            if (row[key] !== undefined && row[key] == id)
                            {
                                var value = field.getValue();

                                if (value instanceof DataVariant && value.getType() == DataVariant.LIST)
                                {
                                    value.add(field.createEmptyValue().setData(row[fieldKey]));
                                }
                            }
                        }
                    }
                }
                else
                {
                    var hierarchy = field.createStructure().getHierarchy();
                    if (hierarchy.length > 0)
                    {
                        hierarchy[0][0] = structure;

                        var children = this.setTableData(hierarchy, sqlResult, 0, structure);

                        var value = field.getValue();

                        for (var i in children)
                        {
                            if (value instanceof DataVariant && value.getType() == DataVariant.LIST)
                                value.add(new DataVariant(children[i], DataVariant.OBJECT));
                        }
                    }
                }
            }
        }

        return structure;
    },
    addChildTableData: function(structure) {
        for (var fieldName in this.fields)
        {
            var field = this.fields[fieldName];

            if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
            {
                if (field.isStructure())
                {
                    if (field.getStructureId() == structure.getId())
                    {
                        field.setValue(structure);
                        break;
                    }
                }
            }
        }
    },
    setTableData: function(hierarchy, sqlResult, hierarchyIx, parentStructure) {
        var structures = new Array();
        var structureIds = new Object();

        if (hierarchyIx === undefined)
            hierarchyIx = 0;
        else if (hierarchyIx >= hierarchy.length)
            return structures;

        if (parent === undefined)
            parentStructure = null;

        if (sqlResult.rows.length > 0)
        {
            for (var i = 0, e = sqlResult.rows.length; i < e; ++i)
            {
                var row = sqlResult.rows.item(i);

                var primaryKey = 'tbl_'+hierarchy[hierarchyIx][1].getId()+'_id';

                var structureId = row[primaryKey];
                if (structureId !== undefined && structureId !== null)
                {
                    var structure = null;
                    if (hierarchyIx == 0)
                    {
                        if (structureIds[structureId] === undefined)
                        {
                            structure = hierarchy[hierarchyIx][1].create();
                            structures.push(structure);
                        }
                    }
                    else
                    {
                        var parentKey = 'tbl_'+hierarchy[hierarchyIx][0].getId()+'_id';
                        if (row[parentKey] !== undefined)
                        {
                            var key = 'tbl_'+hierarchy[hierarchyIx][1].getId()+'_parent_id';
                            if (row[key] == structureId)
                            {
                                if (structureIds[structureId] === undefined)
                                {
                                    structure = hierarchy[hierarchyIx][1].create();
                                    structures.push(structure);
                                }
                            }
                        }
                    }

                    if (structure)
                    {
                        this.populateTableData(structure, i, sqlResult);

                        var children = this.setTableData(hierarchy, sqlResult, hierarchyIx + 1, structure);

                        if (children.length > 0)
                        {
                            for (var i in children)
                                structure.addChildTableData(children[i]);
                        }
                    }
                }
            }
        }

        return structures;
    },
    onSelectField: function(sqlResult, params) {
        var callback 	= params[0];
        var context		= params[1];
        var param		= params[2];
        var field		= params[3];
        var limit		= params[4];

        var result = null;
        if (limit == 1 && field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)
        {
            result = field.createEmptyValue();

            if (sqlResult.rows.length > 0)
            {
                var row = sqlResult.rows.item(0);
                result.setData(row['field_'+field.getId()]);
            }
        }
        else
        {
            result = new DataVariant(null, DataVariant.LIST);

            var fieldName = (field.getMultiplicity() == DataStructure.MULTIPLICITY_ONE)?'field_'+field.getId():'field_'+field.getTable().getId()+'_'+field.getId();

            for (var i = 0, e = sqlResult.rows.length; i < e; ++i)
            {
                var data = field.createEmptyValue();

                var row = sqlResult.rows.item(i);
                data.setData(row[fieldName]);

                result.add(data);
            }
        }

        if (context)
            callback.call(context, result, param);
        else
            callback(result, param);
    },
    getJSONObject: function(options) {
        var jsonData = new Object();

        for (var i in this.fields)
        {
            var field = this.fields[i];

            if (i == 'id' && options === DataStructure.OPTIONS_OMIT_ID)
                continue;

            if (field.getMultiplicity() == DataStructure.MULTIPLICITY_ANY)
            {
                var list = new Array();

                var values = field.getValue();
                if (values.getType() == DataVariant.LIST)
                {
                    values = values.getData();
                    for (var j in values)
                    {
                        if (values[j].getType() == DataVariant.OBJECT && values[j].getData() instanceof DataStructure)
                            list.push(values[j].getData().getJSONObject(options));
                        else
                            list.push(values[j].getData());
                    }
                }

                jsonData[i] = list;
            }
            else if (field.getType() == DataVariant.OBJECT)
            {
                if (field.getValue() && field.getValue().getData() instanceof DataStructure)
                    jsonData[i] = field.getValue().getData().getJSONObject(options);
            }
            else
                jsonData[i] = field.getValue().getData();
        }

        return jsonData;
    },
    filter: function(filter, filterIndex) {
        if (filterIndex === undefined)
            filterIndex = 0;

        if (filterIndex < filter.length)
        {
            var _filter = filter[filterIndex++];

            var field = null;
            var index = null;
            for (_field in _filter)
            {
                field = _field;

                index = parseInt(_filter[_field]);
                if (isNaN(index))
                    index = null;
            }

            if (this.fields[field] !== undefined)
            {
                var value = this.fields[field].getValue();
                if (this.fields[field].getMultiplicity() == DataStructure.MULTIPLICITY_ANY)
                {
                    if (index !== null && value.getData().length > index)
                        value = value.getData()[index];
                }

                if (filterIndex == filter.length)
                    return value;
                else
                {
                    if (value instanceof DataVariant && value.getData() instanceof DataStructure)
                        result = value.getData().filter(filter, filterIndex);

                    if (result !== null)
                        return result;
                }
            }
        }

        return null;
    },
    removeCircularDependencies: function() {
        const ctx = this;
        Object.keys(ctx.fields).forEach(function(name) {
            ctx.fields[name].removeCircularDependencies();
        });

        return ctx;
    }
};

DataStructure.removeCircularDependencies = function (structures) {
    if (structures.forEach) {
        structures.forEach(function (s) {
            if (s instanceof DataStructure) {
                s.removeCircularDependencies();
            }
        })
    }
};

DataStructure.createPrototype = function(prototype) {
    var dataStructure = null;

    if (prototype instanceof Screen)
    {
        dataStructure = new DataStructure(prototype, DataStructure.TYPE_SCREEN);

        prototype.buildDataStructure(dataStructure);
    }
    else if (prototype !== null)
    {
        dataStructure = new DataStructure(prototype, DataStructure.TYPE_JSON);
    }

    return dataStructure;
};

DataStructure.structureFromJson = function(dataStructure, prototype) {
    for (var field in prototype)
    {
        var value = prototype[field];

        switch (typeof value)
        {
            case 'string':
                dataStructure.addField(null, field, DataStructure.MULTIPLICITY_ONE, DataVariant.STRING, null);

                dataStructure.setValue(field, value);

                break;

            case 'number':
                dataStructure.addField(null, field, DataStructure.MULTIPLICITY_ONE, DataVariant.DECIMAL, null);

                dataStructure.setValue(field, value);

                break;


            case 'boolean':
                dataStructure.addField(null, field, DataStructure.MULTIPLICITY_ONE, DataVariant.BOOLEAN);

                dataStructure.setValue(field, value);

                break;

            default:
                if (value !== null)
                {
                    if (value.length !== undefined)
                    {
                        var listType = null;
                        for (var i in value)
                        {
                            var _type = typeof value[i];

                            if (_type == 'string')
                                _type = DataVariant.STRING;
                            else if (_type == 'number')
                                _type = DataVariant.DECIMAL;
                            else if (_type == 'boolean')
                                _type = DataVariant.BOOLEAN;
                            else
                                _type = DataVariant.OBJECT;


                            if (listType === null)
                                listType = _type;
                            else if (_type !== listType)
                            {
                                listType = DataVariant.OBJECT;
                                break;
                            }
                        }

                        if (listType !== null)
                        {
                            dataStructure.addField(null, field, DataStructure.MULTIPLICITY_ANY, listType);

                            var dataFields = new DataVariant(null, DataVariant.LIST);

                            for (var i in value)
                            {
                                var data = null;
                                if (listType == DataVariant.STRING)
                                    data = new DataVariant(value[i], DataVariant.STRING);
                                else if (listType == DataVariant.DECIMAL)
                                    data = new DataVariant(value[i], DataVariant.DECIMAL);
                                else if (listType == DataVariant.BOOLEAN)
                                    data = new DataVariant(value[i], DataVariant.BOOLEAN);
                                else if (listType == DataVariant.OBJECT)
                                    data = new DataVariant(DataStructure.createPrototype(value[i]), DataVariant.OBJECT);
                                else
                                    data = new DataVariant(null, DataVariant.NULL);

                                dataFields.add(data);
                            }

                            dataStructure.setValue(field, dataFields);
                        }
                    }
                    else
                    {
                        dataStructure.addField(null, field, DataStructure.MULTIPLICITY_ONE, DataVariant.OBJECT, null);

                        var data = new DataVariant(DataStructure.createPrototype(value), DataVariant.OBJECT);

                        dataStructure.setValue(field, data);
                    }
                }

                break;
        }
    }
};

DataStructure.Create = function(id) {
    return new window['DataStructure'+id](id);
};

DataStructure.DestroyAll = function () {
    for (var i = 0; i < DataStructure.Prototypes.length; i++) {
        var ds = 'DataStructure' + DataStructure.Prototypes[i];
        delete window[ds];
    }
    DataStructure.Prototypes = [];
};

DataStructure.Prototypes = [];

DataStructure.getSqlSafeName = function(name) {
    return name.replace(/[^a-z0-9]/gi, '_');
};

DataStructure.fromJson = function(json) {
    const dsId = json.id;

    // validate json
    if (!Number.isInteger(dsId)) {
        throw 'Cannot deserialize DataStructure. (no id property)';
    }

    let ds = null;

    try {
        ds = DataStructure.Create(dsId);
    } catch(e) {
        throw 'Cannot deserialize DataStructure. (No DS with such id ' + dsId + ')';
    }

    const fieldNames = Object.keys(json.fields);

    for (let i = 0; i < fieldNames.length; i++) {
        const name  = fieldNames[i];
        const jsonField = json.fields[name];
        const dsField = ds.getField(name);

        if (dsField === null) {
            throw 'Cannot deserialize DataStructure. (DS has no field: ' + name + ')';
        }

        const value = new DataVariant(jsonField.value.data, jsonField.type, jsonField.delim, jsonField.width, jsonField.height);
        dsField.setValue(value);
    }

    return ds;
};

DataStructure.TYPE_CLASS		= 0;
DataStructure.TYPE_SCREEN		= 1;
DataStructure.TYPE_JSON			= 2;

DataStructure.MULTIPLICITY_ANY	= null;
DataStructure.MULTIPLICITY_ONE	= 1;
DataStructure.NextFieldId		= 0;
DataStructure.NextJsonId		= 0;
DataStructure.NextId			= -1;

DataStructure.OPTIONS_OMIT_ID			= 0;
DataStructure.OPTIONS_IGNORE_INDICES	= 1;
