var fs = require('fs');

module.exports = function (basePath) {
  return function (localPath) {
    var path = basePath + localPath + '.json';
    return JSON.parse(fs.readFileSync(path));
  };
};
