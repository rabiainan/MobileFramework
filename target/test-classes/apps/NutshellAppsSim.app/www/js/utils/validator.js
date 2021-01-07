function isAuthFail(error) {
    console.error("Validator: error", error);
    return typeof error === 'string' && error.indexOf('Authentication failure') >= 0;
}