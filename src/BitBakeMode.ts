import ace from "ace-builds";
import "ace-builds/esm-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-sh";

//ace.config.set('basePath', '/assets/ace-builds/src-noconflict')

const TextHighlightRules = ace.require('ace/mode/text_highlight_rules').TextHighlightRules;
const TextMode = ace.require("ace/mode/text").Mode

const ShHighlightRules = ace.require("ace/mode/sh_highlight_rules").ShHighlightRules;
const PythonHighlightRules = ace.require("ace/mode/python_highlight_rules").PythonHighlightRules;

export class BitBakeHighlightRules extends TextHighlightRules {
    constructor() {
        super();
        const bitbakeIdentifierRegex = /[\w_][\w.\-+{}$:]*/;

        this.$rules = {
            "start" : [
                {
                    // Comment - don't bother handling line continuation in comments
                    token: "comment",
                    regex: "#(.*)$",
                    next: "start"
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
                    // addhandler, addtask, deltask, EXPORT_FUNCTIONS
                    token: "keyword",
                    regex: /(?:addhandler|addtask|deltask|EXPORT_FUNCTIONS)(?=\s)/,
                    next: "directive",
                },
                {
                    token: "keyword",
                    regex: /(?:inherit|require|include)(?=\s)/,
                    next: "unquoted_value",
                },
                {
                    token: "variable",
                    regex: bitbakeIdentifierRegex,
                    next: "task_or_variable",
                }
            ],
            "task_or_variable": [
                {
                    token: "keyword.operator",
                    regex: /=|\?{1,2}=|=\+|\+=|:=|=:/,
                },
                {
                    // Varflag
                    token: ["paren.lparen", "constant.character", "paren.rparen"],
                    regex: /(\[)([-\w_+.]+)(])/
                },
                {
                    token: "string",
                    regex: /".*"$/,
                    next: "start",
                },
                {
                    token: "string",
                    regex: /'.*'$/,
                    next: "start",
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
                    next: "sh-start",
                }
            ],
            "directive": [
                {
                    token: "keyword",
                    regex: /(?:after|before)(?=\s)/,
                },
                {
                    token: "text",
                    regex: bitbakeIdentifierRegex,
                },
                {
                    // TODO: handle line continuations
                    token: "text",
                    regex: /$/,
                    next: "start",
                }
            ],
            "unquoted_value": [
                {
                    token: ["text", "constant.language.escape"],
                    regex: /(.+?)(\\)$/,
                },
                {
                    token: "text",
                    regex: /.+$/,
                    next: "start",
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
                {
                    token: "paren.lparen",
                    regex: /\{/,
                    next: "sh-start",
                }
            ]
        };

        this.embedRules(PythonHighlightRules, "python-", [
            {
                token: "paren.rparen",
                regex: "^}$",
                next: "start"
            }
        ]);

        this.embedRules(ShHighlightRules, "sh-", [
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

        //this.normalizeRules();
    }
}

export default class BitBakeMode extends TextMode {
    constructor() {
        super();
        this.HighlightRules = BitBakeHighlightRules;
    }
}