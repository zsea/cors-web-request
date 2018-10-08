Allows to you request any site with ajax from any source. 

if you use fetch,you can send cookies.

Add response header list:

* Access-Control-Allow-Origin
* Access-Control-Allow-Credentials
* Access-Control-Allow-Methods
* Access-Control-Allow-Headers

# How read cookie

Extension provide api read cookie from any site.

```javascript
chrome.runtime.sendMessage("{extensionid}",{action:"chrome.cookies.get/chrome.cookies.getAll",args:[{}]},function(){});
```

about detail arguments,you can read doc from chrome extension document.

# How customize Referer/User-Agent

Send a request,you can add header ```f-Referer``` or ```f-User-Agent```.

If header name match ```f-*``` success,```f-``` will be remove.

# Know issue

If server response code is not 200 with OPTIONS request,extension will not work.