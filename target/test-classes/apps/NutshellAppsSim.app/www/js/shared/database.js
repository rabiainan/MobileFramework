function Database(name, version, size) {
	this.name		= name;
	this.version	= version;
	this.size		= size;
	this.db			= null;	
}

Database.prototype = {
	getDatabase: function() {
		return this.db;
	},
	getDatabaseName: function() {
		return this.name;
	},
	initDatabase: function(database, callback, context) {
		if (context === undefined)
			callback(false);
		else
			callback.call(context, false);
	},
	save: function(structure, callback, context) {
		if (context === undefined)
			callback(false);
		else
			callback.call(context, false);
	},
	queueServiceRequest: function(callback, context, requestType, requestData) {
		if (context === undefined)
			callback(false);
		else
			callback.call(context, false);
	},
	countServiceRequests: function(callback, context, type) {
		if (context === undefined)
			callback(null);
		else
			callback.call(context, null);
	},
	getServiceRequest: function(callback, context, id) {
		if (context === undefined)
			callback(null);
		else
			callback.call(context, null);
	},
	deleteServiceRequest: function(callback, context, id) {
		if (context === undefined)
			callback(false);
		else
			callback.call(context, false);
	}
};