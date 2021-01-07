const AppSettingsHelper = (function() {

    const _isCompatible = function(osType, deviceType) {
        switch (osType) {
            case Utils.consts.osTypes.DESKTOP:
                return deviceType === consts.deviceType.DESKTOP;
            case Utils.consts.osTypes.MOBILE:
                return deviceType === consts.deviceType.PHONE || deviceType === consts.deviceType.TABLET;
            default:
                throw new Error('OS type unknown' + osType);
        }
    }

    const consts = {
        deviceType: {
            PHONE: 'setting_phone',
            TABLET: 'setting_tablet',
            DESKTOP: 'setting_desktop',
        }
    }


    return {
        consts: consts,
        isCompatible: _isCompatible
    }

})();
