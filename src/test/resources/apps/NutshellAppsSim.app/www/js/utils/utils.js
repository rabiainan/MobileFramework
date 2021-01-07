const Utils = (function() {

    const getCurrentOS = function() {
        if (device.platform === 'iOS') {
            return consts.os.IOS;
        } else if (device.platform === 'Android') {
            return consts.os.ANDROID;
        } else if (device.platform === 'macOS') {
            return consts.os.MACOS;
        } else if (device.platform === 'Windows') {
            return consts.os.WINDOWS;
        } else if (device.platform === 'browser') {
          return consts.os.BROWSER;
        }
    };

    const getCurrentOsType = function() {
        const os = getCurrentOS();
        if (os === consts.os.IOS || os === consts.os.ANDROID) {
            return consts.osTypes.MOBILE;
        } else if (consts.os.MACOS || os === consts.os.WINDOWS || os === consts.os.LINUX || os === consts.os.BROWSER) {
            return consts.osTypes.DESKTOP;
        } else {
            return null;
        }

    };

    const consts = {
        os: {
            IOS: 'ios',
            ANDROID: 'android',
            MACOS: 'macos',
            WINDOWS: 'windows',
            LINUX: 'linux',
            BROWSER: 'browser'
        },
        osTypes: {
            MOBILE: 'mobile',
            DESKTOP: 'desktop'
        },
        device: {
            UUID: 'deviceUuid'
        }
    }

    const uuidV4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const getDeviceUuid = function() {
        if (device.uuid) {
            return device.uuid;
        }

        let uuid = localStorage.getItem(consts.device.UUID);
        if (uuid) {
            return uuid;
        }

        uuid = uuidV4();
        localStorage.setItem(consts.device.UUID, uuid);
        return uuid;
    };

    return {
        getCurrentOS,
        getCurrentOsType,
        consts,
        uuidV4,
        getDeviceUuid
    }

})();
