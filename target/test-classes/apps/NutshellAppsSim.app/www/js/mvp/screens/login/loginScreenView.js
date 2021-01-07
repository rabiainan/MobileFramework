class LoginScreenView {

    constructor(dom) {
        this.logoImgElm = dom.querySelector("img#mainLogo");
        this.loginBtnElm = dom.querySelector("button#sign_in");
        this.domainInputElm = dom.querySelector("input#form_domain");
        this.usernameInputElm = dom.querySelector('input#form_username');
        this.rememberMeCheckboxElm = dom.querySelector('#form_remember');

        this.domainInputElm.addEventListener('blur', (event) => this.domainUpdated());
    }

    domainUpdated() {
        const newValue = this.domainInputElm.value;
        this.presenter.onDomainValueChange(newValue);
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    setMainLogoUrl(url) {

        const transition = new ImageTransition(this.logoImgElm);

        transition.start(url).then(() => {
            console.log('LoginScreenView: image transition complete.');
        });
    }


    setLoginBtnBackgroundColour(newColour) {
        this.loginBtnElm.style.backgroundColor = newColour;
    }

    setDefaultLogo() {
        this.setMainLogoUrl(Branding.DEFAULT_MAIN_LOGO_PATH);
    }

    getDomain() {
        return this.domainInputElm.value;
    }

    setDomain(domain) {
        this.domainInputElm.value = domain;
    }

    clearDomain() {
        this.setDomain('');
    }

    setUsername(username) {
        this.usernameInputElm.value = username;
    }

    clearUsername() {
        this.setUsername('');
    }

    setRememberMe(b) {
        this.rememberMeCheckboxElm.checked = b;
    }


}
