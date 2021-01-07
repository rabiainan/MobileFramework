function DataVariant(data, type, delim, width, height) {
    this.data	= (data !== undefined)?data:null;
    this.type	= (type === undefined || type === null)?DataVariant.NULL:type;
    this.delim	= (delim === undefined)?null:delim;
    this.width  = width || null;
    this.height = height || null;

    if (this.data instanceof DataVariant)
    {
        this.data = this.data.copyData();
        this.type = data.getType();
    }

    if (type !== undefined)
        this.setType(type);
};

DataVariant.prototype = {
    getData: function(type) {
        if (type === undefined || type == this.type)
            return this.data;
        else
        {
            var converted = new DataVariant(this, type, this.delim);

            return converted.getData();
        }
    },
    copyData: function() {
        if (this.type == DataVariant.SIGNATURE)
            return $.parseJSON($.toJSON(this.data));
        else
            return this.data;
    },
    getJSONObject: function(options) {
        var data = null;

        if (this.getType() == DataVariant.OBJECT)
        {
            if (this.getData() !== null && this.getData().getJSONObject !== undefined)
                data = this.getData().getJSONObject(options);
        }
        else if (this.getType() == DataVariant.SIGNATURE || this.getType() == DataVariant.MEDIA)
        {
            if (this.getData() !== null)
                return this.getData().toJSON();
        }
        else if (this.getType() == DataVariant.LIST)
        {
            data = new Array();

            for (var i in this.data)
            {
                var _value = this.data[i];
                data.push(_value.getJSONObject(options));
            }
        }
        else
            data = this.getData();

        return data;
    },
    setData: function(data, type) {
        if (data instanceof DataVariant)
        {
            var oldType = data.getType();
            var oldDelim = data.delim;

            this.data = data.getData();
            this.width = data.getWidth() || data.width;
            this.height = data.getHeight() || data.height;
            this.applyConversion(oldType, oldDelim);
        }
        else
            this.data = data;

        if (type !== undefined)
            this.type = type;

        return this;
    },
    getType: function() {
        return this.type;
    },
    setType: function(type) {
        if (type != this.type)
        {
            var oldType = this.type;
            var oldDelim = this.delim;

            this.type = type;

            this.applyConversion(oldType, oldDelim);
        }

        return this;
    },
    setWidth: function (width) {
        this.width = width;
    },
    getWidth: function () {
        return this.width;
    },
    setHeight: function (height) {
        this.height = height;
    },
    getHeight: function () {
        return this.height;
    },
    setDelimeter: function(delim) {
        this.delim = delim;

        return this;
    },
    applyConversion: function(oldType, oldDelim) {
        if (this.type == DataVariant.RAW || oldType == this.type)
        {
            return;
        }

        switch (this.type)
        {
            case DataVariant.NULL:
                this.setData(null);
                break;

            case DataVariant.STRING:
            {
                switch (oldType)
                {
                    case DataVariant.NULL:
                        this.data = '';
                        break;


                    case DataVariant.LIST:
                        var result = '';
                        if (oldDelim !== null)
                        {
                            if (this.data !== null && this.data.length > 0)
                            {
                                for (var i in this.data)
                                {
                                    if (i != 0)
                                        result += oldDelim;

                                    result += new DataVariant(this.data[i], DataVariant.STRING).data;
                                }
                            }

                        }
                        this.data = result;

                        break;

                    case DataVariant.OBJECT:
                    case DataVariant.INT:
                    case DataVariant.TABLE:
                    case DataVariant.DECIMAL:
                    case DataVariant.DATE:
                    case DataVariant.TIME:
                    case DataVariant.DATETIME:
                    case DataVariant.LIST_ITEM:
                        this.data = '' + this.data;
                        break;

                    case DataVariant.BOOLEAN:
                        this.data = (this.data==null)?'':((this.data == "0")?"False":"True");
                        break;

                    case DataVariant.MEDIA:
                        this.data = '';
                        break;

                    case DataVariant.LATLNG:
                        if (this.data !== null)
                            this.data = this.data[0] + ',' + this.data[1];
                        else
                            this.data = '';

                        break;

                    case DataVariant.HTTP_RESPONSE:
                        this.data = '' + this.data.errorText;
                        break;
                }

                break;
            }

            case DataVariant.INT:
            case DataVariant.TABLE:
            {
                switch (oldType)
                {
                    case DataVariant.NULL:
                    case DataVariant.MEDIA:
                    case DataVariant.LIST:
                        this.data = 0;
                        break;

                    case DataVariant.STRING:
                    case DataVariant.DATE:
                    case DataVariant.TIME:
                    case DataVariant.DATETIME:
                    {
                        var n = parseInt(this.data);
                        if (isNaN(n))
                            n = 0;

                        this.data = n;

                        break;
                    }

                    case DataVariant.DECIMAL:
                        this.data = Math.floor(this.data);
                        break;

                    case DataVariant.BOOLEAN:
                        this.data = this.data?1:0;
                        break;
                }

                break;
            }

            case DataVariant.HTTP_RESPONSE:
            {
                switch (oldType)
                {
                    case DataVariant.HTTP_INT:
                    case DataVariant.HTTP_DECIMAL:
                    {
                        var errorCode = parseInt(this.data);
                        if (isNaN(errorCode))
                            errorCode = null;

                        this.data = {'errorCode':  errorCode, 'errorText': null};
                        break;
                    }

                    case DataVariant.HTTP_RESPONSE:
                        this.data = {'errorCode': this.data.errorCode, 'errorText': this.data.errorText};
                        break;

                    default:
                        this.data = {'errorCode': null, 'errorText': null};
                        break;
                }

                break;
            }

            case DataVariant.DECIMAL:
            {
                switch (oldType)
                {
                    case DataVariant.NULL:
                    case DataVariant.MEDIA:
                    case DataVariant.LIST:
                        this.data = 0.0;
                        break;

                    case DataVariant.STRING:
                    case DataVariant.DATE:
                    case DataVariant.TIME:
                    case DataVariant.DATETIME:
                    {
                        var n = parseFloat(this.data);
                        if (isNaN(n))
                            n = 0.0;

                        this.data = n;

                        break;
                    }

                    case DataVariant.INT:
                    case DataVariant.TABLE:
                        this.data = (0.0 + this.data);
                        break;

                    case DataVariant.BOOLEAN:
                        this.data = (this.data?1.0:0.0);
                        break;

                    case DataVariant.HTTP_RESPONSE:
                        this.data = (0.0 + this.data.errorCode);
                        break;
                }

                break;
            }

            case DataVariant.BOOLEAN:
            {
                switch (oldType)
                {
                    case DataVariant.NULL:
                    case DataVariant.LIST:
                        this.data = false;
                        break;

                    case DataVariant.STRING:
                        if (this.data.toLowerCase() == 'false' || this.data == '0')
                            this.data = false;
                        else if (this.data.toLowerCase() == 'true' || this.data == '1')
                            this.data = true;
                        else
                            this.data = ($.trim(this.data) != '');

                        break;

                    case DataVariant.INT:
                    case DataVariant.TABLE:
                        this.data = (this.data != 0);
                        break;

                    case DataVariant.DECIMAL:
                        this.data = (this.data != 0.0);
                        break;

                    case DataVariant.MEDIA:
                    case DataVariant.LATLNG:
                        this.data = (this.data !== null);
                        break;

                    case DataVariant.HTTP_RESPONSE:
                        this.data = (this.data.errorCode >= 200 && this.data.errorCode < 300);
                        break;
                }

                break;
            }

            // TODO: 23/07/2018 TBC that the other MEDIA case is the correct one.
          /*  case DataVariant.MEDIA:
            {
                switch (oldType)
                {
                    case DataVariant.STRING:
                    case DataVariant.MEDIA:
                        break;

                    default:
                        this.data = null;
                        break;
                }

                break;
            }
*/
            case DataVariant.DATE:
            {
                var src = null;
                switch (oldType)
                {
                    case DataVariant.DATETIME:
                        src = this.data.substr(0, 8);
                        break;

                    case DataVariant.STRING:
                    {
                        var regex = /(\d{4})[\/-]?(\d{2})[\/-]?(\d{2})/gi;
                        if (m = regex.exec(this.data))
                            src = m[1]+m[2]+m[3];

                        break;
                    }

                    case DataVariant.INT:
                    case DataVariant.TABLE:
                    {
                        var s = ''+this.data;
                        if (s.length >= 8)
                            src = s;

                        break;
                    }
                }

                if (src === null)
                    this.data = null;
                else
                    this.data = src;

                break;
            }

            case DataVariant.TIME:
            {
                var src = null;
                switch (oldType)
                {
                    case DataVariant.DATETIME:
                        src = this.data.substr(8, 4);
                        break;
                }

                if (src === null)
                    this.data = null;
                else
                    this.data = src;

                break;
            }

            case DataVariant.DATETIME:
            {
                var src = null;

                switch (oldType)
                {
                    case DataVariant.STRING:
                    {
                        var regex1 = /(\d{4})[\/-]?(\d{2})[\/-]?(\d{2})\s*T?\s*(\d{2}):?(\d{2}):?(\d{2})/gi;
                        var regex2 = /(\d{4})[\/-]?(\d{2})[\/-]?(\d{2})\s*T?\s*(\d{2}):?(\d{2})/gi;

                        if (m = regex1.exec(this.data))	{
                            src = m[1]+m[2]+m[3]+m[4]+m[5]+m[6];
                        }
                        else if (m = regex2.exec(this.data)) {
                            src = m[1]+m[2]+m[3]+m[4]+m[5];
                        }


                        break;
                    }

                    case DataVariant.INT:
                    case DataVariant.TABLE:
                    {
                        var s = ''+this.data;
                        if (s.length >= 12)
                            src = s;

                        break;
                    }
                }

                if (src === null)
                    this.data = null;
                else
                    this.data = src;

                break;
            }

            case DataVariant.LATLNG:
            {
                switch (oldType)
                {
                    case DataVariant.LIST:
                        break;

                    case DataVariant.STRING:
                    {
                        if (this.data !== null)
                        {
                            var values = this.data.split(',');

                            if (values.length == 2)
                            {
                                lat = parseFloat(values[0]);
                                lng = parseFloat(values[1]);

                                if (!isNaN(lat) && !isNaN(lng))
                                {
                                    this.data = [lat,lng];

                                    break;
                                }
                            }
                        }
                    }

                    default:
                        this.data = null;
                        break;
                }

                break;
            }

            case DataVariant.LIST:
            {
                switch (oldType)
                {
                    case DataVariant.LIST:
                        break;

                    case DataVariant.STRING:
                    case DataVariant.INT:
                    case DataVariant.TABLE:
                    case DataVariant.HTTP_RESPONSE:
                    case DataVariant.DECIMAL:
                    case DataVariant.BOOLEAN:
                        if (this.delim !== null)
                        {
                            var oldData = this.data;

                            this.clear();

                            if (oldData !== null && oldData != '')
                            {
                                var values = oldData.split(this.delim);

                                for (var i in values)
                                    this.add(new DataVariant(values[i], oldType));
                            }

                            break;
                        }

                    default:
                        if (this.data === null)
                            this.setData(new Array());
                        else
                            this.setData([new DataVariant(this.data, oldType)]);

                        break;
                }

                break;
            }

            case DataVariant.LIST_ITEM:
            {
                switch (oldType) {
                    case DataVariant.LIST:
                        this.data = this.data[0];
                        break;
                    default:
                        this.data = String(this.data).split(this.delim)[0];
                        break;
                }

                break;
            }

            case DataVariant.MEDIA:
            {
                switch (oldType)
                {
                    case DataVariant.STRING:
                        this.setContentType(Media.TEXT).setName('untitled.txt');
                        break;

                    default:
                        this.data = null;
                        break;
                }

                break;
            }

            case DataVariant.OBJECT:
            {
                switch (oldType)
                {
                    case DataVariant.STRING:
                        //this.data = MicroAppScript.resolve(this.data);
                        this.data = "" + this.data;
                        break;

                    default:
                        break;
                }

                break;
            }
        }
    },
    isEmpty: function() {
        if (this.type == DataVariant.SIGNATURE || this.type == DataVariant.MEDIA)
            return this.data === null || this.data.length == 0;
        else if (this.type == DataVariant.HTTP_RESPONSE)
            return this.data.errorCode === null;
        else
            return this.data === null || this.data === false || this.data == '' || this.data == 0;
    },
    isQuantative: function() {
        if (this.data === null || this.data === false)
            return false;

        switch (this.type)
        {
            case DataVariant.INT:
            case DataVariant.TABLE:
            case DataVariant.HTTP_RESPONSE:
            case DataVariant.DECIMAL:
            case DataVariant.DATE:
            case DataVariant.TIME:
            case DataVariant.DATETIME:
                return true;
        }

        return false;
    },
    clear: function() {
        if (this.getType() == DataVariant.LIST)
            this.data = new Array();
        else
            this.data = null;
    },
    add: function(value) {
        if (this.getType() == DataVariant.LIST)
        {
            if (this.data === null)
                this.data = new Array();

            this.data.push(value);
        }
    },
    remove: function(value) {
        if (this.getType() == DataVariant.LIST && this.getData() !== null)
        {
            for (var i in this.data)
            {
                var match = false;
                if (this.data[i] instanceof DataVariant && value instanceof DataVariant)
                {
                    if (this.data[i].getType() == value.getType() && this.data[i].getData() == value.getData())
                        match = true;
                }
                else if (value instanceof DataVariant && value.equals(this.data[i]))
                    match = true;
                else if (this.data[i] instanceof DataVariant && this.data[i].equals(value))
                    match = true;
                else if (this.data[i] == value)
                    match = true;

                if (match)
                {
                    this.data.splice(i, 1);
                    return;
                }
            }
        }
    },
    getAt: function(ix) {
        if (this.getType() == DataVariant.LIST && this.getData() !== null)
        {
            if (this.data.length > ix)
                return this.data[ix];
        }

        return null;
    },
    contains: function(value) {
        if (this.getType() == DataVariant.LIST && this.getData() !== null)
        {
            for (var i in this.data)
            {
                if (this.data[i].getData() == value.getData())
                    return true;
            }
        }

        return false;
    },
    equals: function(value) {
        if (!(value instanceof DataVariant))
            value = new DataVariant(value, this.getType());

        return value != this.getData();
    },
    copy: function() {
        if (this.getType() !== DataVariant.LIST)
            return new DataVariant(this);
        else
        {
            var result = new DataVariant(null, DataVariant.LIST);

            for (var i in this.data)
            {
                var e = this.data[i];
                if (e instanceof DataVariant)
                    result.add(new DataVariant(e));
                else
                    result.add(e);
            }

            return result;
        }
    },
    getSQLValue: function() {
        switch (this.getType())
        {
            case DataVariant.OBJECT:
            case DataVariant.STRING:
            case DataVariant.DATA:
            case DataVariant.NULL:
            case DataVariant.FK:
            case DataVariant.TEXT:
                return this.getData();

            case DataVariant.INT:
            case DataVariant.TABLE:
                var value = parseInt(this.getData());
                return (isNaN(value))?null:value;

            case DataVariant.DECIMAL:
                return parseFloat(this.getData());

            case DataVariant.BOOLEAN:
                return this.getData()?1:0;

            case DataVariant.DATE:
            {
                const val = this.getData();
                if (val === null || val === '') {
                    return null;

                } else if (val.match(/\D/)) {
                    return val;

                } else {
                    return val.substr(0, 4)+'-'+val.substr(4, 2)+'-'+val.substr(6, 2);

                }

            }

            case DataVariant.LIST:
            case DataVariant.LIST_ITEM:
            {
                var data = this.getData();
                if (data) {
                    if (/^\d+\.\d+$/.test(data.toString()) && !isNaN(parseFloat(data)))
                        return parseFloat(this.getData());
                    else if (/^\d+$/.test(this.getData()) === false)
                        return this.getData();
                    else if (!isNaN(parseInt(this.getData())))
                        return parseInt(this.getData());
                }
                else
                    return data;
            }

            case DataVariant.TIME:
            {
                const val = this.getData();
                if (val === null || val === '') {

                    return null;
                } else if (val.match(/\D/)) {

                    return val;
                } else {
                    if (val.length < 5) {

                        return val.substr(0, 2)+':'+val.substr(2, 2)+':00';
                    }
                    else {

                        return val.substr(0, 2)+':'+val.substr(2, 2)+':'+val.substr(4, 2);
                    }

                }
            }

            case DataVariant.DATETIME:
            {
                const val = this.getData();
                if (val === null || val === '') {

                    return null;
                } else if (val.match(/\D/)) {

                    return val;
                } else {
                    if (val.length < 13) {

                        return val.substr(0, 4)+'-'+val.substr(4, 2)+'-'+val.substr(6, 2)+' '+val.substr(8, 2)+':'+val.substr(10, 2)+':00';
                    }
                    else {

                        return val.substr(0, 4)+'-'+val.substr(4, 2)+'-'+val.substr(6, 2)+' '+val.substr(8, 2)+':'+val.substr(10, 2)+':'+val.substr(12, 2);
                    }

                }

            }

            case DataVariant.LATLNG:
            {
                var latlng = this.getData();
                if ($.isArray(latlng))
                    return latlng[0]+','+latlng[1];
                else
                    return latlng;
            }

            case DataVariant.MEDIA:
            {
                /*if (this.isEmpty())
                    return '';
                else
                    return this.getBase64();*/

                return ''+this.getData();
            }

            case DataVariant.SIGNATURE:
            {
                if (typeof SignatureCaptureInput != 'undefined') {
                    return SignatureCaptureInput.getBase64(this);
                }

                else
                    return '';
            }

            case DataVariant.HTTP_RESPONSE:
                return parseInt(this.getData().errorCode);
        }
    }
};

DataVariant.NULL			= 0;
DataVariant.STRING			= 1;
DataVariant.INT				= 2;
DataVariant.DECIMAL			= 3;
DataVariant.BOOLEAN			= 4;
DataVariant.MEDIA			= 5;
DataVariant.DATE			= 6;
DataVariant.TIME			= 7;
DataVariant.DATETIME		= 8;
DataVariant.LATLNG			= 9;
DataVariant.SIGNATURE		= 10;
DataVariant.OBJECT			= 11;
DataVariant.DATA			= 12;
DataVariant.TEXT   			= 13;
DataVariant.FK   			= 14;
DataVariant.CONTACTS    	= 15;
DataVariant.CONTACT 		= 16;
DataVariant.HTTP_RESPONSE	= 500;
DataVariant.LIST			= 1000;
DataVariant.LIST_ITEM		= 1004;

DataVariant.RAW				= 1001;
DataVariant.TABLE			= 1002;
DataVariant.WEB_SERVICE		= 1003;
