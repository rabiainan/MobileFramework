const ConfigManager = (function () {

    let debug = false;
    let pullData = Conf.SYNC_SERV_URL_PROD;
    let clientTableVersionsUrl = Conf.SYNC_SERV_VERSIONS_URL;
    let _domain = null;
    let _user = null;
    let assetMngUrl = Conf.ASSET_MNG_URL_UAT;
    let dsCompile = Conf.DS_COMPILE_URL_UAT;
    let _sessionId = null;

    function init(domain, user, sessionId) {

        return new Promise(function(resolve, reject) {

            // To be used for error log
            let _data = null;

            ConfigRepo.get(domain).then(
                function (data) {
                    console.log(`ConfigManager: initialized with domain: ${domain}, user: ${user}, debugFlag: ${data.debugFlag}, pullTableDataUrlVersions: ${JSON.stringify(data.pullTableDataUrlVersions)}, assetsManagementUrlVersions: ${JSON.stringify(data.assetsManagementUrlVersions)}, clientTableVersionsUrlVersions: ${JSON.stringify(data.clientTableVersionsUrlVersions)}, dataStructureCompileUrlVersions: ${JSON.stringify(data.dataStructureCompileUrlVersions)}`);
                    _data = data;
                    debug = data['debugFlag'];
                    pullData = data['pullTableDataUrlVersions'][Conf.SYNC_SERV_VERSION];
                    clientTableVersionsUrl = data['clientTableVersionsUrlVersions'][Conf.SYNC_SERV_VERSIONS_VERSION];
                    assetMngUrl = data['assetsManagementUrlVersions'][Conf.ASSET_MNG_VERSION];
                    dsCompile = data['dataStructureCompileUrlVersions'][Conf.DS_COMPILE_VERSION];
                    _domain = domain;
                    _user = user;
                    _sessionId = sessionId;
                    resolve();
                }
            ).catch(function(error) {
                console.error("ConfigManager: Error getting configuration error", error);

                rLog.log({
                    _data: _data,
                }, "ConfigManager: Error getting configuration error 1/2", rLog.level.ERROR, [rLog.tag.CONFIG], {domain: domain, user: user, sessionId: sessionId});

                rLog.log({
                    error: error,
                }, "ConfigManager: Error getting configuration error 2/2", rLog.level.ERROR, [rLog.tag.CONFIG], {domain: domain, user: user});


                reject();
            });

        });
    }

    function domainToServiceUrl(domain) {
        if (!domain) {
            return null;
        } else  if (domain.match(/[a-z]/i)) {
            return  "https://" + domain + ".nutshellapps.com/eDocs-Services/";
        } else {
            // IP address. Assume running locally
            return "http://" + domain + ":8080/eDocs-Services/";
        }
    }

    return {
        init,
        domainToServiceUrl,
        get isDebug() {
            return debug;
        },
        get syncUrl() {
            return pullData;
        },
        get clientTableVersionsUrl() {
            return clientTableVersionsUrl;
        },
        get domain() {
            return _domain;
        },
        get user() {
            return _user;
        },
        get sessionId() {
            return _sessionId;
        },
        get assetMngUrl() {
            return assetMngUrl;
        },
        get dsCompileUrl() {
            return dsCompile;
        },
        get serviceUrl() {
            return domainToServiceUrl(_domain);
        }
    };

})();
