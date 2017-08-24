/**
 * This config.app.js is now responsible for aggregating the common and component configurations.
 *
 * This config file now has full power and can modify the contents of config.common.js and config.component.js.
 *
 * This is very powerful because individual application no longer needs to rely on gulpfile to create custom logic
 * to handle things like edition support, overrides (the existing approach still works). This config.app.js file
 * can now read multiple edition configs and update ```module.exports.component``` configuration directly.
 */

const uifwModules = require( './utils/uifwModules' );

module.exports.masterConfig = {};
module.exports.common       = require( "./config.common" );
module.exports.component    = require( "../src/components/foundation/base/config.components" );
module.exports.app          = getAppConfig();

var appBasePath = "src/uifw-modules/"; // change this value to empty string for uifw-modules application
uifwModules.includeUiModules( module.exports.app.submoduleComponents, appBasePath, module.exports.app );


function getAppConfig() {
  return {
    "modulePath"         : "src/app/modules/",
    "submoduleComponents": [], //Simply include the module folder name. For example: ["timeline", "inbox", "admin.user"]
    "customer"           : {
      "assets": {
        "i18n": [  //order matters
          // The default algorithm is "replace". In order to specify "merge", be sure to add "_UifwMergeAlgorithm" : "merge"' as a property in the json files.
          "customer/assets/i18n/**/*.json"
        ],
        "FDN" : [
          // The default algorithm is "replace". In order to specify "merge", be sure to add "_UifwMergeAlgorithm" : "merge"' as a property in the json files.
          "customer/assets/FDN/**/*.json"
        ]
      }
    },
    "vendor"             : {
      "js"   : [
        'src/app/node_modules/angular-http-backup/dist/httpbackup.js'
      ],
      "mocks": [],
      "fonts": []
    },
    "module"             : {
      "modules"      : [
        "src/app/modules/**/app.module.js",
        "src/app/modules/**/*.module.js"
      ],
      "js"           : [
        "src/app/modules/**/*.js",
        "!src/uifw-modules/src/app/modules/**/*.spec.js"
      ],
      "scss"         : [
        "src/app/assets/sass/main.scss"
      ],
      "scssInjectSrc": [
        // uncomment this following line if you want to dynamically inject scss files inside of modules folder into your main.scss file
        "src/app/modules/**/*.scss"
      ],
      "html"         : [
        "src/app/modules/**/*.html"
      ],
      "assets"       : {
        "FDN"              : [  //order matters
          "src/app/assets/FDN/**/*.json"
        ],
        "i18n"             : [  //order matters
          "src/app/assets/i18n/**/*.json"
        ],
        "comments"         : "i18nDomain value will be used as a part of the generated i18n XML",
        "i18nDomain"       : "hs-temp-app-scaffold",
        // for specifying a filename prefix that should be project-specific
        "i18nXmlFilePrefix": "",
        "mocks"            : [
          "src/app/assets/mockData/**"
        ],
        "images"           : [
          "src/app/assets/images/**/*"
        ],
        "vendor"           : {
          "js": []
        }
      },
      "mocks"        : [
        "test/unit/app/appUnitTestMocks.js"
      ],
      "tests"        : [
        "test/unit/app/**/*.test.js",
        "test/unit/app/**/*Tests.js",
        "src/app/modules/**/*.spec.js"
      ]
    },
    "dest"               : {
      "folder"       : "www",
      "comments"     : "i18nXml is used for specifying destination location of converted i18n files",
      "fdn"          : "www/assets/FDN/",
      "i18n"         : "www/assets/i18n/",
      "i18nXml"      : "isc-tools/localize",
      "i18nExtract"  : "isc-tools/localize/i18nExtract",
      // for specifying which files are to be copied over.
      // Since development only uses "en-us.json", no need t// o update the gulp task to account for
      // multiple translation files: e.g. "en-us.json", "en-uk.json" and "en.json".
      "i18nXmlFilter": "**/en-us.xml"
    },
    "cordova"            : false,
    "excludeConfig"      : "!src/app/modules/app.config.js",
    "edition"            : [
      {
        "name": "base",
        "path": "src/components/foundation/base/config.components.js"
      }
    ],
    // JavaScript files can't be overridden like css selector cascading or Angular's templateCache templates.
    // If we want to override lower level JS files, we must exclude them from the list.
    // The overrides below are used to exclude base files by specifying glob patterns.
    // e.g. ```common: ['!src/modules/isc.filters/myFilter.js']```
    // update: common and components config can now be directly modified by this file.
    "overrides"          : {
      "js"      : {
        "common"    : [],
        "components": []
      },
      "comments": "Used to exclude files in common/component. e.g. ```common: ['!src/modules/isc.filters/myFilter.html']```",
      "html"    : {
        "common"    : [],
        "components": []
      }
    }
  };
}
