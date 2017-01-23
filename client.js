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

var troubles = document.getElementById("troubles");
var username = document.getElementById("username");
var repo = document.getElementById("repo");
var submit = document.getElementById("submit");
var msg = document.getElementById("msg");

function compare(a, b) {
    var aDate = new Date(a.commit.date);
    var bDate = new Date(b.commit.date);

    if (aDate < bDate) {
        return -1;
    } else if (aDate > bDate) {
        return 1;
    }

  return 0;
}

submit.onclick = function() {
    httpGet("/troubles/" + username.value + "/" + repo.value, function(projects) {
        troubledCommits = JSON.parse(projects);
        troubledCommits.sort(compare);

        if (troubledCommits.length !== 0) {
            msg.innerHTML = "<span>Looks like \"" + username.value + "\" has a bit of trouble when developing \"" + repo.value + "\":</span>";
        } else {
            msg.innerHTML = "<span>I'm sure \"" + username.value + "\" had trouble developing \"" + repo.value + "\" but I couldn't find any hard moments.</span>";
        }

	var out = "";

        for (var i = 0; i < troubledCommits.length; i++) {
            var commit = troubledCommits[i];
            var date = new Date(commit.commit.date);

            out += "<li><a href=\"" + commit.commit.url + "\">" + (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ": <b>" + commit.commit.message + "</b></a></li>";
        }

	troubles.innerHTML = out;
    });
};
