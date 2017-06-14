/**
 * Created by hzou on 1/11/17.
 */

const _ = require( 'lodash' );

module.exports.includeUiModules   = includeUiModules;
module.exports.separateKarmaFiles = separateKarmaFiles;

/**
 * takes a list of gulp glob patterns and separate included and excluded files into two separate arrays to pass to karma
 * @param srcFiles
 * @returns {[*,*]}
 */
function separateKarmaFiles( srcFiles ) {
  var includedFiles = new Set(); //ensures uniqueness
  var excludedFiles = new Set();

  //since, karma doesn't use the same glob pattern to exclude as gulp.
  //this logic separates the srcFiles into include and exclude list
  _.forEach( srcFiles, function( file ) {
    if ( file.startsWith( '!' ) ) {
      excludedFiles.add( file.substr( 1 ) );//remove "!"
    } else {
      includedFiles.add( file );
    }
  } );

  return [_.toArray( includedFiles ), _.toArray( excludedFiles )];
}

/**
 * @Description
 * Automatically include components inside of uifw-modules as part of the applciation's gulp build process
 *
 * folder names inside of submodule, uifw-modules/src/modules, folder
 *  src/uifw-modules/src/app/modules/timeline
 *  src/uifw-modules/src/app/modules/inbox
 *  includeUiModules( ["timeline", "inbox"] );
 */
function includeUiModules( uiModuleNames, appBasePath, appConfig ) {

  var configBasePath = `../../${appBasePath || ''}src/app/modules/`;

  var masterDepConfig = readJson( `${configBasePath}build.json`, null );
  if ( masterDepConfig ) {
    _.forEach( uiModuleNames, injectDependencies );
  }

  _.forEach( uiModuleNames, injectModuleFiles );

  function injectDependencies( uiModuleName ) {
    var individualModuleConfig = readJson( `${configBasePath}${uiModuleName}/build.json`, {} );

    // For each peer dependency (uifw-module component), push to the uiModuleNames' array
    _.forEach( individualModuleConfig.peerDependencies, function( peerDep ) {
      // push peerDep into uiModuleNames array as we are looping
      // this will continue to work as the array mutates while a simple for loop may not
      uiModuleNames.push( peerDep );
    } );

    _.forEach( individualModuleConfig.dependencies, function( dependency ) {
      recursivelyPrefixAppPath( dependency, appBasePath );
      _.mergeWith( appConfig, dependency, concatArrays );
    } );
  }

  function injectModuleFiles( uiModuleName ) {
    var uiModulePath = `${appBasePath}src/app/modules/${uiModuleName}/`;
    appConfig.module.modules.unshift( uiModulePath + "**/*.module.js" );
    appConfig.module.js.unshift( uiModulePath + "**/*.js" );
    appConfig.module.scssInjectSrc.unshift( uiModulePath + "**/*.scss" ); //scss files are auto injected to have access to vars and mixins
    appConfig.module.html.unshift( uiModulePath + "**/*.html" );
    appConfig.module.assets.images.unshift( uiModulePath + "/assets/images/**/*" );
    appConfig.module.assets.FDN.unshift( uiModulePath + "/assets/FDN/**/*" );
  }

  function concatArrays( a, b ) {
    if ( _.isArray( a ) ) {
      return a.concat( b );
    }
  }

  /**
   * @Description
   *
   * This recursive function will automatically prefix "src/uifw-modules/" to each and every string value in the object.
   * It assumes the contents of the arrays are strings
   *
   * see jsbin link with runnable a example: http://jsbin.com/vasuzoxaza/1/edit?js,console
   *
   * @Examples:
   * var source = {
   *  "angular-cookies": {
   *    "module": {
   *      "modules": [
   *        "src/app/modules/app.module.js",
   *        "src/app/modules/admin.user/admin.user.module.js"
   *      ],
   *      "js": [],
   *      "scss": [],
   *      "scssInjectSrc": [],
   *      "html": "hello/world.html"
   *    }
   *  }
   * }
   *
   * var output = {
   *  "angular-cookies": {
   *    "module": {
   *      "modules": [
   *        "src/uifw-modules/src/app/modules/app.module.js",
   *        "src/uifw-modules/src/app/modules/admin.user/admin.user.module.js"
   *      ],
   *      "js": [],
   *      "scss": [],
   *      "scssInjectSrc": [],
   *      "html": "src/uifw-modules/hello/world.html"
   *    }
   *  }
   * }
   *
   */
  function recursivelyPrefixAppPath( config, prefix, level ) {
    level = level || 0;
    if ( level > 15 ) {
      throw new Error( 'More than 15 levels of recursion are not supported. This is an indication of infinite recursion caused by circular reference.' );
    }

    if ( _.isString( config ) ) {
      return prefix + config;
    } else if ( _.isArray( config ) ) {
      return _.map( config, function( value ) {
        return recursivelyPrefixAppPath( value, prefix, level + 1 );
      } );
    }

    _.forEach( config, function( value, nestedKey ) {
      config[nestedKey] = recursivelyPrefixAppPath( value, prefix, level + 1 );
    } );
    return config;
  }

}


/**
 * Reads the json file and returns its content. If the file is not found, it will return defaults or {}
 *
 * @param filePath
 * @returns {*}
 */
function readJson( filePath, defaults ) {
  var path = require( 'path' );
  var fs   = require( 'fs' );
  var json = defaults;
  filePath = path.join( __dirname, filePath );

  if ( fs.existsSync( filePath ) ) {
    json = require( filePath );
  }

  return json;
}
