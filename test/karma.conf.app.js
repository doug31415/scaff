(function() {
  'use strict';

  module.exports = function( config ) {

    config.set( {
      basePath: '..', // Ignored through gulp-karma

      files: [ // Ignored through gulp-karma
        '**/*.html'
      ],

      // coverage reporter generates the coverage

      autoWatch       : false,
      coverageReporter: {
        reporters: [
          { type: "text-summary" },
          { type: "html", dir : 'coverage/app' }
        ]
      },
      logLevel: "error",
      frameworks      : ['jasmine'],

      browsers: ['PhantomJS'],

      preprocessors: {
        'src/app/modules/**/*.js'                    : ['coverage'],
        'src/common/modules/**/*.html'               : ['ng-html2js'],
        'src/components/**/modules/**/*.html'        : ['ng-html2js'],
        'src/app/modules/**/*.html'                  : ['ng-html2js'],
        'test/unit/components/forms/static/**/*.html': ['ng-html2js'],
        'test/unit/components/forms/static/**/*.css' : ['ng-html2js'],
        'test/unit/components/forms/static/**/*.js'  : ['html2js'],
        'test/unit/components/forms/static/**/*.json': ['json_fixtures']
      },

      ngHtml2JsPreprocessor   : {
        stripPrefix: 'src\/(app|common|components)\/.*\/?modules\/',
        moduleName : 'isc.templates' // include beforeEach( module( 'isc.templates' )) in unit tests
      },
      jsonFixturesPreprocessor: {
        variableName: '__json__'
      },
      plugins                 : [
        'karma-phantomjs-launcher',
        'karma-jasmine',
        'karma-fixture',
        'karma-coverage',
        'karma-html2js-preprocessor',
        'karma-ng-html2js-preprocessor',
        'karma-json-fixtures-preprocessor'
      ]
    } );
  };
})();
