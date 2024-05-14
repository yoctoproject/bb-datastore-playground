"use strict";

// TODO: not being used, adding to git to keep it safe

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var PythonHighlightRules = require("./python_highlight_rules").PythonHighlightRules;

var ShHighlightRules = function() {
    this.$rules = {
        "start" : [
            {
                // Comment - don't bother handling line continuation in comments
                token: "comment",
                regex: "#(.*)$",
                next: "start"
            },
            {
                token: "keyword",
                regex: "def",
                next: "python-def-start",
            },
            {
                token: "variable",
                regex: "W",
            }
        ],
    };

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

