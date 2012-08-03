var fs = require('fs')
  , path = require('path')
  , handlebars = require('handlebars')
  ;

function isHandlebar(file) {
  var ext = path.extname(file);
  return ext === '.hbs' || ext === '.handlebars';
}

function memoize(opts, cb) {
  
  cb(null);

}

module.exports = {
    memoize: memoize
  , handledbars: { } 
};

