class StateVM {

    constructor(name, appId, appMode, parentId) {
       this.name = name;
       this.appId = appId;
       this.appMode = appMode;
       this.parentId = parentId;
    }

    getName() {
        return this.name;
    }

    getId() {
        return this.appId;
    }

    getModeId() {
        return this.appMode;
    }

    getParentId() {
        return this.parentId;
    }

    isRoot() {
        return this.getParentId() === 0;
    }

    isChildOf(other) {
        StateVM.validate(other);
        return this.getModeId() === other.getModeId() && this.getParentId() === other.getId();
    }
}

StateVM.validate = function (state) {
    if(!(state instanceof StateVM)) {
        throw `State must be instance of StateVM!`
    }
};
