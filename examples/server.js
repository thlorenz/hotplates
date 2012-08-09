var hotplates  =  require('../hotplates')
  , handlebars =  require('handlebars')
  , path       =  require('path')
  , http = require('http')
  , PORT = 3000
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

  var site = hotplates.oven.index(ctx);
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
  .on('templateCompiled', function (fileInfo) { console.log('Compiled: \t', fileInfo.path); })
  .on('partialRegistered', function (fileInfo) { console.log('Registered:\t', fileInfo.path); })
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
