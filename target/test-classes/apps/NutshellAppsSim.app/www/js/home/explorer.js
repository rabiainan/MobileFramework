// TODO: 21/05/2020 This module should really be split in sync service and the UI logic placed in home MVP.
function Explorer(sessionId, serviceURL, folderService, microAppService, iconService, deploymentService, appLaunchService ,eventBus) {
    this.sessionId         = sessionId;
    this.serviceURL        = serviceURL;
    this.folderService     = folderService;
    this.microAppService   = microAppService;
    this.iconService       = iconService;
    this.deploymentService = deploymentService;
    this.appLaunchService  = appLaunchService;
    this.eventBus          = eventBus;
    this.FOLDERS_PATH      = serviceURL + 'Json/Folders/getFolders';
    this.APPS_PATH         = serviceURL + 'Json/MicroApps/getMicroApps';
    this.IMAGES_PATH       = serviceURL + 'Json/Images/getImages';
    this.ROOT_FOLDER_ID    = 0;
    this.ROOT_FOLDER_TITLE = 'My Forms';
    this.HTTP_TIMEOUT      = 30000;
    this.setUpEventListeners();
}

Explorer.prototype = {

    setUpEventListeners: function() {
        this.eventBus.addEventListener(NsEvents.SYNC_FINISHED, () => this.showFolders());
    },

    showFolders: function(folderId) {
        const ctx = this;

        folderId |= ctx.ROOT_FOLDER_ID;

        this.folderService.getByFolderId(folderId).then(folder => {
            ctx.showAll(false);
            ctx.clear();
            ctx.setHeader(folder);

            if (folderId !== ctx.ROOT_FOLDER_ID) {
                const backBtnHtml = ctx.buildBackBtnHtml(folder);
                $('.products').append(backBtnHtml);
            }

            jQuery.each(folder['children'],
                function (i, childFolder) {
                    const folderHtml = ctx.buildFolderHtml(childFolder);
                    $('.products').append(folderHtml);
                }
            );

            ctx.showApps(folderId);

        }).catch(err => {
            errorToast('Something went wrong retrieving folders!');
            ctx.showAll(true);
        });
    },

    showApps: function(folderId) {
        const ctx = this;

        let apps = null;

        this.microAppService.getByFolderId(folderId).then(microApps => {
            microApps = microApps.sort((a1, a2) => a1.name.localeCompare(a2.name));
            apps = microApps;
            const ids = microApps.map(app => app.id);
            return this.deploymentService.getByAppIds(ids, false);
        }).then(deployments => {
            ctx.assignDeploymentsToApps(apps, deployments);

            apps.forEach(microApp => {
                const appHtml = ctx.buildAppHtml(microApp);
                $('.products').append(appHtml);
            });

            ctx.showFolderImages();
            ctx.showAll(true);
        }).catch(err => {
            ctx.loginFailure('Something went wrong retrieving apps. Please re-login.', true);
        });

    },

    assignDeploymentsToApps: function(apps, deployments) {
        apps.forEach(app => app.deployments = deployments.filter(dep => dep.id === app.id));
    },

    showFolderImages: function() {

        this.iconService.getAll().then(images => {
                console.log('Explorer got folder icons.' );
                console.log(images);

                images.forEach(img => {

                    const $folder = $(".thumbnail_" + img['id'] + " .app_container .app_bg_icon");
                    $folder.css("background", "url(" + img['src'] + ") center no-repeat");
                    $folder.css("background-size", "85%");
                    $folder.css("border-radius", "0px");

                    const $app = $(".thumbnail_" + img['id'] + " .app_container .app_bg_icon_microapp");
                    $app.css("background", "url(" + img['src'] + ") center no-repeat");
                    $app.css("background-size", "85%");
                    $app.css("border-radius", "0px");
                });

            }).catch(err => {
                errorToast('Something went wrong retrieving folder images.');
            });
    },

    buildFolderHtml: function(folderData) {
        const id = folderData['id'];
        const name = folderData['name'];
        const parentId = folderData['parentId'];
        const thumbnailId = folderData['thumbnailId'];

        const idAttr = 'folder_' + id;
        const classAttr = 'product folder_ID' + parentId + ' thumbnail_' + thumbnailId;
        const onClickAttr = 'Explorer.INSTANCE.showFolders(' + id + ')';

        const folderHtml =
            '<div data-name="' + name + '" id="' + idAttr + '" class="' + classAttr + '" onclick="' + onClickAttr + '">'
            + '<div class="app_container">'
            + '<div class="app_bg_shadow"></div>'
            + '<div class="app_bg_icon"></div>'
            + '</div>'
            + '<p class="name">' + name + '</p>'
            + '<p class="hideName" style="display: none">' + name + '</p>'
            + '</div>';

        return folderHtml;
    },

    buildBackBtnHtml: function(folder) {
        const parentId = folder['parentId'];
        const classAttr = 'product go_back_folder';
        const onClickAttr = 'Explorer.INSTANCE.showFolders(' + parentId + ')';
        const styleAttr = 'background: url(img/back_dark.png) center no-repeat;background-size: 85%;';

        const backBtnHtml =
            '<div class="' + classAttr + '" onclick="' + onClickAttr + '">'
            + '<div class="app_container">'
            + '<div class="app_bg_shadow"></div>'
            + '<div class="app_bg_icon" style="' + styleAttr+ '"></div>'
            + '</div>'
            + '<p class="name">Back</p>'
            + '</div>';

        return backBtnHtml;
    },

    buildAppHtml: function(app) {
        const id = app['id'];
        const name = app['name'];
        const folderId = (app['folderId']);
        const thumbnailId = app['thumbnailId'];

        const hasDeployments = app.deployments.length > 0;
        const isCompatible   = this.appLaunchService.hasCompatibleDeployments(app);
        const openable       = this.appLaunchService.canBeOpened(app);

        let targetDevice = null;

        if (hasDeployments && !isCompatible) {
            targetDevice = app.deployments[0].settings['device-type'];
        }

        const appHtml =
            '<div id="microapp_' + id + '" data-appname="' + name + '" data-openable="' + openable
            + '" data-compatible="' + isCompatible + '" ' + '" data-target-device="' + targetDevice + '" '
            + '" data-hasDeployments="' + hasDeployments + '" '
            + 'class="openable_' + openable + ' ' + (isCompatible ? '' : 'incompatible') + ' ' + ' microapp microapp_'
            + folderId + ' product thumbnail_' + thumbnailId + '" onclick="Explorer.INSTANCE.getMicroAppData(this)">'
                + '<div class="app_container">'
                    + '<div class="app_bg_shadow"></div>'
                    + '<div class="app_bg_icon_microapp"></div>'
                + '</div>'
                + '<p class="name">' + name + '</p>'
                + '<p class="hideName" style="display: none">' + name + '</p>'
            + '</div>';

        return appHtml;
    },
    getMicroAppData: function(data) {

        const openable = $(data).attr('data-openable');
        const compatible = $(data).attr('data-compatible');
        const hasDeployments = $(data).attr('data-hasDeployments');

        if(openable === "false") {
            errorToast('This application is locked. You can only use this application through another workflow.', 'Locked App');
        } else if (hasDeployments === 'false') {
            errorToast('Compiled app not found. Please make sure the container is fully synced.', 'App Not Found');
        } else if (compatible === "false") {
            let targetDevice = $(data).attr('data-target-device');
            targetDevice = targetDevice === 'setting_phone' ? "phones" : targetDevice === 'setting_tablet' ? "tablets" : "desktops";
            errorToast(`This app was built for ${targetDevice} and is not compatible with your current device`, 'Incompatible Device');
        } else {
            let microAppId = $(data).attr('id');
            microAppId = microAppId.replace('microapp_', '');

            this.appLaunchService.requestAppLaunch(microAppId).catch(err => {
                errorToast(`Failed to launch an app with ID ${microAppId}.`, 'App Not Found');
            });

        }
    },

    sync: function(callback) {
        const ctx = this;
        let syncSuccess = true;

        ctx.syncFolders(function (folderSyncSuccess) {
            syncSuccess &= folderSyncSuccess;
            ctx.syncApps(function (appsSyncSuccess) {
                syncSuccess &= appsSyncSuccess;
                ctx.syncFolderImages(function(imgSyncSuccess) {
                    syncSuccess &= imgSyncSuccess;
                    callback(syncSuccess);
                });
            });
        });
    },

    syncFolders: function(callback) {
        const ctx = this;
        const reqData = ctx.reqDataSessionId();

        $.ajax({
            url: ctx.FOLDERS_PATH,
            type: "GET",
            timeout: ctx.HTTP_TIMEOUT,
            data: reqData,
            dataType: "jsonp",
            success: function (data) {
                console.log('Explorer: folderData downloaded:');
                console.log(data);

                if (data['succeeded']) {

                    ctx.folderService.saveFolderStructure(data['root']).then(() => {
                        console.log('Explorer: folder structure saved OK');
                        callback(true);
                    }).catch(err => {
                        errorToast('Something went wrong saving folders.');
                        callback(false);
                    });

                } else if (isAuthFail(data['error'])){
                    forceLogout();
                } else {
                    errorToast('Something went wrong retrieving folders. Please try to re-sync.');
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                console.error(xhr);

                rLog.log({
                    textStatus: textStatus,
                    errorThrown: errorThrown,
                    code: xhr.status,
                    url: ctx.FOLDERS_PATH,
                    req: reqData
                }, 'Error getting folder data', rLog.level.ERROR, [rLog.tag.EXPLORER]);
                errorToast('Something went wrong retrieving folders. ');
                callback(false);
            }
        });
    },

    syncApps: function(callback) {
        const ctx = this;
        const reqData = ctx.reqDataSessionId();

        $.ajax({
            url: ctx.APPS_PATH,
            type: "GET",
            timeout: ctx.HTTP_TIMEOUT,
            data: reqData,
            dataType: "jsonp",
            success: function (data) {
                console.log('Explorer: appData downloaded.');

                if (isAuthFail(data['error'])) {
                    forceLogout();
                    return;
                }

                ctx.microAppService.saveAll(data['microApps']).then(() => {
                    callback(true);
                }).catch(err => {
                    errorToast('Something went wrong saving apps.');
                    callback(false)
                });
            },
            error: function (xhr, textStatus, errorThrown) {
                console.error(xhr);

                rLog.log({
                    textStatus: textStatus,
                    errorThrown: errorThrown,
                    code: xhr.status,
                    url: ctx.APPS_PATH,
                    reqData: reqData
                }, 'Error getting micro app data', rLog.level.ERROR, [rLog.tag.EXPLORER]);

                errorToast('Something went wrong retrieving apps.');
                callback(false);
            }
        });
    },

    syncFolderImages: function(callback) {
        const ctx = this;
        const reqData = ctx.reqDataSessionId();

        $.ajax({
            url: ctx.IMAGES_PATH,
            type: "GET",
            timeout: ctx.HTTP_TIMEOUT,
            data: reqData,
            dataType: "jsonp",
            success: function(data) {

                if (isAuthFail(data['error'])) {
                    forceLogout();
                    return;
                }

                ctx.iconService.saveAll(data['images']).then(() => {
                    console.log('Explorer: images saved OK.');
                    callback(true);
                }).catch(err => {
                    errorToast('Something went wrong retrieving folder images.');
                    callback(false);
                });
            },
            error : function(xhr, textStatus, errorThrown) {
                console.error(xhr);

                const et = typeof errorThrown == 'string' ? errorThrown : {
                    message: errorThrown.message,
                    name: errorThrown.name
                };

                rLog.log({
                    textStatus: et,
                    errorThrown: errorThrown,
                    code: xhr.status,
                    url: ctx.IMAGES_PATH,
                    reqData: reqData
                }, 'Error getting images', rLog.level.ERROR, [rLog.tag.EXPLORER]);

                errorToast('Something went wrong retrieving folder images.');
                callback(false);
            }
        });
    },

    reqDataSessionId: function() {
        const sessionObj = {
            "sessionId": this.sessionId
        };
        return {'data': JSON.stringify(sessionObj)};
    },

    showAll: function(show) {
        const products = $('.products');
        const navbar = $('.navbar');

        if (show) {
            navbar.show();
            products.fadeIn(250);
        } else {
            products.hide();
            navbar.hide();
        }
    },

    clear: function(){
        $("#filter-items").val('');
        $('.products').empty();
    },

    setHeader: function(folder) {
        const header = folder['id'] === this.ROOT_FOLDER_ID ? this.ROOT_FOLDER_TITLE : folder['name'];
        $('#title_header').text(header);
    },

    // TODO: 18/05/2020 Consider another location for this function.
    loginFailure: function (error, refresh) {
        $('#cover').fadeOut(1000);
        toastr.clear();
        localStorage.setItem('remember', true);

        if(refresh == undefined || refresh == null) {
            refresh = false;
        }

        toastr.options = {
            "closeButton" : false,
            "debug" : false,
            "newestOnTop" : false,
            "progressBar" : true,
            "positionClass" : "toast-top-center",
            "preventDuplicates" : true,
            "onclick" : (refresh)?function () { Auth.logout(); }:null,
            "showDuration" : "300",
            "hideDuration" : "1000",
            "timeOut" : "5000",
            "extendedTimeOut" : "1000",
            "showEasing" : "swing",
            "hideEasing" : "linear",
            "showMethod" : "fadeIn",
            "hideMethod" : "fadeOut"
        };

        toastr.error(error, 'Error');
        var cx = ($(window).width() - 300) / 2;
        $('.toast-top-center').css({
            'left' : cx + 'px'
        });
    }

};

Explorer.INSTANCE = null;
Explorer.create = function(sessionId, serviceURL, folderService, microAppService, iconService, deploymentService, appLaunchService, eventBus) {
    Explorer.INSTANCE = new Explorer(sessionId, serviceURL, folderService, microAppService, iconService, deploymentService, appLaunchService, eventBus);
    return Explorer.INSTANCE;
};



