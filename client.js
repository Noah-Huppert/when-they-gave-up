function httpGet(url, cb) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            cb(xmlHttp.responseText);
        }
    };

    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

var projects = [];

httpGet("/projects", function(projects) {
    console.log(JSON.parse(projects));
});