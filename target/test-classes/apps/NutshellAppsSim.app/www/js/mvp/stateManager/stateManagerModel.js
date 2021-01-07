class StateManagerModel {

    constructor(eventBus, appStateService, microAppService) {
        this.eventBus = eventBus;
        this.appStateService = appStateService;
        this.microAppService = microAppService;
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    getStatesVm() {

        return new Promise((resolve, reject) => {

            let _states = null;

            this.appStateService.getAllExcludeState().then(states => {
                _states = states;
                const appIds = this.extractAppIds(states);
                return this.microAppService.getByIds(appIds);
            }).then(microApps => {

                const idNameMap = {};

                microApps.forEach(microApp => {
                    idNameMap[microApp.id] = microApp.name;
                });

                const toVm = (function (idNameMap) {

                    const create = (state, idNameMap) => {
                        const id       = state.appId;
                        const name     = idNameMap[id];
                        const mode     = state.appMode;
                        const parentId = state.parentAppId;
                        return new StateVM(name, id, mode, parentId);
                    };

                    return state => create(state, idNameMap);

                })(idNameMap);

                const statesVm = new StatesVM();

                for (let i = 0; i < _states.length; i++) {

                    const state1 = toVm(_states[i]);

                    if (!state1.isRoot()) {
                        continue;
                    }

                    const stateChain = new StateChainVM(state1);
                    let parent = state1;

                    for (let j = 0; j < _states.length; j++) {
                        const state2 = toVm(_states[j]);

                        if (state2.isChildOf(parent)) {
                            stateChain.append(state2);
                            parent = state2;
                        }
                    }

                    statesVm.addStateChain(stateChain);

                }

                resolve(statesVm);

            }).catch(err => {
                const errMsg = `StateManagerModel: Could not get states!`;
                console.error(errMsg, err);
                rLog.log({
                    err: err
                }, errMsg, rLog.level.ERROR, [rLog.tag.MVP]);
                reject(err);
            });
        });
    }

    extractAppIds(states) {
        return states.map(state => state.appId);
    }

    clearAllStates() {
        return this.appStateService.removeAll().then(() => {
            this.presenter.onStateCleared(true);
        }).catch(err => {
            rLog.log({
                err: err
            }, 'State clearing failed', rLog.level.ERROR, [rLog.tag.MVP]);
            this.presenter.onStateCleared(false);
        });
    }

}

StateManagerModel.SHOW = 'stateManager';
