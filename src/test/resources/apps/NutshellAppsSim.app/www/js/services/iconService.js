function IconService(user, domain, repo) {
    this.setUser(user);
    this.setDomain(domain);
    this.setRepo(repo);
}

Object.assign(IconService.prototype, {
    setUser: function(user){
        this.user = user;
    },
    setDomain: function(domain){
        this.domain = domain;
    },
    setRepo: function(repo){
        if (!repo.isInitialised()) {
            throw new Error('Folder repo is not initialised!');
        }
        this.repo = repo;
    },
    getAll: function(){
        return this.repo.getAll(this.user, this.domain);
    },
    saveAll: function(icons){
        return this.repo.saveAll(this.user, this.domain, icons);
    }
})








