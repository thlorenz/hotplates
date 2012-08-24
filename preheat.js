var plates =  [ ]
  , parts  =  [ ]
  ;

function preheat(plates, parts, opts, cb) {
  if (!opts.precompile) {
    cb(null);
    return;
  }
  
  var output = [];
  
  if (opts.precompile.amd) {
    output.push('define([\'' + opts.precompile.handlebarPath + 'handlebars\'], function(Handlebars) {\n');
  } else {
    output.push('(function() {\n');
  }

  output.push('  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n');

  plates.forEach(function (plate) {
      output.push('templates[\'' + plate.name + '\'] = template(' + plate.value + ');\n');
  });

  parts.forEach(function (part) {
      output.push('Handlebars.registerPartial(\'' + part.name + '\', ' + 'template(' + part.value + '));\n');
  });

  if (opts.precompile.amd) {
    output.push('});');
  } else {
    output.push('})();');
  }
  
  output = output.join('');

  fs.writeFileSync(opts.precompile.target, output);
  cb(null);
}
