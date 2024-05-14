"use strict";

// TODO: not being used, adding to git to keep it safe

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var PythonHighlightRules = require("./python_highlight_rules").PythonHighlightRules;

var ShHighlightRules = function() {
    const bitbakeIdentifierRegex = /[\w_][\w\.\-\+\{\}\$:]*/;

    this.$rules = {
        "start" : [
            {
                // Comment - don't bother handling line continuation in comments
                token: "comment",
                regex: "#(.*)$",
                next: "start"
            },
            {
                // Varflag
                token: ["paren.lparen", "constant.character", "paren.rparen"],
                regex: /(\[)([-\w_+.]+)(\])/
            },
            {
                // python task
                token: "keyword",
                regex: /python(?=\s|\()/,
                next: "python_task",
            },
            {
                // fakeroot task
                token: "keyword",
                regex: /fakeroot(?=\s)/,
                next: "shell_task",
            },
            {
                // def
                token: "keyword",
                regex: "def",
                next: "python-def-start",
            },
            {
                token: "variable",
                regex: "W",

            }
        ],
        "python_task": [
            {
                token: "keyword",
                regex: /fakeroot(?=\s)/
            },
            {
                token: "entity.function",
                regex: bitbakeIdentifierRegex,
            },
            {
                token: "paren.lparen",
                regex: /\(/,
                push: [{
                    token: "paren.rparen",
                    regex: /\)/,
                    next: "pop",
                }]
            },
            {
                token: "paren.lparen",
                regex: /\{/,
                next: "python-start",
            }
        ],
        "shell_task": [
            {
                token: "entity.function",
                regex: bitbakeIdentifierRegex,
            },
            {
                token: "paren.lparen",
                regex: /\(/,
                push: [{
                    token: "paren.rparen",
                    regex: /\)/,
                    next: "pop",
                }]
            },
        ]
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
            token: "text",
            // A Python def function ends on the first non-indented line
            regex: /^(?=[^\s])/,
            next: "start"
        }
    ]);
    this.normalizeRules();
};

oop.inherits(ShHighlightRules, TextHighlightRules);

exports.ShHighlightRules = ShHighlightRules;

