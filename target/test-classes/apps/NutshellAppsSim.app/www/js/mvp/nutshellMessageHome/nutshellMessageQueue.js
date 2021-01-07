/**
 * Collection structure to store Nutshell Messages incoming from Firestore.
 */
class NutshellMessageQueue {

    constructor() {
        this.messages = [];
        this.observer = null;
    }

    add(message) {
        this.messages.unshift(message);
        this.notify()
    }

    remove() {
        return this.messages.pop();
    }

    removeById(id) {
        this.messages = this.messages.filter(msg => msg.getId() !== id);
    }

    first() {
        return this.messages[0];
    }

    last() {
        return this.messages[this.messages.length - 1];
    }

    size() {
        return this.messages.length;
    }

    isEmpty() {
        return this.size() === 0;
    }

    subscribe(f) {
        this.observer = f;
    }

    unsubscribe() {
        this.observer = null;
    }

    notify() {
        if (typeof this.observer === "function") {
            this.observer();
        }
    }

}


