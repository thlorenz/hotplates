var fs            =  require('fs')
  , path          =  require('path')
  , readdirp      =  require('readdirp')
  , handlebars    =  require('handlebars')
  , oven          =  { }
  , templateFiles =  [ ]
  , partialFiles  =  [ ]
  ;

function folderParts (folder) {
  var trimmed = folder.trim();

  if (trimmed === '') return [];

  var prefRemoved = trimmed
      .replace(/^\.\//,'')  // remove './' prefix
      .replace(/^\//, '')   // remove '/' prefix 
    ;

    return prefRemoved.split('/');
}

function namespace(folder) {

    var parts = folderParts(folder)
      , parent = oven;

    for (var i = 0; i < parts.length; i++) {
        if (typeof parent[ parts[i] ] == 'undefined') {
            parent[ parts[i] ] = { };
        }
        parent = parent[ parts[i] ];
    }
    return parent;
}

function plateNameFrom(filename) {
  return filename.substr(0, filename.length - path.extname(filename).length);
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
                processFile(file, plate.toString());
                if (--tasks === 0) done(null);
              }
            });
          });
      }
    });
  }
} 
function processTemplate(file, plate) {
  var plateName = plateNameFrom(file.name)
    , attachTo = namespace(file.parentDir);

  attachTo[plateName] = handlebars.compile(plate);
}

function processPartial(file, partial) {
  var plateName   =  plateNameFrom(file.name)
    , namespaces  =  folderParts(file.parentDir)
    , partialName =  namespaces.length === 0 ? plateName : namespaces.concat(plateName).join('.')
    ;
  
  handlebars.registerPartial(partialName, partial);
}

function heat(opts, hot) {
  function processTemplates (opts, done) {
    process 
      ( opts
      , function(file, plate) { processTemplate(file, plate); templateFiles.push(file); }
      , done
      );
  }

  function processPartials (opts, done) {
    process 
      ( opts
      , function(file, plate) { processPartial(file, plate); partialFiles.push(file); }
      , done
      );
  }

  function continueWithPartials (err) {
    if (err) hot(err);
    else processPartials(opts.partials, hot);
  }

  if (!opts.templates && !opts.partials) 
    throw new Error('Need to either define "templates" or "partials" options.');

  processTemplates(opts.templates, continueWithPartials);
}

function burn() {
  Object.keys(oven).forEach(function (key) {
    delete oven[key];
  });
  Object.keys(handlebars.partials).forEach(function (key) {
    delete handlebars.partials[key]; 
  });
  templateFiles = [];
  partialFiles = [];

  return module.exports;
}

module.exports = {
    heat :  heat
  , burn :  burn
  , oven :  oven
};
