function FolderService(user, domain, repo) {
    this.setUser(user);
    this.setDomain(domain);
    this.setRepo(repo);
}

Object.assign(FolderService.prototype, {
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
    getByFolderId: function(folderId){
        return this.repo.getByFolderId(this.user, this.domain, folderId);
    },
    saveFolderStructure: function(folderStructure){
        return this.repo.saveFolderStructure(this.user, this.domain, folderStructure);
    }
})








