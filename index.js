var config = require('./js/configure-server')
    server = config.server,
    getJSON = require('./js/get-json')(__dirname + '/mocks');


var endpoints = [
  '/projects',
  '/projects/p/tiny-project',
  '/projects/p/tiny-project/iterations/i/1',
  '/projects/p/tiny-project/iterations/i/1/r',
  '/projects/p/tiny-project/iterations/i/1/r/hello'
]

endpoints.forEach(createPathWithMockFile);
server.listen(config.port);
console.log();
config.logDetails();


/**
 * Create a GET endpoint using a JSON file as the body.
 *
 * The path of the JSON file in the mock directory must be the same as
 * the path of the resource on the REST endpoint.
 */
function createPathWithMockFile(path) {
  server.get(path)
        .body(getJSON(path))
        .delay(config.latency);
  console.log('registered path %s', path);
}
