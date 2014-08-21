var ApiMocker = require('apimocker');

var port = process.env.npm_config_port;

var apiMocker = ApiMocker.createServer()
  .setConfigFile('config.json')
  .start(port)
