function onDeviceReady() {
    console.log('reset.js: onDeviceReady()');

    // NOTE! the order here matters!
    // NOTE! the order here matters!
    FirebaseService.init().then(() => {
        NsNavigator.init(firebase);
        return rLog.init(null, null, null);
    }).then(function(){
        return FirebaseService.authenticate();
    }).then(function() {
        return NS.init();
    }).then(function() {
        return NA.init(null, null);
    }).then(function() {
        FirebaseService.onLogout(() => {
            console.error("Container Firebase user logged out!");
            const content = 'Error occured. Please re-login<br><button type="button" class="btn clear">Logout</button>';
            showToastrMessage(content, 'Error', 0, false, Auth.logout, {"closeButton": false});
        });
        return Promise.resolve();
    }).then(function() {
        logGA();
        StatusBar.hide();
        screen.orientation.unlock();
    }).catch(function(err) {
        console.error("index.js failed to initialize NS.", err);
        const content = 'Error occurred while initialise the app';
        showToastrMessage(content, 'Initialisation Error', 0, false, Auth.logout, {"closeButton": false});
    });
}

function backHome() {
    NsNavigator.navigateToScreen('index.html');
}

function logGA() {
    //To track a Screen (PageView):
    // window.ga.trackView('reset.html');
}

function validateForm() {
    const domain = $.trim($('#form_domain').val().toLowerCase());
    const username = $.trim($('#form_username').val().toLowerCase());

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

    if (error) {
        showToastrMessage(errorMessage, 'An Error Occurred', 5000, false, null, {"closeButton": false});
    } else {
        let serviceURL;
        if (domain.match(/[a-z]/i)) {
            serviceURL = "https://" + domain + ".nutshellapps.com/eDocs-Services/";
        } else {
            serviceURL = "http://" + domain + ":8080/eDocs-Services/";
        }
        sendPasswordResetRequestEmail(username, domain, serviceURL);
    }
}

function sendPasswordResetRequestEmail(username, domain, serviceUrl) {
    const url = serviceUrl + "Json/Authentication/resetPassword";
    const data = {
        "username" : username
    };

    $.ajax({
        url: url,
        type: "GET",
        timeout: 30000,
        data: {
            'data': JSON.stringify(data)
        },
        success: function(data) {
            if(data['succeeded'])
            {
                showToastrMessage('An email has been sent to your email address. Please follow the instructions to reset your password. You will now be redirected back to the login page.',
                    'Email Sent Successfully', 10000, 'success', () => NsNavigator.navigateToScreen('index.html'));
                clearFields();
            }
        },
        error: function(jqXmlHttpRequest, textStatus, errorThrown) {
            showToastrMessage('The following error has been thrown: '+errorThrown, 'Error Sending Email', 10000);
            rLog.log({
                textStatus: textStatus,
                errorThrown: errorThrown,
                code: jqXmlHttpRequest.status,
                url: url,
                username: username
            }, 'Password reset request error', rLog.level.ERROR, [rLog.tag.AUTH], {domain: domain, user: username});

        }
    });
}

function clearFields() {
    $('#form_domain').val('');
    $('#form_username').val('');
}

