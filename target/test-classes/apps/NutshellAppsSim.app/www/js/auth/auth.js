const Auth = (function() {

    function confirmLogout() {
        const dlg = new DialogControllerJQConfirm();
        dlg.show("Confirm Logout", "Are you sure you want to logout?", ['Logout', 'Cancel'], choice => {
            if (choice === 'Logout') {
                logout();
            }
        })
    }

    function logout() {
        console.log(`Auth#_logout:`);
        const session = ConfigManager.sessionId;

        const logoutData = {
            "sessionId" : session
        };

        $.ajax({
            url : ConfigManager.serviceUrl + "/Json/Authentication/logout",
            type : "GET",
            data : {
                'data' : JSON.stringify(logoutData)
            },
            success : function(data) {
                console.log(data);
            },
            error : function(jqXmlHttpRequest, textStatus, errorThrown) {
                console.error(jqXmlHttpRequest);
            },
            fail: function(err) {
                console.log(err);
            }

        });

        if (localStorage.getItem('remember') === "false") {
            localStorage.removeItem('domain');
            localStorage.removeItem('username');
            localStorage.removeItem('remember');
            localStorage.removeItem('lastSyncedUser');
            localStorage.removeItem('lastSyncedDomain');
            localStorage.removeItem('lastSyncStatus');
            localStorage.removeItem('lastSyncedOn');
        }

        localStorage.removeItem('session_ID');
        localStorage.removeItem('pass');
        localStorage.removeItem('appName');
        localStorage.removeItem('appID');
        localStorage.removeItem('jumpAppModeId');
        localStorage.removeItem('launchStack');
        localStorage.removeItem('defaultStartScreenId');

        localStorage.setItem('showLogoutMessage', true);
        NsNavigator.navigateToScreen('index.html');
    }

    function loginFailure(error) {
        $('#cover').fadeOut(1000);
        localStorage.setItem('remember', true);
        errorToast(error, "Error");
    }

    function hasValidSession() {
        return localStorage.getItem('session_ID') !== null;
    }

    function validateSession() {
        if (!hasValidSession()) {
            logout();
        }
    }

    function invokeLogin() {
        const domain = $.trim($('#form_domain').val().toLowerCase());
        const username = $.trim($('#form_username').val().toLowerCase());
        const pass = $.trim($('#form_password').val());
        const remember = $('#form_remember').prop('checked');

        let errorMessage = 'The following fields are missing:';
        let error = false;

        if (domain === null || domain === '') {
            error = true;
            errorMessage += '<br><b>Account</b>';
        }

        if (username === null || username === '') {
            error = true;
            errorMessage += '<br><b>Username</b>';
        }

        if (pass === null || pass === '') {
            error = true;
            errorMessage += '<br><b>Password</b>';
        }

        if (error === true) {
            errorToast(errorMessage, 'Login Failed');
        } else {
            toastr.clear();
            $('#cover').show();
            localStorage.setItem("remember", remember);
            _authenticateUser(username, pass, domain);
        }
    }

    function _authenticateUser(username, pass, domain) {

        // Make your jQuery Mobile framework configuration changes here!
        $.support.cors = true;

        var loginData = {
            "username" : username,
            "password" : pass
        };

        let serviceURL = ConfigManager.domainToServiceUrl(domain);
        const authUrl = serviceURL + "Json/Authentication/login";

        try{
            $.ajax({
                url : authUrl,
                type : "GET",
                timeout : 10000,
                data : {
                    'data' : JSON.stringify(loginData)
                },
                dataType : "jsonp",
                crossDomain : true,
                success : function(data) {

                    localStorage.setItem("username", username);
                    localStorage.setItem("pass", pass);
                    localStorage.setItem("domain", domain);

                    if (jQuery.isEmptyObject(data['sessionId']) && !data['succeeded']) {
                        if(data['error'] && data['error'] === 'expired_password') {
                            rLog.log(data, 'Password Expired', rLog.level.INFO, [rLog.tag.AUTH], {domain: domain, user: username});
                            _passwordExpired('Password has expired, you need to reset it. Click here!', false);
                        } else {
                            rLog.log(data, 'Authentication failed. Wrong credentials', rLog.level.INFO, [rLog.tag.AUTH],
                                {domain: domain, user: username});

                            Auth.loginFailure('Something went wrong. Please ensure all details are entered correctly.', false);
                            $('#main_content').hide();
                            $('#logout').hide();
                        }
                    } else {
                        const sessionId = data['sessionId'];
                        localStorage.setItem("session_ID", sessionId);

                        rLog.log(data, 'Authentication successful', rLog.level.INFO, [rLog.tag.AUTH],
                            {domain: domain, user: username, sessionId: sessionId});

                        toastr.clear();

                        $('#refreshLink').show();

                        ConfigManager.init(domain, username).then(
                            function () {
                                NsNavigator.navigateToScreen('home.html');
                            }).catch(function () {
                            var content = 'Could not find configuration for the instance:<b>' + domain
                                + '</b><br><button type="button" class="btn clear">Logout</button>';
                            showToastrMessage(content, 'Configuration Error', 0, false, Auth.logout, {"closeButton": false});
                        });
                    }
                },
                error: function(jqXmlHttpRequest, textStatus, errorThrown) {
                    rLog.log({
                        textStatus: textStatus,
                        errorThrown: errorThrown,
                        code: jqXmlHttpRequest.status,
                        url: authUrl
                    }, 'Authentication error', rLog.level.ERROR, [rLog.tag.AUTH], {domain: domain, user: username});

                    console.error(errorThrown);
                    Auth.loginFailure('Something went wrong authenticating. Please ensure all details are entered correctly, and try again.');
                    $('#cover').fadeOut(100);
                }
            });
        }
        catch(err) {
            Auth.loginFailure('Something went wrong authenticating. Please ensure all details are entered correctly, and try again.');
        }
    }

    function _passwordExpired(error) {
        toastr.clear();
        localStorage.setItem('remember', true);

        toastr.options = {
            "closeButton" : false,
            "debug" : false,
            "newestOnTop" : false,
            "progressBar" : true,
            "positionClass" : "toast-top-center",
            "preventDuplicates" : true,
            "onclick" : function () {
                NsNavigator.navigateToScreen('reset.html');
            },
            "showDuration" : "300",
            "hideDuration" : null,
            "timeOut" : null,
            "extendedTimeOut" : null,
            "showEasing" : "swing",
            "hideEasing" : "linear",
            "showMethod" : "fadeIn",
            "hideMethod" : "fadeOut"
        };

        toastr.error(error, 'Expired Password');
    }


    return {
        invokeLogin,
        logout,
        confirmLogout,
        loginFailure,
        hasValidSession,
        validateSession
    };

})();

// Expose logout function as global for backwards compatibility with compiled apps.
logout = Auth.logout;
