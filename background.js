/***跨域请求处理***/
function setHeader(headers, name, value) {
    for (var i = 0; i < headers.length; ++i) {
        if (headers[i].name === name) {
            headers[i].value = value;
            return;
        }
    }
    headers.push({
        name: name,
        value: value
    });
    return;
}
/**
 * 获取指定的header
 * @param {Array} headers - header集合
 * @param {string} name - header名称
 */
function getHeader(headers, name) {
    for (var i = 0; i < headers.length; ++i) {
        if (headers[i].name === name) {
            return headers[i].value;
        }
    }
}
/**
 * 是否简单请求
 * @param {object} details - 请求数据
 */
function isSimpleRequest(details) {
    if (!["HEAD", "GET", "POST"].includes(details.method)) {
        return false;
    }
    var ContentType = null;
    for (var i = 0; i < details.requestHeaders.length; i++) {
        if (!["Accept", "Accept-Language", "Content-Language", "Last-Event-ID", "Content-Type"].includes(details.requestHeaders[i].name)) {
            return false;
        }
        if (details.requestHeaders[i].name == "Content-Type") {
            ContentType = details.requestHeaders[i].value;
        }
    }
    if (!["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"].includes(ContentType)) {
        return false;
    }
    return true;
}
/**
 * 是否预检请求
 * @param {object} details 
 */
function isPreflightRequest(details) {
    return details.method == "OPTIONS";
}
var corsHeaders = {};
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        if (details.type != "xmlhttprequest") return {};
        var origin = getHeader(details.requestHeaders, "Origin");
        if (!origin) return {};
        //console.log(details);
        var acHeaders = [{
            name: "Access-Control-Allow-Credentials",
            value: "true"
        }, {
            name: "Access-Control-Allow-Origin",
            value: origin
        }];
        var is_options = isPreflightRequest(details);
        //var is_simple_request = isSimpleRequest(details);
        if (is_options) {
            var request_method = getHeader(details.requestHeaders, "Access-Control-Request-Method");
            if (!request_method) return {};
            var request_header = getHeader(details.requestHeaders, "Access-Control-Request-Headers");

            acHeaders.push({
                name: "Access-Control-Allow-Methods",
                value: request_method
            });
            if (request_header) {
                acHeaders.push({
                    name: 'Access-Control-Allow-Headers',
                    value: request_header
                })
            }
        }
        else {
            //修改header
            var forceHeaders = [], originHeaders = [];
            details.requestHeaders.forEach(function (header) {
                if (/^f\-.+?$/ig.test(header.name)) {
                    forceHeaders.push({
                        name: header.name.replace(/^f\-/ig,""),
                        value: header.value
                    })
                }
                else {
                    originHeaders.push({
                        name: header.name,
                        value: header.value
                    })
                }
            });
            //console.log(forceHeaders);
            forceHeaders.forEach(function (header) {
                //console.log("send set name",header.name,header.value)
                setHeader(originHeaders, header.name, header.value);
                //console.log("====send set name",header.name,header.value)
            });
        }
        corsHeaders[details.requestId] = acHeaders;
        //console.log("send",details.requestId,acHeaders);
        return { requestHeaders: originHeaders || details.requestHeaders };

    },
    { urls: ['*://*/*'] },
    ["blocking", "requestHeaders"]
);
chrome.webRequest.onHeadersReceived.addListener(function (details) {
    if (!corsHeaders[details.requestId]) return {};
    //console.log("change",details.requestId, corsHeaders[details.requestId]);
    corsHeaders[details.requestId].forEach(function (header) {
        //console.log("set name",header.name, header.value)
        setHeader(details.responseHeaders, header.name, header.value)
        //console.log("set name completed",header.name, header.value)
    })
    delete corsHeaders[details.requestId];
    return { responseHeaders: details.responseHeaders };
}, { urls: ['*://*/*'] }, ["blocking", "responseHeaders"]);
/*
chrome.webRequest.onBeforeRequest.addListener(function (details) {
    //console.log(details)
    if (details.url == "https://zsea.github.io/super-web-request/getmanifest") {
        console.log(details);
        var mainfest = chrome.runtime.getManifest();

        mainfest = JSON.stringify(mainfest);
        mainfest = encodeURIComponent(mainfest);
        mainfest = btoa(mainfest);
        //details.url = "data:text/plain;charset=UTF-8;base64," + mainfest;
        return { redirectUrl: "data:text/plain;charset=UTF-8;base64," + mainfest };
    }
}, { urls: ["<all_urls>"] },
    ["blocking"]);*/

/***功能 */
const actionsMap = {
    "chrome.cookies.get": chrome.cookies.get,
    "chrome.cookies.getAll": chrome.cookies.getAll
};
//console.log(actionsMap);
/***页面通信 */
chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
    var args = message.args;
    args.push(sendResponse);
    var action = message["action"];
    //console.log(args);
    if (actionsMap[action]) {
        actionsMap[action].apply(null, args);
        return true;
    }
    else {
        throw new Error("not support action.")
    }

});



