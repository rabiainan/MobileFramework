const FirebaseService = (function() {

    const _email = "container@nutshellapps.co.uk";
    const _pass  = "ifindoubtsettimeout";

    const _authChangeListeners = [];

    let _firestore = null;

    let _isDead = false;

    const init = function() {
        console.log(`FirebaseService #init`);

        return new Promise((resolve, reject) => {


            // Initialize Firebase
            const config = {
                apiKey: "AIzaSyD1KOhLq5pqeLiSI_5x-jw15YVV21PNQLo",
                authDomain: "nutshell-container.firebaseapp.com",
                databaseURL: "https://nutshell-container.firebaseio.com",
                projectId: "nutshell-container",
                storageBucket: "",
                messagingSenderId: "217926352448"
            };
            firebase.initializeApp(config);
            // firebase.setLogLevel('debug');

            // Initialize Cloud Firestore through Firebase
            const firestore = firebase.firestore();

            firestore.enablePersistence({synchronizeTabs: true}).then(() => {
                console.log("Firebase persistence enabled OK");
                resolve();
            }).catch(function (err) {
                console.error("Firebase persistence cannot be enabled.", err);
                if (err.code === 'failed-precondition') {
                    // Multiple tabs open, persistence can only be enabled
                    // in one tab at a a time.
                    // ...
                } else if (err.code === 'unimplemented') {
                    // The current browser does not support all of the
                    // features required to enable persistence
                    // ...
                }
                reject(`Firebase persistence could not be enabled (${err.code})`);
            });


            _firestore = firestore;
        });
    };

    const authenticate = function() {
        console.log(`FirebaseService #authenticate`);

        return new Promise((resolve, reject) => {

            const currentUser = firebase.auth().currentUser;
            console.log(`FirebaseService: fb logged in user ${(currentUser !== null ? 'NOT' : '' )} found`, currentUser);

            if (currentUser) {
                resolve();
            } else {

                const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                    console.log(`FirebaseService: fb auth state changed user: `, user);

                    if (user) {
                        unsubscribe();
                        resolve();
                    }
                });


                firebase.auth().signInWithEmailAndPassword(_email, _pass).catch(error => {
                    // Handle Errors here.
                    console.error(`FirebaseService: fb login error:`, error);

                    if(!firebase.auth().currentUser) {
                        rLog.log({error: error}, 'FB Auth: Failed to sign in container user!', rLog.level.ERROR,
                            [rLog.tag.FB, rLog.tag.CONFIG, rLog.tag.AUTH]);
                        reject(error);
                    }

                });
            }

        });
    };

    const onLogout = function(callback) {
        console.log(`FirebaseService #onLogout`);

        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            console.log(`FirebaseService: fb auth state changed user: `, user);

            if (!user) {
                // Need "user": "null" otherwise FB rules denies writes of logs.
                // TODO: 2019-05-09 Remove once unauthenticated writes to logs is fully phased out.
                rLog.log({}, 'FB Auth: Container user logged out!', rLog.level.ERROR,
                    [rLog.tag.FB, rLog.tag.CONFIG, rLog.tag.AUTH], {"user": "null"});
                callback();
            }


        });

        _authChangeListeners.push(unsubscribe);
    };

    const _checkPulse = function() {
        return new Promise((resolve, reject) => {
            let app;
            try {
                app = firebase.app();
            } catch (e) {
                console.error(`FirebaseService isValid failed`, e);
                reject();
            }

            if (!app) {
                console.error(`FirebaseService isValid failed. no app`, app);
                reject();
            }

            try {
                firebase.firestore().collection("lifeTest").add({
                    "user": ConfigManager.user,
                    "domain": ConfigManager.domain,
                    "timestamp": new Date()
                }).then(docRef => {
                    console.log(`FirebaseService isValid, FB appears to be working OK`);
                    resolve();
                }).catch(e => {
                    console.error(`FirebaseService isValid failed firestore access.`, e);
                    reject();
                });
            } catch (e) {
                console.error(`FirebaseService isValid failed firestore access.`, e);
                reject();
            }

        });
    };

    const getFirestore = function() {
        return _firestore;
    };

    const isDead = function () {
        if (_isDead) {
            return Promise.resolve(true);
        }

        return new Promise((resolve, reject) => {
            _checkPulse().then(() => {
                resolve(false);
            }).catch(e => {
                console.error("FirebaseService: FB found dead. Only page refresh can save us now.", e);
                _isDead = true;
                resolve(true);
            });
        });
    }

    return {
        init,
        authenticate,
        onLogout,
        getFirestore,
        isDead
    }

})();
