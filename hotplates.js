var fs = require('fs')
  , path = require('path')
  , readdirp = require('readdirp')
  , handlebars = require('handlebars')
  , oven = { }
  ;

function namespace(folders) {

    if (folders === '') return oven;

    var prefRemoved = folders
        .trim()
        .replace(/^\.\//,'')  // remove './' prefix
        .replace(/^\//, '')   // remove '/' prefix 
      , parts = prefRemoved.split('/')
      , parent = oven;

    for (var i = 0; i < parts.length; i++) {
        if (typeof parent[parts[i]] == 'undefined') {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
}

function process(opts, processFile, done) {
  if (!opts) done(null);
  else {
    if (!opts.fileFilter) opts.fileFilter = [ '*.hbs', '*.handlebars' ];

    readdirp(opts, function (err, entries) {

      if (err) done(err);
      else {
        var handlebarFiles = entries.files
          , tasks = handlebarFiles.length;

        if (tasks === 0) {
          done(null);
          return;
        }
        
        handlebarFiles
          .forEach(function (file) {
            fs.readFile(file.fullPath, function (err, plate) {
              if (err) done(err);
              else {
                processFile(file, plate);
                if (--tasks === 0) done(null);
              }
            });
          });
      }
    });
  }
} 

function processTemplates (opts, done) {
  process
    ( opts
    , function processFile(file, plate) {
        var plateName = file.name.substr(0, file.name.length - path.extname(file.name).length)
          , attachTo = namespace(file.parentDir);

        attachTo[plateName] = handlebars.compile(plate);
      }
    , done
    );
}

function processPartials (opts, done) {
  process
    ( opts
    , function processFile(file, plate) {
        var plateName = file.name.substr(0, file.name.length - path.extname(file.name).length)
          , attachTo = namespace(file.parentDir);

        attachTo[plateName] = handlebars.compile(plate);
      }
    , done
    );
}

function heat(opts, hot) {

  function continueWithPartials (err) {
    if (err) hot(err);
    else processPartials(opts.partials, hot);
  }

  if (!opts.templates && !opts.partials) 
    throw new Error('Need to either define "templates" or "partials" options.');

  processTemplates(opts.templates, continueWithPartials);
}

function burn() {
  Object.keys(handledbars).forEach(function (key) {
    delete handledbars[key];
  });
}

module.exports = {
    heat: heat
  , burn : burn
  , oven: oven
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
