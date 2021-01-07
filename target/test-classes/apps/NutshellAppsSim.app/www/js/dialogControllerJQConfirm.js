function DialogControllerJQConfirm() {
    this.dialog = null;
}

DialogControllerJQConfirm.prototype.show = function(title, message, buttons, callback) {
    console.log(`DialogController#show: title: ${title}, message: ${message}, callback: ${callback}, buttons: `, buttons);

    const callbacks = {};

    buttons.forEach(label => {
        callbacks [label] = {
            text: label,
            action: function () {
                if (typeof callback === 'function') {
                    callback(label);
                }
            }
        };
    });

    const config = {
        title: title,
        buttons: callbacks,
        content: message,
        useBootstrap: false,
        boxWidth: '75%',
    };

    this.dialog = $.confirm(config);
};

DialogControllerJQConfirm.prototype.isInitialised = function() {
   return true;
};

DialogControllerJQConfirm.prototype.isOpen = function() {
    console.log(`DialogControllerJQConfirm#isOpen`);
    return this.dialog && this.dialog.isOpen();
};




