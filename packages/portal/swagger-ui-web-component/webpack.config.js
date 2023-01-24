const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = (env, { mode, analyze = false }) => {
  const production = mode !== 'development'

  return {
    target: 'web',
    mode: production ? 'production' : 'development',
    devtool: production ? false : 'eval',
    module: {
      rules: [
        {
          test: /.css$/i,
          use: [
            {
              loader: 'style-loader',
              options: {
                injectType: 'lazyStyleTag',
                // custom insert function that accepts a target element to append <style> tag into
                insert: function insertIntoTarget(element, options) {
                  const parent = options.target || document.head
                  parent.appendChild(element)
                },
              },
            },
            'css-loader',
          ],
        },
      ],
    },
    plugins: [
      new TerserPlugin({
        terserOptions: {
          compress: production,
        },
      }),
      ...analyze
        ? [
          new BundleAnalyzerPlugin(),
        ]
        : [],
    ],
    performance: {
      // SwaggerUI is a big boi
      maxAssetSize: 2 * 1024 * 1024, // 2 MiB
      maxEntrypointSize: 2 * 1024 * 1024, // 2 MiB
    },
    devServer: {
      port: 9000,
      static: {
        directory: path.join(__dirname, 'public'),
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
  }
}
