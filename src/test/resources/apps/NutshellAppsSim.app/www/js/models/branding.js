class Branding {

    constructor(domain) {
        this.domain = domain;
        this.mainLogoUrl = Branding.DEFAULT_MAIN_LOGO_PATH;
        this.loginButtonBackgroundColour = Branding.DEFAULT_LOGIN_BTN_BACKGROUND_COLOUR;
        this.headerBackgroundColour = Branding.DEFAULT_HEADER_BACKGROUND_COLOUR;
        this.progressCircleColour = Branding.DEFAULT_PROGRESS_CIRCLE_COLOUR;
        this.syncReportBtnColour = Branding.DEFAULT_SYNC_REPORT_BTN_COLOUR;
    }

    setMainLogoUrl(url) {
        if (this.isValidUrl(url)) {
            this.mainLogoUrl = url;
        } else {
            console.error(`Branding# invalid mainLogoUrl: ${url}`);
        }
    }

    isValidUrl(url) {
        return url && url.startsWith('https://firebasestorage.googleapis.com/v0/b/nutshell-container.appspot.com/o/branding');
    }

    getMainLogoUrl() {
        return this.mainLogoUrl;
    }

    setLoginBtnBackgroundColour(colour){
        if(this.isValidColour(colour)) {
            this.loginButtonBackgroundColour = colour;
        } else {
            console.error(`Branding# invalid loginBtnBackgroundColour: ${colour}`);
        }
    }

    isValidColour(colour) {
        return colour && colour.startsWith('#') && (colour.length === 7 || colour.length === 9); // no alpha 7, with alpha 9
    }

    getLoginBtnBackgroundColour() {
        return this.loginButtonBackgroundColour;
    }

    setHeaderBackgroundColour(colour) {
        if(this.isValidColour(colour)) {
            this.headerBackgroundColour = colour;
        } else {
            console.error(`Branding# invalid headerBackgroundColour: ${colour}`);
        }
    }

    getHeaderBackgroundColour() {
        return this.headerBackgroundColour;
    }

    setProgressCircleColour(colour) {
        if(this.isValidColour(colour)) {
            this.progressCircleColour = colour;
        } else {
            console.error(`Branding# invalid progressCircleColour: ${colour}`);
        }
    }

    getProgressCircleColour() {
        return this.progressCircleColour;
    }

    setSyncReportBtnColour(colour) {
        if(this.isValidColour(colour)) {
            this.syncReportButtonColour = colour;
        } else {
            console.error(`Branding# invalid syncReportButtonColour: ${colour}`);
        }
    }

    getSyncReportBtnColour() {
        return this.syncReportButtonColour;
    }


}

Branding.fromObj = function(obj) {
    const domain = obj.domain;
    const mainLogoUrl = obj.mainLogoUrl;
    const loginButtonBackgroundColour = obj.loginButtonBackgroundColour;
    const headerBackgroundColour = obj.headerBackgroundColour;
    const progressCircleColour = obj.progressCircleColour;
    const syncReportButtonColour = obj.syncReportButtonColour;
    const branding = new Branding(domain);
    branding.setMainLogoUrl(mainLogoUrl);
    branding.setLoginBtnBackgroundColour(loginButtonBackgroundColour);
    branding.setHeaderBackgroundColour(loginButtonBackgroundColour);
    branding.setHeaderBackgroundColour(headerBackgroundColour);
    branding.setProgressCircleColour(progressCircleColour);
    branding.setSyncReportBtnColour(syncReportButtonColour);
    return branding;
};

Branding.getDefault = function() {
    return new Branding();
};

Branding.DEFAULT_MAIN_LOGO_PATH = 'img/login_screen_logo.png';
Branding.DEFAULT_LOGIN_BTN_BACKGROUND_COLOUR = '#2d8fc7';
Branding.DEFAULT_HEADER_BACKGROUND_COLOUR = '#41a4dd';
Branding.DEFAULT_PROGRESS_CIRCLE_COLOUR = '#41a4dd';
Branding.DEFAULT_SYNC_REPORT_BTN_COLOUR = '#41a4dd';
