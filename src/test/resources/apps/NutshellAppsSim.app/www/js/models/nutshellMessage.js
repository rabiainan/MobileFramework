class NutshellMessage {
    constructor(id) {
        this.id = id;
        this.uuid = null;
        this.title = null;
        this.message = null;
        this.level = null;
        this.action = null;
        this.type = null;
        this.expiresOn = null;
        this.createdOn = null;
        this.createdBy = null;
    }

    getId() {
        return this.id;
    }

    getUuid() {
        return this.uuid;
    }

    setUuid(uuid) {
        this.uuid = uuid;
    }

    getTitle() {
        return this.title;
    }

    setTitle(title) {
         this.title = title;
    }

    getMessage() {
        return this.message;
    }

    setMessage(message) {
        this.message = message;
    }

    getLevel() {
        return this.level;
    }

    setLevel(level) {
        this.validateLevel(level);
        this.level = level;
    }

    validateLevel(level) {
        if (!Object.values(NutshellMessage.level).includes(level)) {
            throw new Error('notification level unknown: ' + level);
        }
    }

    getAction() {
        return this.action;
    }

    setAction(action) {
        this.validateAction(action);
        this.action = action;
    }

    validateAction(action) {
        if (!Object.values(NutshellMessage.action).includes(action)) {
            throw new Error('notification action unknown: ' + action);
        }
    }

    getType() {
        return this.type;
    }

    setType(type) {
        this.validateType(type);
        this.type = type;
    }

    validateType(type) {
        if (!Object.values(NutshellMessage.type).includes(type)) {
            throw new Error('notification type unknown: ' + type);
        }
    }

    getExpiresOn() {
        return this.expiresOn;
    }

    setExpiresOn(expiresOn) {
        this.expiresOn = expiresOn;
    }

    getCreatedOn() {
        return this.createdOn;
    }

    setCreatedOn(createdOn) {
        this.createdOn = createdOn;
    }

    getCreatedBy() {
        return this.createdBy;
    }

    setCreatedBy(createdBy) {
        this.createdBy = createdBy;
    }

}

NutshellMessage.level = {
    ERROR : 'error',
    WARNING: 'warning',
    INFO: 'info'
};

NutshellMessage.action = {
    SYNC : 'sync',
    FSYNC: 'fsync',
    TRUE_FSYNC: 'true_fsync',
    LOGOUT: 'logout',
    NONE: 'none'
};

NutshellMessage.type = {
    GENERAL : 'general',
    PAN: 'pan'
};

NutshellMessage.fromObj = function(id, obj) {
    const nm = new NutshellMessage(id);
    nm.setUuid(obj.uuid);
    nm.setTitle(obj.title);
    nm.setMessage(obj.message);
    nm.setLevel(obj.level);
    nm.setAction(obj.action);
    nm.setType(obj.type);
    nm.setExpiresOn(obj.expiresOn.toDate());
    nm.setCreatedOn(obj.createdOn.toDate());
    nm.setCreatedBy(obj.createdBy);
    return nm;
};
