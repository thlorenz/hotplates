var path = require('path');

var camelCase = module.exports.camelCase = function (name) {
  return name
    .replace(/([\-_][a-z])/g, function( $1 ){ return $1.toUpperCase(); }) // uppercase all letters after - and _
    .replace(/[\-_]/g,''); // remove all - and _
};

var folderParts = module.exports.folderParts = function (folder) {
  var trimmed = folder.trim();

  if (trimmed === '') return [];

  var prefRemoved = trimmed
      .replace(/^\.\//,'')  // remove './' prefix
      .replace(/^\//, '')   // remove '/' prefix 
    , camelCased = camelCase(prefRemoved)
    ;

  return camelCased.split('/');
};

var namespace = module.exports.namespace = function (folder, root) {

    var parts = folderParts(folder)
      , parent = root;

    for (var i = 0; i < parts.length; i++) {
      var key = camelCase(parts[i]);
        if (typeof parent[ key ] == 'undefined') {
            parent[ key ] = { };
        }
        parent = parent[ key ];
    }
    return { root: parent, path: parts.join('.') };
};

var plateNameFrom =  module.exports.plateNameFrom = function (filename) {
  var nameWithoutExt = filename.substr(0, filename.length - path.extname(filename).length);
  return nameWithoutExt;
};
