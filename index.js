var config = require('./js/configure-server')
    server = config.server,
    getJSON = require('./js/get-json')(__dirname + '/mocks'),
    bigProjectDataPath = __dirname + '/mocks/data/big-project',
    fs = require('fs');


var commaSeparatedNumeric = /^[0-9][0-9,]*$/;
var tinyProjectHelloTxtPath = '/projects/p/tiny-project/iterations/i/1/r/hello.txt';

var projectPath = __dirname + '/mocks/projects';
var bigProjectPath = projectPath + '/p/big-project';
var bigProjectVersionPath = bigProjectPath + '/iterations/i/1';
var bigProjectDocsPath = bigProjectVersionPath + '/r';
var bigProjectStatesPath = bigProjectDocsPath + '/chapter1.txt/states';

initBigProjectData();

function initBigProjectData() {
  fs.readFile(bigProjectDataPath + '/transUnits.json', "utf8", function(err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    var transUnits = {};
    data = JSON.parse(data);
    for (var id in data) {
      transUnits[id] = data[id];
    }
    createBigProjectStates('de', transUnits);
    createBigProjectStates('fr', transUnits);

    createDocuments(transUnits);
  });
}

function createBigProjectStates(localeId, transUnits) {
  var fileName = localeId + '.json';
  var data = [];

  for (var id in transUnits) {
    data.push({
      "id": id,
      "resId": transUnits[id]['source'].resId,
      "state": transUnits[id][localeId] ? transUnits[id][localeId].state : 'Untranslated'
    });
  }
  fs.writeFile(bigProjectStatesPath + '/' + fileName, JSON.stringify(data), {overwrite: true}, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("created file: " + bigProjectStatesPath + '/' + fileName);
    }
  });
}

function createBigProjectDocuments(transUnits) {

  fs.createReadStream(bigProjectDocsPath + 'r.json').pipe(fs.createWriteStream(bigProjectDataPath + '/documents.json'));

  fs.readFile(dataPath + '/documents.json', "utf8", function(err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    data = JSON.parse(data);
    for (var index in data) {
      var fileData = data[index];

      var fileName = fileData['name'] + '.json';
      fileData['textFlows'] = [];

      for(var id in transUnits) {
        var source = transUnits[id]['source'];
        source['id'] = id;
        delete source['resId'];
        fileData['textFlows'].push(source);
      }

      fs.writeFile(bigProjectDocsPath + '/' + fileName, JSON.stringify(fileData), {overwrite: true}, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("created file: " + bigProjectDocsPath + '/' + fileName);
        }
      });
    }
  });
}

// Thunks that will be executed to register endpoints (to allow order of actual
// registration to be manipulated.
var endpoints = [
  endpoint('/locales'),
  endpoint('/projects'),
  subEndpoints('/projects/p', ['/tiny-project', '/big-project']),

  endpoint('/projects/p/tiny-project/iterations/i/1/r'),
  endpoint('/projects/p/big-project/iterations/i/1/r'),

  subEndpoints('/projects/p/tiny-project/iterations/i/1/r', ['/hello.txt']),
  subEndpoints('/projects/p/big-project/iterations/i/1/r', ['/chapter1.txt']),

  subEndpoints('/projects/p/tiny-project/iterations/i/1/r/hello.txt/states', ['/fr', '/en-us']),
  subEndpoints('/projects/p/big-project/iterations/i/1/r/chapter1.txt/states', ['/fr', '/de']),

  subEndpoints('/source?ids=', ['1234', '1237', '1238', '1500', '1501', '1502']),
  endpoint('/source', {}, {}),
  endpoint('/source', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  subEndpoints('/trans/fr?ids=', ['1234', '1237', '1500', '1501']),
  // Initially no translation for this id, but overriden with put below.
  endpoint('/trans/fr?ids=1238', {}, {}),
  endpoint('/trans/fr', {}, {}),
  endpoint('/trans/fr', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/trans/fr', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  subEndpoints('/trans/de?ids=', ['1500', '1501']),
  endpoint('/trans/de', {}, {}),
  endpoint('/trans/de', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/trans/de', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  (function () {
    // The OPTIONS method is used for pre-check for any CORS request that could
    // cause changes on the server. Server must respond with allowed origin and
    // methods for the endpoint, or the PUT will not be attempted.
    server.createRoute({
      request: {
          url: '/trans/fr',
          method: 'options'
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
                            .body({revision: 2, state: 'translated'})
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

  subEndpoints('/source+trans/fr?ids=', ['1234', '1237', '1238', '1501', '1502', '1503']),
  endpoint('/source+trans/fr', {}, {}),
  endpoint('/source+trans/fr', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source+trans/fr', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  subEndpoints('/source+trans/de?ids=', ['1500', '1501', '1502']),
  endpoint('/source+trans/de', {}, {}),
  endpoint('/source+trans/de', { ids: commaSeparatedNumeric }),
  badRequestEndpoint('/source+trans/de', {ids: /.*/},
    {error: 'query param "ids" must be a comma-separated list of numbers'}),

  endpoint('/projects/p/tiny-project/iterations/i/1/locales'),
  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt'),
  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt/locale/en-us'),
  endpoint('/stats/proj/tiny-project/iter/1/doc/hello.txt/locale/fr'),

  endpoint('/projects/p/big-project/iterations/i/1/locales'),
  endpoint('/stats/proj/big-project/iter/1/doc/chapter1.txt'),
  endpoint('/stats/proj/big-project/iter/1/doc/chapter1.txt/locale/de'),
  endpoint('/stats/proj/big-project/iter/1/doc/chapter1.txt/locale/fr'),

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
