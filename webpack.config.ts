import BundleTracker from "webpack-bundle-tracker";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import WebpackAssetsManifest from "webpack-assets-manifest";
import path from "path";
import HtmlWebpackPlugin from 'html-webpack-plugin';

const OUTPUT_PATH = './dist/';

module.exports = (env: any, argv: any) => {
    const PUBLIC_PATH = argv.mode === 'production'
        ? "https://yoctoproject.github.io/bb-datastore-playground/" : "";

    const plugins = [
        new MiniCssExtractPlugin({
            filename: '[name]-[contenthash].css',
            chunkFilename: '[name]-[contenthash].css',
        }),
        new WebpackAssetsManifest({
            entrypoints: true,
        }),
        new BundleTracker({path: __dirname, filename: 'webpack-stats.json'}),
    ];

    if (argv.mode !== 'production') {
        new webpack.SourceMapDevToolPlugin({
            filename: 'sourcemaps/[file].map',
            publicPath: PUBLIC_PATH,
        });

        //plugins.push(new BundleAnalyzerPlugin());
    }

    return {
        context: __dirname,
        devtool: "source-map",
        entry: {
            'main': './src/index',
        },

        optimization: {
            splitChunks: {
                chunks: "all"
            }
        },

        output: {
            path: path.resolve(__dirname, OUTPUT_PATH),
            filename: "[name]-[contenthash].js",
            chunkFilename: "[name]-[contenthash].js",
            publicPath: PUBLIC_PATH,
        },

        plugins: [
            ...plugins,
            new webpack.ProgressPlugin(),
            new HtmlWebpackPlugin({
                filename: path.resolve(OUTPUT_PATH, "index.html"),
                template: "src/index.html.ejs"
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
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    include: path.resolve(__dirname, './node_modules/bootstrap-icons/font/fonts'),
                    type: "asset/inline",
                },
            ],
        },

        resolve: {
            modules: ['node_modules'],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },

        mode: "development",

        watchOptions: {
            aggregateTimeout: 2000,
        },
    }
}
