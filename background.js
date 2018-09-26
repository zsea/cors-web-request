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
var origins = {}, allowHeaders = {};
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        var headers = details.requestHeaders;
        var origin = null;
        for (var i = 0; i < headers.length; i++) {
            if (headers[i].name == "Origin") {
                origin = headers[i].value;
                break;
            }
        }
        if (!origin) {
            for (var i = 0; i < headers.length; i++) {
                if (headers[i].name == "Referer") {
                    origin = headers[i].value.replace(/^(http(s{0,1}):\/\/.*?)\/.*$/ig, '$1');;
                    break;
                }
            }
        }
        if (origin) {
            origins[details.requestId] = origin;
        }
        var forceHeaders = [], originHeaders = [];
        headers.forEach(function (header) {
            //console.log(header.name);
            if (/^f\-.+?$/ig.test(header.name)) {
                forceHeaders.push({
                    name: header.name.replace(/^f\-/ig, ""),
                    value: header.value
                })
            }
            else {
                originHeaders.push({
                    name: header.name,
                    value: header.value
                })
            }
            if (header.name == "Access-Control-Request-Headers") {
                allowHeaders[details.requestId] = header.value;
            }
        });
        //console.log("fHeader",forceHeaders);
        forceHeaders.forEach(function (header) {
            setHeader(originHeaders, header.name, header.value);
        });
        //console.log("send",originHeaders,details);
        return { requestHeaders: originHeaders };

    },
    { urls: ['*://*/*'] },
    ["blocking", "requestHeaders"]
);
chrome.webRequest.onHeadersReceived.addListener(function (details) {
    setHeader(details.responseHeaders, "Access-Control-Allow-Origin", origins[details.requestId] || "*")
    setHeader(details.responseHeaders, "Access-Control-Allow-Credentials", "true");
    setHeader(details.responseHeaders, "Access-Control-Allow-Methods", "*");
    setHeader(details.responseHeaders, "Access-Control-Allow-Headers", allowHeaders[details.requestId] || "*");
    console.log("recive", details.responseHeaders, details);
    return { responseHeaders: details.responseHeaders, statusCode: 200 };
}, { urls: ['*://*/*'] }, ["blocking", "responseHeaders"]);