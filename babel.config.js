'use strict';

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                corejs: 3, // or 2, but 3 is recommended
                targets: "fully supports es6-module-dynamic-import", // Example: browsers with >0.25% market share and not end-of-life
            },
        ],
        ["@babel/preset-react", {"runtime": "automatic"}],
        "@babel/preset-typescript"
    ],
    plugins: [
        "@babel/plugin-syntax-dynamic-import"
    ]
};
