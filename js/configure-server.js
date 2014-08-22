var Interfake = require('interfake');

var port = process.env.npm_config_port || 7878;
var path = process.env.npm_config_path || 'zanata/rest';

/**
 * Returns value as an int only if it is a finite integer with no extra
 * characters, otherwise the value is returned unchanged.
 */
function parseIntIfInt (value) {
  if(/^(\-|\+)?([0-9]+)$/.test(value))
    return Number(value);
  return value;
}

function valueOrDefault(value, def) {
  return value === undefined ? def : value;
}
var DEFAULT_LATENCY = '50..500'
var latency = valueOrDefault(parseIntIfInt(process.env.npm_config_latency), DEFAULT_LATENCY);


var options = {
  path: path
}

var interfake = new Interfake(options);

function logDetails () {
  console.log('REST endpoint listening at http://localhost:%d/%s, with latency %s', port, path, latency);
}

module.exports = {
  server: interfake,
  latency: latency,
  port: port,
  logDetails: logDetails
}