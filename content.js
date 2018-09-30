var extid = chrome.runtime.id;
var doc = document.head || document.body;
//doc.setAttribute("data-superwebrequest-id", extid);
var meta=document.createElement("meta");
meta.setAttribute("name","superwebrequest");
meta.setAttribute("content",extid);
doc.appendChild(meta);