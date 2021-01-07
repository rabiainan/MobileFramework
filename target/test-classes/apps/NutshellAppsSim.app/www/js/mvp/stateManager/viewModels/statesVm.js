class StatesVM {

    constructor() {
        this.states = [];
    }

    addStateChain(chain) {
        this.states.push(chain);
    }

    getStates() {
        return this.states;
    }

    isEmpty() {
        return this.states.length === 0;
    }

    getCount() {
        return this.states.length;
    }
}
