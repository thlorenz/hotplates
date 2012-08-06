var fs            =  require('fs')
  , path          =  require('path')
  , readdirp      =  require('readdirp')
  , handlebars    =  require('handlebars')
  , oven          =  { }
  , templateFiles =  [ ]
  , partialFiles  =  [ ]
  , watchers      =  { }
  , isWindows     =  process.platform ===  'win32'
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
                templateFiles.push(file);
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

function watch(file, update) {
  var fullPath = file.fullPath;

  if (watchers[fullPath]) return;
  
  watchers[fullPath] = true;

  if (isWindows) {
    // slower, but oh well
    fs.watch(fullPath, function (event) {
      if (event === 'change') update(fullPath);
    });
  } else {
    fs.watchFile(fullPath, { persistent: true, interval: 100 }, function (event) {
      if (event === 'change') update(file);
    });
  }
}

function keepWarm(file, process) {
  watch(file, function (file) {
    fs.readFile(file.fullPath,function (err, plate) {
      if (err) console.error(err);
      else process(file, plate);
    });
  });
}

function keepTemplateWarm (file) {
  keepWarm(file, processTemplate); 
}

function keepPartialWarm (file) {
  keepWarm(file, processPartial); 
}

function watch(opts) {
  if (!opts.reheat) return;

  // Watch all template files for changes
  templateFiles.forEach(keepWarm);
  // Watch all template folders for added/removed files
}

function heat(opts, hot) {
  function processTemplates (opts, done) {
    process 
      ( opts
      , function(file, plate) { processTemplate(file, plate); templateFiles.push(file.fullPath); }
      , done
      );
  }

  function processPartials (opts, done) {
    process 
      ( opts
      , function(file, plate) { processPartial(file, plate); partialFiles.push(file.fullPath); }
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
}

module.exports = {
    heat :  heat
  , burn :  burn
  , oven :  oven
};
