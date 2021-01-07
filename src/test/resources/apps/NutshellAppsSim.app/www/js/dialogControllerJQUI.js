function DialogControllerJQUI($container) {

    if ($($container).length === 0) {
        throw `Dialog container not found`
    }

    this.$container = $container;
    this.dialog = null;

    this.init = function($container) {
        $($container).dialog({
            autoOpen: false
        });
        this.dialog = $($container).dialog('instance');
    };

    this.init($container);
}

DialogControllerJQUI.prototype.isOpen = function() {
    console.log(`DialogController#isOpen`);
    return this.dialog.isOpen();
};

DialogControllerJQUI.prototype.setMessage = function(text) {
    console.log(`DialogController#setMessage: text ${text}`);
    $(this.$container).html(text);
};

DialogControllerJQUI.prototype.show = function(title, message, buttons, callback) {
    console.log(`DialogController#show: title: ${title}, message: ${message}, callback: ${callback}, buttons: `, buttons);

    if (this.isOpen()) {
        throw 'Dialog is already open!'
    }

    const callbacks = [];

    buttons.forEach(label => {
        const btnCfg = {
            text: label,
            click: function() {
                $( this ).dialog( "close" );
                callback(label);
            }
        };
        callbacks.push(btnCfg);
    });

    const config = {
        modal: true,
        autoOpen: false,
        closeOnEscape: false,
        title: title,
        buttons: callbacks,
        open: function() {
            $(this).closest('div.ui-dialog')
                .find('.ui-dialog-titlebar-close')
                .click(function(e) {
                    callback(null);
                });
        }
    };

    this.setMessage(message);
    this.dialog.option(config);
    this.dialog.open("open");
};

DialogControllerJQUI.prototype.isInitialised = function() {
    console.log(`DialogController#isInitialised`);
    return this.dialog !== null;
};




