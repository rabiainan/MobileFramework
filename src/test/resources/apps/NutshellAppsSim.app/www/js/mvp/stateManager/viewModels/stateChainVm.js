class StateChainVM {

    constructor(rootState) {

        this.validateRoot(rootState);
        this.chain = [rootState];
    }

    validateRoot(rootState) {
        StateVM.validate(rootState);

        if (rootState.getParentId() !== 0) {
            throw `Root state must not have a parent!`
        }
    }

    validateChild(childState) {
        StateVM.validate(childState);

        const head = this.chain[this.chain.length - 1];

        if (childState.getParentId() !== head.getId()) {
            throw `Child parent id ${childState.getParentId()} must match head's id: ${head.getId()}`;
        }

        if (childState.getModeId() !== head.getModeId()) {
            throw `Child parent mode id ${childState.getModeId()} must match head's mode id: ${head.getModeId()}`;
        }
    }

    getRoot() {
        return this.chain[0];
    }

    getChain() {
        return this.chain;
    }

    getChild(i) {
        return this.chain[i];
    }

    hasChildren() {
        return this.chain.length > 1;
    }

    append(childState) {
        this.validateChild(childState);
        const currentLength = this.chain.length;
        this.chain.push(childState);
        const newLength = this.chain.length;
        return currentLength !== newLength;
    }


    get length () {
        return this.chain.length;
    }

}
