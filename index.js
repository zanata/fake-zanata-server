var config = require('./js/configure-server')
    server = config.server,
    getJSON = require('./js/get-json')(__dirname + '/mocks');


var commaSeparatedNumeric = /^[0-9][0-9,]*$/;
var tinyProjectHelloTxtPath = '/projects/p/tiny-project/iterations/i/1/r/hello.txt';

// Thunks that will be executed to register endpoints (to allow order of actual
// registration to be manipulated.
var endpoints = [
  extendingEndpoints(
    '/projects', '/p/tiny-project', '/iterations/i/1', '/r', '/hello.txt', '/states/fr'),

  subEndpoints('/source?ids=', ['1234', '1237', '1238']),
  endpoint('/source', {}, {}),
  endpoint('/source', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  subEndpoints('/trans/fr?ids=', ['1234', '1237']),
  endpoint('/trans/fr', {}, {}),
  endpoint('/trans/fr', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/trans/fr', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  subEndpoints('/source+trans/fr?ids=', ['1234', '1237', '1238']),
  endpoint('/source+trans/fr', {}, {}),
  endpoint('/source+trans/fr', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source+trans/fr', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  endpoint('/projects/p/tiny-project/iterations/i/1/locales'),
  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt'),
  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt/locale/en-us'),
  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt/locale/fr'),

  endpoint('/user'),
  endpoint('/user/professor-x'),
  endpoint('/user/wolverine')
];


// Later-registered paths take precedence, so paths are registered in reverse
// order so we can reason about the above list from top to bottom.
endpoints.reverse().forEach(evaluate);
server.listen(config.port);
console.log();
config.logDetails();

/**
 * Evaluate a thunk.
 */
function evaluate (f) {
  return f();
}


/**
 * Make a thunk that registers an endpoint when evaluated.
 *
 * When no body is provided, the path of the JSON file in the mock directory
 * must be the same as the path of the resource on the REST endpoint, or there
 * will be an error trying to access a file that does not exist.
 *
 * @path Local portion of endpoint path.
 * @query Optional object detailing query string parameters to match. Object key is
 *        the key, and the value may be a plain value or a regular expression.
 * @body Optional object to return as the body. If excluded, the file at the
 *       given @path will be used.
 */
function endpoint(path, query, body) {
  return function () {
    body = body || getJSON(path);
    createEndpointFromObject(path, query, body);
    console.log('  registered path %s', path);
  }
}

/**
 * Create a thunk that will build up endpoints from an ordered set of path
 * segments, registering the endpoints at all stages along the way.
 *
 * Each endpoint must have a corresponding JSON file in the mocks directory.
 */
function extendingEndpoints() {
  var segments = Array.prototype.slice.call(arguments, 0);
  return function () {
    var path = '';
    segments.forEach(function (pathSegment) {
      path = path + pathSegment;
      createEndpointFromPath(path);
      console.log('  registered path %s', path);
    });
  }
}

/**
 * Create a thunk to make a set of endpoints with a common prefix.
 *
 * The prefix is prepended to each suffix to make each path.
 *
 * Each endpoint must have a corresponding JSON file in the mocks directory.
 */
function subEndpoints(prefix, suffixes) {
  return function () {
    Array.prototype.forEach.call(suffixes, function (suffix) {
      var path = prefix + suffix;
      createEndpointFromPath(path);
      console.log('  registered path %s', path);
    });
  }
}

/**
 * Create a thunk that registers an endpoint that responds with BAD REQUEST status.
 */
function badRequestEndpoint(path, query, body) {
  return function () {
    body = body || getJSON(path);
    createEndpointFromObject(path, query, body).status(400);
    console.log('  registered error path %s', path);
  }
}

/**
 * Registers an endpoint using the file at the given path as the response body.
 *
 * If filePath is not provided, path will be used as the file location.
 */
function createEndpointFromPath(path, query, filePath) {
  filePath = filePath || path;
  return createEndpointFromObject(path, query, getJSON(filePath));
}

/**
 * Registers an endpoint using the given response body.
 */
function createEndpointFromObject(path, query, body) {
  return server.get(path)
               .query(query)
               .body(body)
               .delay(config.latency);
}
