/**
 * Called when app was started by a deep link as well as by custom url scheme. However deep links cause this function
 * called only on Android and not iOS. (By custom-url-scheme plugin).
 * Its there just to prevent function not found JS errors as deep link logic will be handled by FBDL plugin.
 * @param url
 */
window.handleOpenURL = function(url) {
    console.log("handleOpenURL: received url: " + url);
}