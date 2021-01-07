class AppSyncWarnings {
    constructor(warnings) {
        this.affectedApps = [];

        if(warnings) {
            this.notFound = warnings.notFound || [];
        } else {
            this.notFound = [];
        }
    }

    hasWarnings() {
        return this.notFound.length > 0;
    }

    dereference(dsMap) {
        this.notFound.forEach(tblId => {
            this.affectedApps.push(dsMap[tblId])
        });

        this.affectedApps.sort((a, b) => a < b);
    }

    buildSummary() {
        if (this.hasWarnings()) {
            const tblCnt = this.notFound.length;
            const appCount = this.countApps();

            let message = `${appCount} app${(appCount > 1) ? `s` : ``} ${(appCount > 1) ? `have` : `has`} ${tblCnt} table${(tblCnt > 1) ? `s` : ``} missing, \
                    this may potentially cause problems.`;

            return message;

        } else {
            return null;
        }
    }

    countApps() {

        const appNameModeList = [];

        this.affectedApps.forEach(warning => {
            const appNames = Object.keys(warning);

            for (let i = 0; i < appNames.length; i++){

                const appName = appNames[i];
                const modes = warning[appName];

                modes.forEach(mode => {
                    appNameModeList.push(appName);
                });
            }
        });

        // Return unique names mode pair counts
        return [...new Set(appNameModeList)].length;
    }

    getAffectedAppList() {
        const appNameModeList = [];

        this.affectedApps.forEach(warning => {
            const appNames = Object.keys(warning);

            for (let i = 0; i < appNames.length; i++){

                const appName = appNames[i];
                const modes = warning[appName];

                modes.forEach(mode => {
                    const nameMode = appName + (mode === 8 ? ' (Test)' : mode === 7 ? ' (Preview)' : '');
                    appNameModeList.push(nameMode);
                });
            }
        });

        return [...new Set(appNameModeList)];
    }

    getAppNames() {
        let message = '';
        this.affectedApps.forEach(app => {
            const appName = Object.keys(app)[0];
            const appModes = Object.values(app)[0];
            message += `<br>${appName} ${appModes.length > 1 ? this.getModeNames(appModes) : ``}`;
        })
    }

    getModeNames(modeIds) {
        let modeStr = '(';
        modeIds.sort((a, b) => a < b).forEach((m, i) => {
            if (i > 0) {
                modeStr += `,`;
            }

            let mName = ''
            switch (m) {
                case 7:
                    mName = 'Preview';
                    break;
                case 8:
                    mName = 'Test';
                    break;
                case 7:
                    mName = 'Live';
                    break;

            }
            modeStr += mName;
        })

        modeStr += ')'

        return modeStr;
    }

    getAffectedApps() {
        return this.affectedApps;
    }

    getNotFound() {
        return this.notFound;
    }
}
