/**
 * Created by hzou on 12/11/15.
 */

( function() {
  'use strict';

  var appConfig = getConfig();

  angular
    .module( 'app.config', [] )
    .config( config )
    .constant( 'appConfig', appConfig );

  function config() {
    if ( appConfig.customConfigUrl ) {
      // Since the application expects full config to be there before it runs.
      // Leveraging $.ajax to makes a SYNCHRONOUS call to get the external config and update the config
      // before the application starts.
      $.ajax( {
        method: "GET",
        url   : getCustomConfigUrl(),
        async : false //SYNCHRONOUS
      } ).done( function( externalConfig ) {
        _.merge( appConfig, externalConfig ); // merges external config to appConfig
      } );
    }
  }

  /**
   * constructs the fully qualified url path based on api config and customConfigUrl
   * @returns {string}
   */
  function getCustomConfigUrl() {
    var api = appConfig.api;
    return [api.protocol, "://", api.hostname, ":", api.port, "/", api.path, "/", appConfig.customConfigUrl].join( '' );
  }

  /*========================================
   =              app config               =
   ========================================*/
  function getConfig() {
    return {
      //'customConfigUrl': 'path/to/external/config/api', //uncomment to call external api for custom config
      'production'          : false,
      'login'               : {
        "useCacheLogin": true,
        'requiresOrg'  : false
      },
      'api'                 : {
        'path': 'api/v1'
      }
    };
  }

} )();
