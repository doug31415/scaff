( function() {
  'use strict';

  angular.module( 'isc.oauth' ).service( 'iscOauthService', iscOauthService );

  function iscOauthService( $window, md5, iscSessionStorageHelper ) {

    var oauthConfig = {
      'client'          : null,
      'redirectUrl'     : null,
      'scope'           : "user/*.read",
      'responseType'    : 'code',
      'responseMode'    : 'query',
      'oauthBaseUrl'    : null,
      'aud'             : null,
      'launch'          : null,
      'requestGrantType': 'authorization_code',
      'refreshGrantType': 'refresh_token',
      'params'          : {}
    };

    var appStateKey;

    var service = {

      get: get,

      configure: configure,

      getAuthorizationUrl: getAuthorizationUrl,
      getRequestTokenUrl : getRequestTokenUrl,
      getRevocationUrl   : getRevocationUrl,
      getUserInfoUrl     : getUserInfoUrl,
      getIntrospectionUrl: getIntrospectionUrl,

      isOuathConfigured: isOuathConfigured,
      getAppStateKey   : getAppStateKey,

      getOauthConfig  : getOauthConfig,
      saveOauthConfig : saveOauthConfig,
      clearOauthConfig: clearOauthConfig
    };

    // functions

    function configure( config, stateKey ) {
      checkOauthState( stateKey );
      oauthConfig = _.assignIn( {}, oauthConfig, config );
    }

    function getAppStateKey( str ) {
      appStateKey = str ? md5.createHash( str ) : 'oauthAppState';
      return appStateKey;
    }

    function isOuathConfigured() {

      return !!_.get( getOauthConfig(), "oauthBaseUrl", false );
    }

    function checkOauthState() {

      var state = iscSessionStorageHelper.getValFromSessionStorage( getAppStateKey() );
      if ( !state ) {
        var text = ( ( Date.now() + Math.random() ) * Math.random() ).toString().replace( ".", "" );
        state    = md5.createHash( text );
        iscSessionStorageHelper.setSessionStorageValue( getAppStateKey(), state );
      }
    }

    function get( key ) {
      return _.get( getOauthConfig(), key, '' );
    }

    function getAuthorizationUrl() {
      var config = getOauthConfig();
      var state  = iscSessionStorageHelper.getValFromSessionStorage( getAppStateKey() );

      var clientId = $window.atob( config.client ).split( ":" )[0];

      var additionalParams = '';
      if ( !_.isEmpty( config.params ) ) {
        additionalParams = _.chain( config.params )
          .keys()
          .map( function( key ) {
            return encodeURIComponent( key ) + '=' + encodeURIComponent( config.params[key] );
          } ).thru( function( arr ) {
            return arr.join( '&' );
          } ).value();
      }

      return config.oauthBaseUrl + '/authorize' + '?' +
        'client_id=' + encodeURIComponent( clientId ) + '&' +
        'redirect_uri=' + encodeURIComponent( config.redirectUrl ) + '&' +
        'response_type=' + encodeURIComponent( config.responseType ) + '&' +
        'response_mode=' + encodeURIComponent( config.responseMode ) + '&' +
        ( config.launch ? 'launch=' + encodeURIComponent( config.launch ) + '&' : "" ) +
        'scope=' + encodeURIComponent( config.scope ) + '&' +
        'aud=' + encodeURIComponent( config.aud ) + '&' +
        'state=' + encodeURIComponent( state ) +
        ( !_.isEmpty( config.params ) ? '&' + additionalParams : '' );
    }

    function getRevocationUrl() {
      return _.get( getOauthConfig(), 'oauthBaseUrl', '' ) + '/revocation';
    }

    function getUserInfoUrl() {
      return _.get( getOauthConfig(), 'oauthBaseUrl', '' ) + '/userinfo';
    }

    function getIntrospectionUrl() {
      return _.get( getOauthConfig(), 'oauthBaseUrl', '' ) + '/introspection';
    }

    function getRequestTokenUrl() {
      return _.get( getOauthConfig(), 'oauthBaseUrl', '' ) + '/token';
    }

    function saveOauthConfig( config ) {
      config = _.isObject( config ) ? config : {};
      checkOauthState();
      var storedConfig = getOauthConfig();
      var mergedConfig = _.assignIn( {}, storedConfig, config );
      var state        = iscSessionStorageHelper.getValFromSessionStorage( getAppStateKey() );
      iscSessionStorageHelper.setSessionStorageValue( state, encodeURIComponent( JSON.stringify( mergedConfig ) ) );
    }

    function getOauthConfig() {
      var state     = iscSessionStorageHelper.getValFromSessionStorage( getAppStateKey() );
      var configStr = iscSessionStorageHelper.getValFromSessionStorage( state );
      return configStr ? JSON.parse( decodeURIComponent( configStr ) ) : oauthConfig;
    }

    function clearOauthConfig() {
      var state = iscSessionStorageHelper.getValFromSessionStorage( getAppStateKey() );
      iscSessionStorageHelper.removeFromSessionStorage( state );
      iscSessionStorageHelper.removeFromSessionStorage( getAppStateKey() );
    }

    return service;
  }

} )();
