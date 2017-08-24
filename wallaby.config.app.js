var angularTemplatePreprocessor = require( 'wallaby-ng-html2js-preprocessor' );

module.exports = wallaby;

function wallaby() {
  'use strict';
  var src = getSrc();

  return {
    basePath       : '..', // Ignored through gulp-karma
    'files'        : []
      .concat( src.commonVendorJs )
      .concat( src.componentsVendorJs )
      .concat( src.appVendorJs )
      .concat( src.commonModuleVendorJs )
      .concat( src.componentsModuleVendorJs )
      .concat( src.appModuleVendorJs )
      .concat( src.commonVendorMocks )
      .concat( src.componentsVendorMocks )
      .concat( src.appVendorMocks )
      .concat( src.commonModuleMocks )
      .concat( src.componentsModuleMocks )
      .concat( src.appModuleMocks )
      .concat( src.commonModuleModules )
      .concat( src.componentsModuleModules )
      .concat( src.appModuleModules )
      .concat( src.commonModuleJs )
      .concat( src.componentsModuleJs )
      .concat( src.appModuleJs )
      .concat( src.commonModuleHtml )
      .concat( src.componentsModuleHtml )
      .concat( src.appModuleHtml )
      .concat( _.map( src.appModuleTests, function( testGlob ) {
        return "!" + testGlob;  //exclude test files from srcs
      } ) ),
    'tests'        : src.appModuleTests,
    'preprocessors': {
      'src/common/modules/**/*.html'       : function( file ) {
        return angularTemplatePreprocessor.transform( file, {
          stripPrefix : 'src\/(app|common|components)\/.*\/?modules\/',
          'moduleName': 'isc.templates'
        } );
      },
      'src/components/**/modules/**/*.html': function( file ) {
        return angularTemplatePreprocessor.transform( file, {
          stripPrefix : 'src\/(app|common|components)\/.*\/?modules\/',
          'moduleName': 'isc.templates'
        } );
      },
      'src/app/modules/**/*.html'          : function( file ) {
        return angularTemplatePreprocessor.transform( file, {
          stripPrefix : 'src\/(app|common|components)\/.*\/?modules\/',
          'moduleName': 'isc.templates'
        } );
      }
    },
    'testFramework': 'jasmine'
  };
}


function getSrc() {
  // var commonWallaby    = require( './wallaby.config.common' );
  var componentsConfig = require( './wallaby.config.components' );
  var componentsSrc    = componentsConfig.getSrc();
  var configs          = require( './gulp/config.app' );
  var appConfig        = configs.app;

  return _.extend( componentsSrc, {
    appVendorJs      : (appConfig.vendor.js || []).map( componentsConfig.noInstrument ),
    appModuleVendorJs: (appConfig.module.assets.vendor.js || []).map( componentsConfig.noInstrument ),
    appVendorMocks   : (appConfig.vendor.mocks || []).map( componentsConfig.noInstrument ),
    appModuleJs      : appConfig.module.js || [],
    appModuleModules : appConfig.module.modules || [],
    appModuleMocks   : (appConfig.module.mocks || []).map( componentsConfig.noInstrument ),
    appModuleTests   : appConfig.module.tests || [],
    appModuleHtml    : appConfig.module.html || []
  } );
}
