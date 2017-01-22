var path = require("path");

var jsonfile = require("jsonfile");
var express = require("express");
var osmosis = require("osmosis");
var github = require("octonode");
var request = require("request");

var client = github.client();
var app = express();

// Gather project list
var projects = [];
var users = [];

function parsePage (page) {
    osmosis
        .get("https://pennapps-xv.devpost.com/users?page=" + page)
        .find("#users > ul > li > div > div.large-11.small-10.columns > ul.participant-summary > li.participant-name > strong > a")
        .set("name")
        .follow("@href")
        .find("#portfolio-user-links > li > a:contains(\"GitHub\")@href")
        .set("ghUrl")
        .data(function(data) {
            users.push(data);
        });
}

var interval = setInterval(function() {
    console.log("checking user count: " + users.length);

    if (users.length === 191) {
        clearInterval(interval);
        console.log("Critical length, witting...");

        jsonfile.writeFile("users.json", users, function (err) {
            console.error("Write error: " + err);
        });
    }
}, 5000);

function parseUser (user) {
    // Get username
    var ghUrlParts = user.ghUrl.split("/");
    user.ghUsername = ghUrlParts[ghUrlParts.length - 1];

    var ghUser = client.user(user.ghUsername);
        ghUser.events(function(err, resp, body) {
    });
}

var runningDelay = 0;

// Max pages is 23 (But maybe 22 b/c 23 didn't have shit)
for (var i = 0; i < 23; i++) {
    var delay = Math.floor(Math.random() * 3000) + 1000;
    runningDelay += delay;

    console.log("Page " + (i + 1) + " " + runningDelay);

    setTimeout(function() {
        var pageNumber = JSON.stringify(i + 1);
        parsePage(i + 1);
        console.log("    Running " + pageNumber);
    }, runningDelay);
}

app.get("/", function(req, res) {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get("/client.js", function(req, res) {
    res.sendFile(path.resolve(__dirname, 'client.js'));
});

app.get("/projects", function(req, res) {
    res.json(projects);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on :" + port);
});