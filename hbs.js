var fs = require('fs')
  , path = require('path')
  , handlebars = require('handlebars')
  , handledbars = { }
  ;

function isHandlebar(file) {
  var ext = path.extname(file);
  return ext === '.hbs' || ext === '.handlebars';
}

function store(opts, cb) {
  
  var platesPath = path.join(opts.root, opts.templates);
  fs.readdir(platesPath, function (err, files) {

    if (err) cb(err);
    else {
      var handlebarFiles = files.filter(isHandlebar)
        , tasks = handlebarFiles.length;

      if (tasks === 0) {
        cb(null);
        return;
      }
      
      handlebarFiles
        .forEach(function (file) {
          fs.readFile(file, function (err, plate) {
            if (err) cb(err);
            else {
              var plateName = file.substr(0, file.length - path.extname(file).length);
              handledbars[plateName] = handlebars.compile(plate);
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

