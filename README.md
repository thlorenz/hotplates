# hotplates [![Build Status](https://secure.travis-ci.org/thlorenz/hotplates.png)](http://travis-ci.org/thlorenz/hotplates)

Registers partials, compiles [handlebars](http://handlebarsjs.com/) templates and shoves them into the oven so you can serve them hot later.

As an added convenience they are namespaced according to the 'templates' folder structure for easy access.

# Examples

Assuming your handlebars templates folder looks as follows:

    templates
    ├── index.hbs
    └── partials
        ├── oven
        │   ├── filter
        │   │   ├── collector hbs
        │   │   └── handle hbs
        │   └── parts-index hbs
        └── site
            ├── content hbs
            └── header hbs
 

**1. Heat your templates** and pass continuation function:

```javascript
hotplates.heat(
    { templates:
      { root: path.join(__dirname, 'templates')
      , directoryFilter: '!partials' 
      }
    , partials:
      { root: path.join(__dirname, 'templates', 'partials') }
    }
  , renderSite);
```

This compiles *index.hbs*, makes it accessible via `hotplates.oven.index` and
registers the following partials with handlebars:

    site.content          
    site.header           
    oven.partsIndex            
    oven.filter.collector 
    oven.filter.handle    

They are now accessible under that name in other templates and partials.


**2. In the continuation function start your server**, etc. (in this example we'll open index page in the browser instead):

```javascript
function renderSite(err) {
  // Prepare a normal handlebars context
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

  // Render the index page using the context
  var rendered = hotplates.oven.index(ctx);
  fs.writeFileSync('./index.html', rendered);

  exec('open ' + './index.html');
}
```

Full example [here](https://github.com/thlorenz/hotplates/tree/master/examples).

# Installation

`npm install hotplates`

# API

## Heating templates

***heat(opts, hot)***

Heats your templates according to the given opts and calls back when they are hot.

At that point compiled templates are available in the oven and partials where registered with handlebars.

Typical opts:
```javascript
{ templates:
  { root: path.join(__dirname, 'templates') // tell hotplates where your templates are
  , directoryFilter: '!partials'            // don't compile partials
  }
, partials:
  { root: path.join(__dirname, 'templates', 'partials') } // register all my partials
, watch: true // autmatically re-compile and re-register my templates when I change them or add new ones
}
```
### watch 

When set to true, hotplates will watch the templates and partial folders for changes and recompile templates, 
re-register partials when they change and add new ones that are created

Additional options can be given to `templates` and `partials`, most commonly you could change the fileFilter which defaults to `['*.hbs', '*.handlebars']`.

Since hotplates resolves templates and partials using [readdirp](https://github.com/thlorenz/readdirp),
refer to its [options documentation](https://github.com/thlorenz/readdirp#options).

### Naming Conventions 

Templates with names and paths containing underscores or dashes will be [camelCased](http://en.wikipedia.org/wiki/CamelCase).

E.g., 'dashed-path/underscored_name.hbs' is compiled/registered as 'dashedPath/underscoredName'


## The oven

***hotplates.oven***

After you heated your templates, they are shoved into the oven, namespaced according to the path they where found in.

E.g., a template found at 'site/reader/book.hbs' will be stored as a compiled `Function` under `hotplates.oven.site.reader.book`.

## Registered Partials

Partials are registered in a similar fashion, but not shoved into the oven as they are registered with handlebars instead. 

However the namespacing schema for them is exactly the same.

Assuming the partial root was 'templates/partials', a partial found at 'templates/partials/book/page.hbs' will be accessible in other templates and partials under the name `book.page`.

## Burning templates

***burn()***

In order to remove all templates from the oven and unregister all partials, you can burn them.

This is useful in cases where you want to make sure that no obsolete templates or partials are sticking around.

## Events

***on('templateCompiled', function (fileInfo, name) { })*** and ***on('partialRegistered', function (fileInfo, name) { })***

**fileInfo**: supplied by [readdirp](https://github.com/thlorenz/readdirp) and thus has the same structure as explained in the [readdirp documentation](https://github.com/thlorenz/readdirp#entry-info).
**name**: the full name under which the template was added to the oven or registered

These events are emitted when a template was [re]compiled or a partial [re]registered respectively.

This feature can be very useful for logging, etc.,

**Example:**

*from [examples/server.js](https://github.com/thlorenz/hotplates/blob/master/examples/server.js)*

```javascript
hotplates
  .on('templateCompiled', function (fileInfo, name) { console.log('Compiled: \t[ %s ] as [ %s ]', fileInfo.path, name); })
  .on('partialRegistered', function (fileInfo, name) { console.log('Registered:\t[ %s ] as [ %s ]', fileInfo.path, name); })
  .heat({ ... }, serveSite );
```


# Tests

Reading the [tests](https://github.com/thlorenz/hotplates/blob/master/test/hotplates.js) 
will make you more familiar with hotplates' api.
