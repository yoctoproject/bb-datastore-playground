"use strict";

// TODO: not being used, adding to git to keep it safe

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var PythonHighlightRules = require("./python_highlight_rules").PythonHighlightRules;

var ShHighlightRules = function() {
    this.$rules = {
        "start" : [
            {
                token: "comment",
                regex: "#(.*)$",
                next: "start"
            },
            {
                token: "keyword",
                regex: "\\Wfakeroot\\W",
            },
            {
                token: "keyword",
                regex: "\\Winherit|require|include|addtask|deltask|addhandler|EXPORT_FUNCTIONS\\W",
                next: "directive"
            },
            {
                token: "keyword",
                regex: "export",
                next: "export"
            },
            {
                token: "keyword",
                regex: "unset",
                next: "unset"
            },
            {
                token: "keyword",
                regex: "python",
                next: "python-start"
            },
            {
                token: "keyword",
                regex: "def",
                next: "python-def-start",
            },
        ],

        "directive": [
            {
                token: "keyword",
                regex: "\\Wafter|before\\W"
            },
            {
                token: "text",
                regex: "^$",
                next: "start",
            },{
                token: "constant.language.escape",
                regex: /\\$/,
                next: "directiveContinuation"
            },
            {
                token: "text",
                regex: "$",
                next: "start",
            },
            {
                defaultToken: "text"
            }
        ],

        "directiveContinuation": [
            {
                token: "text",
                regex: "^$",
                next: "start",
            },
            {
                token: "constant.language.escape",
                regex: /\\$/,
            },
            {
                defaultToken: "text"
            }
            ],
        "include": [{
            token: "constant.other",
            regex: ".+",
            next: "start"
        }],
        "export": [{
            token: "constant.other",
            regex: "([a-zA-Z0-9\\-_+.${}/~]+)$",
            next: "start"
        }],
        "unset": [{
            token: "constant.other",
            regex: "([a-zA-Z0-9\\-_+.${}/~]+)$",
            next: "start"
        }]
    };

    this.embedRules(PythonHighlightRules, "python-", [
        {
            token: "paren.rparen",
            regex: "^}$",
            next: "start"
        }
    ]);


    this.embedRules(PythonHighlightRules, "python-def-", [
        {
            token: "keyword.other", // TODO?
            regex: "^$",
            next: "start"
        }
    ]);

    this.normalizeRules();
};

oop.inherits(ShHighlightRules, TextHighlightRules);

exports.ShHighlightRules = ShHighlightRules;

