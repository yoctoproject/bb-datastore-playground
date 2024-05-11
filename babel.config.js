'use strict';

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                useBuiltIns: 'entry',
                corejs: 3, // or 2, but 3 is recommended
                targets: "fully supports es6-module-dynamic-import", // Example: browsers with >0.25% market share and not end-of-life
            },
        ],
        ["@babel/preset-react", {"runtime": "automatic"}],
        "@babel/preset-typescript"
    ],
};
