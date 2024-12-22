import BundleTracker from "webpack-bundle-tracker";
import webpack from "webpack";
import WebpackAssetsManifest from "webpack-assets-manifest";
import path from "path";
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import fs from "fs";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const OUTPUT_PATH = './dist/';

module.exports = (env: any, argv: any) => {
    const PUBLIC_PATH = argv.mode === 'production'
        ? "https://yoctoproject.github.io/bb-datastore-playground/" : "/";

    return {
        context: __dirname,
        devtool: "inline-source-map",
        entry: {
            'main': './src/main/index',
        },

        optimization: {
            runtimeChunk: 'single'
        },

        output: {
            path: path.resolve(__dirname, OUTPUT_PATH),
            filename: "[name]-[contenthash].js",
            chunkFilename: "[name]-[contenthash].js",
            publicPath: PUBLIC_PATH,
            environment: {
                dynamicImport: true,
                asyncFunction: true,
            },
        },

        plugins: [
            new WebpackAssetsManifest({
                entrypoints: true,
                writeToDisk: true,
            }),
            new BundleTracker({path: __dirname, filename: 'webpack-stats.json'}),
            new MiniCssExtractPlugin(),
            new webpack.ProgressPlugin(),
            new HtmlWebpackPlugin({
                filename: path.resolve(OUTPUT_PATH, "index.html"),
                template: "src/main/index.html.ejs"
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {from: path.resolve(__dirname, 'assets/'), to: 'assets'},
                    {from: path.resolve(__dirname, "404.html"), to: ""},
                ]
            }),
            new webpack.SourceMapDevToolPlugin({
                filename: 'sourcemaps/[file].map',
                publicPath: PUBLIC_PATH,
            })
        ],

        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: ['babel-loader']
                },
                {
                    test: /\.js$|jsx/,
                    exclude: /node_modules/,
                    use: ['babel-loader'],
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        'autoprefixer',
                                        {
                                            // Options for autoprefixer
                                        },
                                    ],
                                ],
                            },
                        },
                    }],
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        [
                                            'autoprefixer',
                                            {
                                                // Options for autoprefixer
                                            },
                                        ],
                                    ],
                                },
                            },
                        },
                        // Compiles Sass to CSS
                        "sass-loader",
                    ],
                },
                {
                    test: /\.svg$/,
                    use: ['@svgr/webpack'],
                }
            ],
        },

        resolve: {
            modules: ['node_modules'],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            alias: {
                'node-fetch': 'isomorphic-fetch',
            },
        },

        mode: "development",

        watchOptions: {
            aggregateTimeout: 2000,
        },

        externals: {
            pyodide: 'pyodide'
        },
        devServer: {
            historyApiFallback: {
                rewrites: [{ from: /\/bb-datastore-playground\/[^?]/, to: '/404.html' }],
            },
            open: "bb-datastore-playground",
            server: {
                type: "https",
                options: {
                    key: fs.readFileSync("cert.key"),
                    cert: fs.readFileSync("cert.crt"),
                    ca: fs.readFileSync("ca.crt"),
                },
            }
        }
    }
}
