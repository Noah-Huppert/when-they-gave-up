var path = require("path");

var jsonfile = require("jsonfile");
var express = require("express");
var github = require("octonode");
var request = require("request");

var client = github.client();
var app = express();

// Vocabs
var swears = ["fuck", "fucker", "fucking", "shit", "dammit", "cunt", "bitch", "ass", "taint", "crap"]
var unsure = ["maybe", "no", "yes", "why", "help"];

function matches (toTest, source) {
    toTest = toTest.split(" ");

    var matches = 0;

    for (var i = 0; i < toTest.length; i++) {
        var test = toTest[i];
        if (source.indexOf(test) !== -1) {
            matches++;
        }
    }

    return matches;
}

function _group (arr, target, commit) {
    var deltaCounts = [
        target.counts.swears - commit.counts.swears,
        target.counts.unsure - commit.counts.unsure
    ];

    var similar = false;

    for (var i = 0; i < deltaCounts.length; i++) {
        var dc = deltaCounts[i];
        if (dc > -3) {
            arr.push(commit);
            similar = true;
        }
    }

    return similar;
}

function groupSimilarSequential (commits, targetCommit, index) {
    if (targetCommit.counts.swears === 0 && targetCommit.counts.unsure === 0) {
        return [[], -1];
    }

    var beforeGroup = [];
    var afterGroup = [];

    for (var i = index; i > 0; i--) {
        var res = _group(beforeGroup, commits[i], targetCommit);
        if (res === false) {
            break;
        }
    }

    for (var i = index; i < commits.length; i++) {
        var res = _group(afterGroup, commits[i], targetCommit);
        if (res === false) {
            break;
        }
    }

    var group = [];

    for (var i = 0; i < beforeGroup.length; i++) {
        group[i] = beforeGroup[i];
    }

    var targetCommitIndexInGroup = group.length;
    group[targetCommitIndexInGroup] = targetCommit;

    for (var i = 0; i < afterGroup.length; i++) {
        group[targetCommitIndexInGroup + 1 + i] = afterGroup[i];
    }

    return [group, targetCommitIndexInGroup];
}

function parseRepo (username, repo, cb) {
    var ghRepo = client.repo(username + "/" + repo);
    ghRepo.commits(function(err, ghCommits) {
        var commits = [];

        for (var i = 0; i < ghCommits.length; i++) {
            commit = ghCommits[i];
            commit = {
                sha: commit.sha,
                date: commit.commit.author.date,
                message: commit.commit.message,
                user: commit.author.login,
                url: commit["html_url"],
                counts: {},
                repeats: {}
            };

            commit.counts.swears = matches(commit.message, swears);
            commit.counts.unsure = matches(commit.message, unsure);

            commits.push(commit);
        }

        var troubledCommits = [];

        for (var i = 0; i < commits.length; i++) {
            var commit = commits[i];

            var groupRes = groupSimilarSequential(commits, commit, i);
            var group = groupRes[0];
            var index = groupRes[1];

            if (index != -1) {
                troubledCommits.push({
                    commit: commit,
                    group: group,
                    index: index
                });
            }
        }

        cb(troubledCommits)
    });
}


app.get("/", function(req, res) {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get("/client.js", function(req, res) {
    res.sendFile(path.resolve(__dirname, 'client.js'));
});

app.get("/troubles/:username/:repo", function(req, res) {
    parseRepo(req.params.username, req.params.repo, function(troubledCommits) {
        res.json(troubledCommits);
    });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on :" + port);
});