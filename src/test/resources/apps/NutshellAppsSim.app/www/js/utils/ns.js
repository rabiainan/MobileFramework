const NS = (function () {

    let _screenReady = false;   // Sets to true once screen finished creating its MVP components.
    let _screenReadyListeners = [];

    function _init() {
        console.log('NS: Initiating...');

        const promises = [
            ConfigRepo.init(),
            ConfigRepoLocal.init(),
            ConfigRepoRemote.init(),
        ];

        return Promise.all(promises);
    }

    function _attachOnScreenReadyListener(listener) {
        if (typeof listener === "function") {
            _screenReadyListeners.push(listener);
        }
    }

    function _setScreenReady(isReady) {
        _screenReady = isReady;
        if (_screenReady) {
            for (let listener of _screenReadyListeners) {
                if (typeof listener === "function") {
                    listener();
                }
            }
        }
    }

    function _removeOnScreenReadyListener(func) {
        const index = _screenReadyListeners.indexOf(func);
        if (index > -1) {
            _screenReadyListeners.splice(index, 1);
        }
    }

    function _isScreenReady() {
        return _screenReady;
    }

    return {
        init: _init,
        isScreenReady: _isScreenReady,
        setScreenReady: _setScreenReady,
        attachOnScreenReadyListener: _attachOnScreenReadyListener,
        removeOnScreenReadyListener: _removeOnScreenReadyListener
    };

})();
