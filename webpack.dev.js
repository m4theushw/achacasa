const merge = require('webpack-merge');
const common = require('./webpack.common');
const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = merge(common, {
  mode: 'development',
  watch: true,
  plugins: [new LiveReloadPlugin()],
});
