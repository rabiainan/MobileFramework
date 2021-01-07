function DataStructureInjector(user, domain) {
    this.user = user;
    this.domain = domain;
}

DataStructureInjector.prototype = {

    inject: function(dataStructures) {
        this.wipeInjected();
        this.injectDataStructures(dataStructures);
    },

    injectDataStructures: function (structuresArr) {
        for (let i = 0 ; i < structuresArr.length ; i++) {
            window.eval(structuresArr[i]);
        }
        console.log(`DataStructureInjector #injectDataStructures ${structuresArr.length} structures injected: OK`);
    },

    wipeInjected: function() {
        DataStructure.DestroyAll();
    }

};
