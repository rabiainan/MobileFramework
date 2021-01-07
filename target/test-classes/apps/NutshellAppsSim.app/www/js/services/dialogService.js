const DialogService = (function(){

    let _controller = null;

    const _init = function(controller) {
        console.log(`DialogService#init controller:`, controller);

        return new Promise((res, rej) => {
            if (controller.isInitialised()) {
                _controller = controller;
                res();
            } else {
                rej('DialogService: Dialog controller not initialised');
            }
        });
    };

    const _show = function(title, message, buttons) {
        console.log(`DialogService#show: title: ${title}, message: ${message}, buttons: `, buttons);
        return new Promise((resolve, reject) => {

            try {
                _controller.show(title, message, buttons, choice => {
                    resolve(choice);
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    const _isVisible = function() {
        console.log(`DialogService#isVisible`);
        return _controller.isOpen();
    };

    return {
        init: _init,
        show: _show,
        isVisible: _isVisible
    }

})();
