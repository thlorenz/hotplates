var fs = require('fs')
  , path = require('path')
  , readdirp = require('readdirp')
  , handlebars = require('handlebars')
  , handledbars = { }
  ;

function namespace(folders) {

    if (folders === '') return handledbars;

    var prefRemoved = folders
        .trim()
        .replace(/^\.\//,'')  // remove './' prefix
        .replace(/^\//, '')   // remove '/' prefix 
      , parts = prefRemoved.split('/')
      , parent = handledbars;

    for (var i = 0; i < parts.length; i++) {
        if (typeof parent[parts[i]] == 'undefined') {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
}

function store(opts, cb) {
    var rdpOpts = {
        root            :  opts.templatesPath
      , directoryFilter :  opts.directories
      , fileFilter      :  [ '*.hbs', '*.handlebars' ]
      }
    ;

  readdirp(rdpOpts, function (err, entries) {

    if (err) cb(err);
    else {
      var handlebarFiles = entries.files
        , tasks = handlebarFiles.length;

      if (tasks === 0) {
        cb(null);
        return;
      }
      
      handlebarFiles
        .forEach(function (file) {
          fs.readFile(file.fullPath, function (err, plate) {
            if (err) cb(err);
            else {
              var plateName = file.name.substr(0, file.name.length - path.extname(file.name).length)
                , attachTo = namespace(file.parentDir);

              attachTo[plateName] = handlebars.compile(plate);
              if (--tasks === 0) cb(null);
            }
          });
        });
    }
  });
}

function reset() {
  Object.keys(handledbars).forEach(function (key) {
    delete handledbars[key];
  });
}

module.exports = {
    store: store
  , reset : reset
  , handledbars: handledbars
};

/*var opts = {
    templatesPath: path.join(__dirname, '../readarepo-zip', 'lib', 'templates')
  , directories: '!partials'
  };

store(opts, function (err) {
  if (err) console.log(err);
  else console.log(handledbars);
  
});
*/
