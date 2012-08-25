var hotplates  =  require('..')
  , preheat    =  require('../preheat')
  , handlebars =  require('handlebars')
  , path       =  require('path')
  , http       =  require('http')
  , PORT       =  3000
  ;

function renderSite () {
  var ctx = 
    { site: 
      { title: 'Willie Slater\'s HotPlater'
      , header: 
        { title: 'Willie Slater makes your HotPlater'
        , subtitle: 'Instructions on how to maintain your hotplates oven' 
        }
      }
    , oven:
        { filter:
          { handle: { how: 'very carefully' }
          }
        , top:
          { burners: { degrees: 250 } 
          , dials:   { maxDegress: 500 }
          }
        }
    };

  var site = handlebars.templates.index(ctx);
  return site;
}

function serveSite () {
  http
    .createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderSite(), 'utf-8');
    })
    .listen(PORT, 'localhost');

  console.log('Server running at localhost:', PORT);
}

hotplates
  .preheat(
    { amd: true
    , handlebarsPath: '../node_modules/handlebars/handlebars'
    , target: path.join(__dirname, 'preheated.js')
    }
  , function (err, data) {
      if (err) console.error(err);
      else console.log('preheated templates');
    }
  )
  .on('templateCompiled', function (fileInfo, name) { 
    console.log('Compiled: \t[ %s ] as [ %s ]', fileInfo.path, name); 
  })
  .on('partialRegistered', function (fileInfo, name) { 
    console.log('Registered:\t[ %s ] as [ %s ]', fileInfo.path, name); 
  })
  .heat(
    { templates:
      { root: path.join(__dirname, 'templates')
      , directoryFilter: '!partials' 
      }
    , partials:
      { root: path.join(__dirname, 'templates', 'partials') }
    , watch: true
    }
  , serveSite);

