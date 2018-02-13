// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import baseConfigFactory from './webpack.config';

export default (env = {}) => (baseConfig => ({
  ...baseConfig,
  devtool: 'source-map',
  plugins: [
    ...baseConfig.plugins,
    new UglifyJsPlugin({
      sourceMap: true,
      uglifyOptions: {
        compress: false,
      },
    }),
  ],
}))(baseConfigFactory(env));
