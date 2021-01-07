const BrandingService = (function(fb) {

    let _domain = null;
    let _fs = null;
    let _collection = null;
    let _cachedBranding = null;
    let _unsubscribe = null;
    let _brandingChangeListeners = [];

    const _init = function(domain) {
        console.log(`BrandingService#init domain: ${domain}`);

        return new Promise((res, rej) => {
            if(typeof domain === 'undefined' || !fb) {
                rej()
            } else {
                _domain = domain;
                _fs = fb.firestore();
                _collection = _fs.collection("branding");

                _listenToBrandingChanges().then(() => res());
            }
        });
    };

    const _listenToBrandingChanges = function () {

        return Promise.resolve();
        // NOTE: To enable remote branding, delete line above and uncomment block below.
        // Also uncomment marked line in LoginScreenPresenter class applyBranding() method.
    /*
        return new Promise((resolve, reject) => {
            _unsubscribe = _collection.doc(_domain).onSnapshot(doc => {

                if(!doc.exists) {
                    _onBrandingChanged(null); // No branding exists for such domain.
                } else {
                    const data = doc.data();
                    console.log("BrandingService. New branding available:", data);
                    _onBrandingChanged(data);
                }

                resolve();
            });
        });
    */
    };

    const _attachBrandingChangeListener = function(listener) {
        console.log(`BrandingService#_attachBrandingChangeListener: listener: ${listener}`);
        listener(_cachedBranding);
        _brandingChangeListeners.push(listener);
    };

    const _onBrandingChanged = function(newBranding) {
        console.log(`BrandingService#_onBrandingChanged: newBranding:`, newBranding);

        _cachedBranding = newBranding;

        for(let i = 0; i < _brandingChangeListeners.length; i++) {
            const listener = _brandingChangeListeners[i];

            if(typeof listener === "function") {
                listener(newBranding);
            }
        }
    };

    const _getCached = function() {
        return _cachedBranding;
    };

    const _setNewDomain = function(newDomain) {
        console.log(`BrandingService#_setNewDomain: newDomain:`, newDomain);
        _domain = newDomain;

        // Unset previous listener if exists.
        if (typeof _unsubscribe === 'function') {
            _unsubscribe();
        }

        _brandingChangeListeners = [];

        return _listenToBrandingChanges();

    };


    return {
        init: _init,
        getBranding: _getCached,
        attachBrandingChangeListener: _attachBrandingChangeListener,
        setNewDomain: _setNewDomain
    }

})(firebase);
