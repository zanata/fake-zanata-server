var config = require('./js/configure-server')
    server = config.server,
    getJSON = require('./js/get-json')(__dirname + '/mocks');


var commaSeparatedNumeric = /^[0-9][0-9,]*$/;

// Thunks that will be executed to register endpoints (to allow order of actual
// registration to be manipulated.
var endpoints = [
  endpoint('/locales'),
  endpoint('/projects'),
  endpointWithAlias('/projects/p/tiny-project',
                    '/project/tiny-project'),
  endpointWithAlias('/projects/p/plurals-project',
                    '/project/plurals-project'),

  endpointWithAlias('/projects/p/tiny-project/iterations/i/1',
                    '/project/tiny-project/version/1'),
  endpointWithAlias('/projects/p/plurals-project/iterations/i/1',
                    '/project/plurals-project/version/1'),

  endpointWithAlias('/projects/p/tiny-project/iterations/i/1/r',
                    '/project/tiny-project/version/1/docs'),
  endpointWithAlias('/projects/p/plurals-project/iterations/i/1/r',
                    '/project/plurals-project/version/1/docs'),

  endpointWithAlias('/projects/p/tiny-project/iterations/i/1/r/hello.txt',
                    '/project/tiny-project/version/1/doc/hello.txt'),
  endpointWithAlias('/projects/p/plurals-project/iterations/i/1/r/plurals.txt',
                    '/project/plurals-project/version/1/doc/plurals.txt'),



  subEndpoints('/project/tiny-project/version/1/doc/hello.txt/status', ['/fr', '/en-US']),
  subEndpoints('/project/plurals-project/version/1/doc/plurals.txt/status', ['/fr', '/en-US']),

  subEndpoints('/project/tiny-project/permission', ['/fr', '/en-US']),
  subEndpoints('/project/plurals-project/permission', ['/fr', '/en-US']),

  subEndpoints('/source?ids=', ['1234', '1237', '1238', '4567', '4568', '4569']),
  endpoint('/source', {}, {}),
  endpoint('/source', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  subEndpoints('/trans/fr?ids=', ['1234', '1237', '4567', '4569']),
  // Initially no translation for this id, but overriden with put below.
  endpoint('/trans/fr?ids=1238', {}, {}),
  endpoint('/trans/fr', {}, {}),
  endpoint('/trans/fr', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/trans/fr', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  (function () {
    // The OPTIONS method is used for pre-check for any CORS request that could
    // cause changes on the server. Server must respond with allowed origin and
    // methods for the endpoint, or the PUT will not be attempted.
    server.createRoute({
      request: {
          url: '/trans/fr',
          method: 'options',
      },
      response: {
          code: 200,
          delay: config.latency,
          body: {},
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT'
          }
      }
    });
    var putEndpoint = server.put('/trans/fr')
                            .status(200)
                            .body({revision: 2, status: 'translated'})
                            .delay(config.latency);
    putEndpoint.creates.get('/trans/fr?ids=1238')
                       .status(200)
                       .body(getJSON('/trans/fr?ids=1238'))
                       .delay(config.latency);
    putEndpoint.creates.get('/source+trans/fr?ids=1238')
                       .status(200)
                       .body(getJSON('/source+trans/fr?ids=1238-with-trans'))
                       .delay(config.latency);
  }),

  subEndpoints('/source+trans/fr?ids=', ['1234', '1237', '1238', '4567', '4568', '4569']),
  endpoint('/source+trans/fr', {}, {}),
  endpoint('/source+trans/fr', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source+trans/fr', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  endpoint('/project/tiny-project/version/1/locales'),
  endpoint('/project/plurals-project/version/1/locales'),

  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt'),
  endpoint('/stats/proj/plurals-project/iter/1/doc/plurals.txt'),
  endpoint('/stats/project/tiny-project/version/1/doc/hello.txt/locale/en-US'),
  endpoint('/stats/project/tiny-project/version/1/doc/hello.txt/locale/fr'),
  endpoint('/stats/project/plurals-project/version/1/doc/plurals.txt/locale/en-US'),
  endpoint('/stats/project/plurals-project/version/1/doc/plurals.txt/locale/fr'),

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
 * @query Optional object detailing query string parameters to match. Object key
          is the key, and the value may be a plain value or a regular expression.
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
 * Create a thunk that registers multiple endpoints that use the same data.
 *
 * The path of the JSON file in the mock directory must be the same as the first
 * path argument.
 *
 * @path Local portion of endpoint path.
 * @aliasPath Alternative path that will return the same data as the first path.
 */
function endpointWithAlias(path, aliasPath) {
  return function () {
    endpoint(path)();
    endpoint(aliasPath, null, getJSON(path))();
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
