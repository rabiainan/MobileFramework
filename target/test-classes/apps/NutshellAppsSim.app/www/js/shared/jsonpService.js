function JsonpService() {
	this.id			= ++JsonpService.NextId;
	this.url 		= localStorage.getItem("serviceURL");
	
	this.callbackFn	= 'callback'+('_'+this.id);
	this.params = { 'callback': '(JsonpService.Callbacks["'+this.callbackFn+'"]["callback"])' };
	
	this.context	= null;
	this.callback	= null;
	this.timeout	= null;
	this.timedOut	= false;
};

JsonpService.prototype = {
	setURL: function(url) {
		this.url = url;
		
		return this;
	},
	setParams: function(params) {
		this.params = jQuery.extend(this.params, params);
		
		return this;
	},
	invoke: function(callback, context) {	
		if (callback !== undefined)
		{
			this.callback = callback;
			
			if (context !== undefined)
				this.context = context;
		}
				
		if (!JsonpService.hasConnection())
		{
			var response = {
				'succeeded': false,
				'error': 'No internet connection.'
			};
			
			this.defaultHandler(response);
			
			return;
		}		
		
		var url = this.url;
		var params = this.buildParameters();
		if (params != '')
			url += '?' + params;
	
		$('body').append('<div id="jsonp_service_'+this.id+'"></div>');

		var div = $('#jsonp_service_'+this.id)[0];
	
		var _this = this;
		this.timeout = setTimeout(
			function() {				
				_this.onTimeout();
			}
		, 30000);
				
		JsonpService.Callbacks[this.callbackFn] = {
			'service': this,
			'callback': function(data) {//	console.log(data);									
				JsonpService.Callbacks[_this.callbackFn]['service'].defaultHandler(data);
			}			
		};
	
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		div.appendChild(script);
	},
	defaultHandler: function(data) {
		if (!this.timedOut)
		{		
			if (this.timeout)
			{
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			
			if (this.callback !== undefined && this.callback)
			{
				if (this.context !== undefined && this.context)
					this.callback.call(this.context, data);
				else
					this.callback(data);
			}
			
			if (JsonpService.Callbacks[this.callbackFn] !== undefined)
			{
				delete JsonpService.Callbacks[this.callbackFn];
				$('#jsonp_service_'+this.id).remove();
			}
		}
	},
	buildParameters: function() {
		var parameters = '';
		
		if (this.params !== null && this.params != '')
		{
			var a = new Array();
			for (var param in this.params)
				a.push(encodeURIComponent(param) + "=" + encodeURIComponent(this.params[param]));
			
			parameters = a.join("&");
		}
	
		return parameters;
	},
	onTimeout: function() {
		this.timeout = null;		
		
		this.defaultHandler(
			{
				'succeeded': false,
				'error': 'Request timed out.',
				'statusCode': 408
			}
		);
		
		this.timedOut = true;
	}
};

JsonpService.NextId = 0;
JsonpService.Callbacks = new Object();

JsonpService.hasConnection = function() {
	if (navigator !== undefined && navigator.connection !== undefined)	
		return (navigator.connection.type != 'none');	
	
	return true;
};