/**
 * Function addresses the problem of cordova-plugin-camera not removing its "Choose File" DOM element if users click
 * "Cancel". This should really be handled by the plugin and an issue has been raised on its GitHub page. Until and if
 * the plugin is fixed this file provides a workaround such that it adds additional "Cancel" button next to
 * "Choose File" which enables users to cancel the process.
 */
$(document).ready(() => {

    function createFileChooserContainer() {
        console.log('Creating file chooser container...')

        const overlay =
            `<div id="file-chooser-overlay">` +
                `<div id="file-chooser-container">` +
                    `<button id="file-chooser-cancel">Cancel</button>` +
                    `<label id="file-chooser-label">Choose Image</label>`+
                `</div>`+
            `</div>`;

        $(overlay).appendTo('body');
        $('.cordova-camera-select').appendTo('#file-chooser-label');
    }


    const observer = new MutationObserver(function (e) {
        console.log("mutation detected: ", e);
        if (e[0].addedNodes[0] && e[0].addedNodes[0].className === 'cordova-camera-select') {
            createFileChooserContainer();
        }
    });

    observer.observe(document.querySelector('body'), { childList: true });


    $('body').on('change', 'input.cordova-camera-select', function(e){
        console.log(`cordova-plugin-camera file change: files.length: ${e.target.files.length}`, e);
        if (e.target.files.length > 0) {
            document.querySelector('#file-chooser-overlay').remove();
        }
    });

    $('body').on('click', '#file-chooser-cancel', function(e){
        document.querySelector('#file-chooser-overlay').remove();
    });
});