// Global configuration variables should be kept here.

const Conf = {
    SYNC_SERV_URL_UAT:  "https://nutshell-uat.appspot.com/api/v2/gcloudTable/data",
    SYNC_SERV_URL_PROD: "https://nutshell-apps-client-instances.appspot.com/api/v2/gcloudTable/data",
    SYNC_SERV_VERSIONS_URL: "https://nutshell-uat.appspot.com/api/v2/gcloudTable/versions",
    SYNC_SERV_VERSIONS_VERSION: "v1",
    SYNC_SERV_URL_IP:   "https://ip.nutshellapps.com/api/v1/table/data",
    SYNC_SERV_VERSION:  "v2",
    ASSET_MNG_URL_UAT:  "https://nutshell-apps-client-instances.appspot.com/api/v1/assets/process",
    ASSET_MNG_VERSION:  "v1",
    DS_COMPILE_URL_UAT: "https://asset-management-dot-nutshell-uat.appspot.com/api/v1/assets/process",
    DS_COMPILE_VERSION: "v1",
    CONTAINER_VERSION:  "2.0.0", // This placeholder is replaced by post_prepare hook with a value from config.xml
    DB_VERSION: 5 // aligns to v2.0.0
};
