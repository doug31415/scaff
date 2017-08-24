/**
 * Created by douglasgoodman on 1/16/15.
 */

var Karma               = require( 'karma' ).Server;
var componentTestConfig = require( './gulp.test.components' );
var _                   = require( 'lodash' );
var argv                = require( 'yargs' ).argv;
var utils               = require( './utils/uifwModules' );

var reportCoverage = true;

module.exports = {
  init  : init,
  getSrc: getSrc
};

function getSrc( config, _ ) {
  var componentSrc = componentTestConfig.getSrc( config );
  var appConfig    = config.app;
  return _.extend( componentSrc, {
    appVendorJs      : (appConfig.vendor.js || []),
    appModuleVendorJs: (appConfig.module.assets.vendor.js || []),
    appVendorMocks   : (appConfig.vendor.mocks || []),
    appModuleJs      : appConfig.module.js || [],
    appModuleModules : appConfig.module.modules || [],
    appModuleMocks   : (appConfig.module.mocks || []),
    appModuleTests   : appConfig.module.tests || [],
    appModuleHtml    : appConfig.module.html || [],
    masterOverrides  : _.concat( config.masterConfig.overrides.js.common, config.masterConfig.overrides.js.components )
  } );
}

function init( gulp, plugins, config, _ ) {
  'use strict';
  var src      = getSrc( config, _ );
  var srcFiles = []
    .concat( src.commonVendorJs ) //vendorJs
    .concat( src.componentsVendorJs )
    .concat( src.appVendorJs )
    .concat( src.commonModuleVendorJs )//module vendorJs
    .concat( src.componentsModuleVendorJs )
    .concat( src.appModuleVendorJs )
    .concat( src.commonVendorMocks )//Vendor Mocks
    .concat( src.componentsVendorMocks )
    .concat( src.appVendorMocks )
    .concat( src.commonModuleMocks )//Module mocks
    .concat( src.componentsModuleMocks )
    .concat( src.appModuleMocks )
    .concat( src.commonModuleModules ) //module specific module declarations
    .concat( src.componentsModuleModules )
    .concat( src.appModuleModules )
    .concat( src.commonModuleJs ) //module specific js files
    .concat( src.componentsModuleJs )
    .concat( src.appModuleJs )
    .concat( src.commonModuleHtml ) //html files
    .concat( src.componentsModuleHtml )
    .concat( src.appModuleHtml )
    .concat( src.appModuleTests ) // test files
    .concat( src.masterOverrides ); //overrides
  /*================================================
   =              Run unit tests                   =
   ================================================*/

  // --------------------------------
  // run the app tests
  // --------------------------------
  gulp.task( 'test:app', function( done ) {
    // Due to a karma bug, the server will hang for up to 20 seconds after completion.
    // This is a way to force it to exit. This approach will also kill any other tasks in the gulp chain.
    // It should only be used when executing test task individually
    var forceQuitWhenDone = argv.single;
    var reporters         = !argv.skipCoverage && reportCoverage ? ['dots', 'coverage'] : ['dots'];
    reportCoverage        = false; //only report coverage on the first pass

    //since, karma doesn't use the same glob pattern to exclude as gulp.
    //this logic separates the srcFiles into include and exclude list
    var [includedFiles, excludedFiles] = utils.separateKarmaFiles( srcFiles );

    var configPath = plugins.path.join( __dirname, "../test/karma.conf.app.js" );
    var server     = new Karma( {
      reporters : reporters,
      configFile: configPath,
      files     : includedFiles,
      exclude   : excludedFiles,
      singleRun : true
    }, forceQuitWhenDone ? undefined : function( err ) {
      if(err !== 0) {
        console.log( '\n =========== ', plugins.gutil.colors.red.bold( 'Karma Tests failed' ), '=========== \n' );
      }
      done();
    } );

    if ( forceQuitWhenDone ) {
      server.on( 'run_complete', function( browsers, results ) {
        done();
      } );
    }

    server.start();
  } );

  // --------------------------------
  // run the app tests
  // --------------------------------
  gulp.task( 'coverage:app', function( done ) {
    // Due to a karma bug, the server will hang for up to 20 seconds after completion.
    // This is a way to force it to exit. This approach will also kill any other tasks in the gulp chain.
    // It should only be used when executing test task individually
    var forceQuitWhenDone = argv.single;
    console.log( 'forceQuitWhenDone:', forceQuitWhenDone );

    //since, karma doesn't use the same glob pattern to exclude as gulp.
    //this logic separates the srcFiles into include and exclude list
    var [includedFiles, excludedFiles] = utils.separateKarmaFiles( srcFiles );

    var configPath = plugins.path.join( __dirname, "../test/karma.conf.app.js" );
    var server     = new Karma( {
      reporters : ["coverage"],
      configFile: configPath,
      files     : includedFiles,
      exclude   : excludedFiles,
      singleRun : true
    }, forceQuitWhenDone ? undefined : done );

    if ( forceQuitWhenDone ) {
      server.on( 'run_complete', function( browsers, results ) {
        done( results.error ? 'There are test failures' : null );
      } );
    }

    server.start();
  } );

}
