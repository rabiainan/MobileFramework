function JsonpMultipartService() {
	this.context		= null;
	this.callback		= null;
	this.param			= null;

	this.url			= null;
	this.data			= new Object();
	this.cursor			= 0;
	this.remaining		= 0;
	this.progressText	= null;
	this.onLoad;
};

JsonpMultipartService.prototype = {
	setURL: function(url) {
		this.url = url;

		return this;
	},
	setParams: function(params) {
		this.data = jQuery.toJSON(params);

		return this;
	},
	setProgressText: function(text) {
		this.progressText = text;

		return this;
	},
	invoke: function(callback, context, param, onLoad)
	{

		this.onLoad = onLoad;

		if (callback !== undefined)
		{
			this.callback = callback;

			if (context !== undefined)
				this.context = context;

			if (param !== undefined)
				this.param = param;
		}
		//console.log(this.data);
		this.cursor		= 0;
		this.remaining 	= this.data.length;

		if (this.progressText !== null && (typeof(MicroAppScript) !== 'undefined'))
			MicroAppScript.instance.setProgress(0, this.progressText);

		new JsonpService()
			.setURL(ConfigManager.serviceUrl + 'Json/Multipart/beginCall')
			.setParams({
				'data': $.toJSON({
					'sessionId': localStorage.getItem("session_ID")
				})
			})
			.invoke(this.onBuildRequest, this);
	},
	onBuildRequest: function(response)
	{		//console.log(response);
		if (response.succeeded)
		{
			if (this.remaining == 0)
			{
				if (this.progressText !== null && !(this.onLoad) && (typeof(MicroAppScript) !== 'undefined'))
					MicroAppScript.instance.setProgress(100, this.progressText);

				new JsonpService()
					.setURL(ConfigManager.serviceUrl + 'Json/Multipart/endCall')
					.setParams({
						'data': $.toJSON({
							'sessionId': 	localStorage.getItem("session_ID"),
							'requestId': 	response.requestId,
							'serviceCall':	this.url
						})
					})
					.invoke(this.onEndRequest, this);
			}
			else
			{
				if (this.progressText !== null && (typeof(MicroAppScript) !== 'undefined')) {
                    MicroAppScript.instance.setProgress((this.cursor / this.data.length) * 100, this.progressText);
                }

				var chunk;

				if (this.remaining > JsonpMultipartService.MAX_SIZE)
				{
					chunk = this.data.substr(this.cursor, JsonpMultipartService.MAX_SIZE);

					this.cursor += JsonpMultipartService.MAX_SIZE;
					this.remaining -= JsonpMultipartService.MAX_SIZE;
				}
				else
				{
					chunk = this.data.substr(this.cursor);

					this.cursor = this.data.length;
					this.remaining = 0;
				}


				new JsonpService()
					.setURL(ConfigManager.serviceUrl + 'Json/Multipart/appendData')
					.setParams({
						'data': $.toJSON({
							'sessionId': localStorage.getItem("session_ID"),
							'requestId': response.requestId,
							'data':		 chunk
						})
					})
					.invoke(this.onBuildRequest, this);
			}
		}
		else
		{
			this.onEndRequest(response);
		}
	},
	onEndRequest: function(response)
	{
		if (this.progressText !== null && !(this.onLoad) && (typeof(MicroAppScript) !== 'undefined'))
			MicroAppScript.instance.setProgress(null);

		if (this.callback !== undefined && this.callback)
		{
			if (this.context !== undefined && this.context)
				this.callback.call(this.context, response, this.param);
			else
				this.callback(response, this.param);
		}
	}
};

JsonpMultipartService.MAX_SIZE = 2000;