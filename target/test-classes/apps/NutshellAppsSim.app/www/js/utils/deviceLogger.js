var DeviceLogger = (function() {

    var view = null;

    var init = function(v) {
        console.log('DeviceLogger.init(v) v: \\/');
        console.log(v);
        view = v;
    };

    var debug = function(type, data) {
        console.log(type);
        console.log(data);

        if (view) {
            view.append('<p class="' + type + '">' + data + '</p>');
        }
    };

    return {
        init: init,
        debug: debug
    };
})();
