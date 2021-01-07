class DsAppModeMap {
    constructor () {
        this.appModeMap = {};
        this.microApps = null;
    }

    getAppModeMap() {
        return this.appModeMap;
    }

    getDsIds() {
        return Object.keys(this.appModeMap);
    }

    save(tblId, appId, appMode) {
        const microApp = this.microApps.find(m => m.id === appId);
        const appName = microApp.name;

        if (this.appModeMap[tblId]) {
            const tblMap = this.appModeMap[tblId];

            if (tblMap[appName]) {
                tblMap[appName].push(appMode);
            } else {
                tblMap[appName] = [appMode];
            }
        } else {
            const tblMap = {};
            tblMap[appName] = [appMode];
            this.appModeMap[tblId] = tblMap;
        }
    }
}
