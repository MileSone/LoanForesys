/**
 * Copyright (c) 2014, 2017, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your about ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'mbe/mbe', 'data/appVariables',
    'ojs/ojbutton', 'ojs/ojinputtext'],
        function (oj, ko, $, app, mbe, appVar) {

            function LoginViewModel() {
                var self = this;
                self.isLoggedIn = ko.observable(false);
                self.MBE_BaseURL = ko.observable("https://mobile-apacdemo08.mobileenv.us2.oraclecloud.com:443");
                self.MBE_ID = ko.observable("8ee55afe-5c6b-4495-8139-adc142a3757b");
                self.username = ko.observable("sharon.li@oracle.com");
                self.password = ko.observable("P3rf3c4d@y!");
                // Header Config
                self.headerConfig = {'viewName': 'header', 'viewModelFactory': app.getHeaderModel()};

                var storageUsername;
                var storagePassword;
                // Below are a subset of the ViewModel methods invoked by the ojModule binding
                // Please reference the ojModule jsDoc for additionaly available methods.

                var u = navigator.userAgent;
                var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
                var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

                self.loginSuccess = function (response) {
                    app.isLoading(false);
                    var storage = window.localStorage;
                    storage.setItem("ForEUsername", window.btoa(self.username()));
                    storage.setItem("ForEPassword", window.btoa(self.password()));

                    console.log(response);
                    appVar.response = response;
                    mbe.isLoggedIn = true;
                    self.isLoggedIn(mbe.isLoggedIn);
                    appVar.mcsLoginUser = self.username();
                    appVar.mcsLoginPassword = self.password();
                    oj.Router.rootInstance.go('home');
                };

                self.loginFailure = function (statusCode, data) {
                    app.isLoading(false);
                    mbe.isLoggedIn = false;
                    self.isLoggedIn(mbe.isLoggedIn);
                    alert("Login failed! statusCode:" + statusCode + " Message: " + JSON.stringify(data));
                };

                app.logout = function () {
                    if (confirm("是否確定登出？"))
                    {
                        //    mbe.logout();
                        mbe.isLoggedIn = false;
                        self.isLoggedIn(false);
                        appVar.mcsLoginUser = "employee";
                        appVar.mcsLoginPassword = "";
                        appVar.userRole = "employee";
                        oj.Router.rootInstance.go('login');
                    }
                };

                self.loginAction = function () {
                    self.login(self.username(), self.password());
                };



                self.login = function (authUsername, authPassword, flager) {
                    app.isLoading(true);
                    $.ajax({
                        type: "GET",
                        url: self.MBE_BaseURL() + "/mobile/custom/ForEsysAPIs/loan",
//                        data: null,
                        async: false,
                        headers: {
                            "oracle-mobile-backend-id": self.MBE_ID(),
                            "Authorization": "Basic " + window.btoa(authUsername + ":" + authPassword)
                        },
                        success: function (data) {
                            if (flager) {
                                console.log(data);
                                appVar.response = data;
                                app.isLoading(false);
                                oj.Router.rootInstance.go('home');
                            } else {
                                self.loginSuccess(data);
                            }
                        },
                        error: function (error) {
                            self.loginFailure(error);
                        },
                        complete: function (data) {
                            console.log("Login complete");
                        }
                    });
                    return true;
                };

                self.fp_login = function () {

                    if (isAndroid) {
                        self.androidFP();
                    } else if (isiOS) {
                        self.IOSFP();
                    } else {
                        alert("fp");
                    }
                };

                self.IOSFP = function () {

                    var storage = window.localStorage;
                    if (storage.getItem("ForEUsername")) {
                        storageUsername = window.atob(storage.getItem("ForEUsername"));
                        storagePassword = window.atob(storage.getItem("ForEPassword"));
                        window.plugins.touchid.isAvailable(
                                function () {
                                    window.plugins.touchid.verifyFingerprint(
                                            'Scan your fingerprint please', // this will be shown in the native scanner popup
                                            function (msg) {
                                                alert('login with user: ' + storageUsername);

                                                self.login(storageUsername, storagePassword, true);
                                            }
                                    , // success handler: fingerprint accepted
                                            function (msg) {
                                                alert('not ok: ' + JSON.stringify(msg));
                                            } // error handler with errorcode and localised reason
                                    );
                                }, // success handler: TouchID available
                                function (msg) {
                                    alert('Your device dont have finger print, message: ' + msg);
                                } // error handler: no TouchID available
                        );
                    } else {
                        alert("You need login once in order to use finger print feature.");
                    }
                };




                self.androidFP = function () {
                    FingerprintAuth.isAvailable(isAvailableSuccess, isAvailableError);
                };



                function isAvailableSuccess(result) {
                    console.log("FingerprintAuth available: " + JSON.stringify(result));
                    if (result.isAvailable) {
                        var storage = window.localStorage;

                        if (storage.getItem("ForEUsername")) {
                            storageUsername = window.atob(storage.getItem("ForEUsername"));
                            storagePassword = window.atob(storage.getItem("ForEPassword"));

                            var encryptConfig = {
                                clientId: "ForEsys",
                                username: storageUsername,
                                password: storagePassword
                            };
                            FingerprintAuth.encrypt(encryptConfig, encryptSuccessCallback, encryptErrorCallback);
                        } else {
                            alert("You need login once in order to use finger print feature.");
                        }
                    }
                }

                function isAvailableError(message) {
                    console.log("No Finger print error: " + message);
                }

                function encryptSuccessCallback(result) {
                    console.log("successCallback(): " + JSON.stringify(result));
                    if (result.withFingerprint) {
                        console.log("Successfully encrypted credentials.");
                        console.log("Encrypted credentials: " + result.token);
                        var storage = window.localStorage;
                        storage.setItem("FP_token", result.token);
                        self.login(storageUsername, storagePassword, true);
                    } else if (result.withBackup) {
                        console.log("Authenticated with backup password");
                    }
                }

                function encryptErrorCallback(error) {
                    if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
                        console.log("FingerprintAuth Dialog Cancelled!");
                    } else {
                        console.log("FingerprintAuth Error: " + error);
                    }
                }
                /**
                 * Optional ViewModel method invoked when this ViewModel is about to be
                 * used for the View transition.  The application can put data fetch logic
                 * here that can return a Promise which will delay the handleAttached function
                 * call below until the Promise is resolved.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 * @return {Promise|undefined} - If the callback returns a Promise, the next phase (attaching DOM) will be delayed until
                 * the promise is resolved
                 */
                self.handleActivated = function (info) {
                    // Implement if needed
                    self.isLoggedIn(false);
                };
                /**
                 * Optional ViewModel method invoked after the View is inserted into the
                 * document DOM.  The application can put logic that requires the DOM being
                 * attached here.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 * @param {boolean} info.fromCache - A boolean indicating whether the module was retrieved from cache.
                 */
                self.handleAttached = function (info) {
                    // Implement if needed
                    if (self.isLoggedIn()) {
                        alert();
                        self.logout();
                    }
                };
                /**
                 * Optional ViewModel method invoked after the bindings are applied on this View. 
                 * If the current View is retrieved from cache, the bindings will not be re-applied
                 * and this callback will not be invoked.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 */
                self.handleBindingsApplied = function (info) {
                    // Implement if needed
                };
                /*
                 * Optional ViewModel method invoked after the View is removed from the
                 * document DOM.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
                 */
                self.handleDetached = function (info) {
                    // Implement if needed
                };
            }

            /*
             * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
             * each time the view is displayed.  Return an instance of the ViewModel if
             * only one instance of the ViewModel is needed.
             */
            return new LoginViewModel();
        }
);
