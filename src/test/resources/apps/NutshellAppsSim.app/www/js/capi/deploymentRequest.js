class DeploymentRequest {

    constructor(appId, parentAppId, mode, jumpMode, name) {
        this.appId = Number(appId);
        this.originalAppId = this.appId;
        this.jumpMode = Number(jumpMode);
        this.name = name;
        this.originalName = name;
        this.parentAppId = Number(parentAppId);
        this.originalParentAppId = this.parentAppId;
        this.mode = Number(mode);
    }

    resetToOrigin() {
        console.log(`DeploymentRequest#resetToOrigin`);
        this.appId = this.originalAppId;
        this.name = this.originalName;
        this.parentAppId = 0;
    }

    /**
     * Used to reset request after the chain is cleared to have its parent pointing to the app which launched current
     * app.
     */
    resetToChain() {
        this.parentAppId = this.originalParentAppId;
    }
}
