( function() {
  "use strict";

  angular.module( "isc.oauth" ).factory( "iscOauthApi", iscOauthApi );

  /* @ngInject */
  function iscOauthApi( $window, $http, $q, $httpParamSerializerJQLike, iscHttpapi, iscOauthService, iscCustomConfigService,
    iscSessionStorageHelper ) {

    var api = {
      authorize       : authorize,
      revoke          : revoke,
      introspect      : introspect,
      requestToken    : requestToken,
      refreshToken    : refreshToken,
      getUserInfo     : getUserInfo,
      configureBaseUrl: configureBaseUrl,
      doOauthCheck    : doOauthCheck
    };


    function formPost( url, data, headers ) {
      headers = _.assignIn( ( headers || {} ), { "Content-Type": "application/x-www-form-urlencoded" } );
      return iscHttpapi.post( url, $httpParamSerializerJQLike( data ), { "headers": headers, showLoader: true } );
    }

    var basicAuthHeader = function() {
      var client = iscOauthService.get( "client" );
      return "basic " + $window.btoa( $window.atob( client ) );
    };

    function formatAndSaveToken( token ) {
      var formattedToken                          = _.mapKeys( token, function( value, key ) {
        return _.camelCase( key );
      } );
      $http.defaults.headers.common.AUTHORIZATION = "BEARER " + formattedToken.accessToken;

      if ( !token.patient ) {
        iscOauthService.saveOauthConfig( formattedToken );
      }else {
        iscOauthService.configure( formattedToken );
      }
      return formattedToken;
    }

    function authorize() {
      $window.location.assign( iscOauthService.getAuthorizationUrl() );
    }

    function requestToken( code ) {

      return formPost( iscOauthService.getRequestTokenUrl(), {
        "grant_type"  : "authorization_code",
        "code"        : code,
        "redirect_uri": iscOauthService.get( "redirectUrl" )
      }, {
        "AUTHORIZATION": basicAuthHeader()
      } ).then( formatAndSaveToken );

    }

    function refreshToken() {
      return formPost( iscOauthService.getRequestTokenUrl(),
        {
          "grant_type"   : "refresh_token",
          "refresh_token": iscOauthService.get( "refreshToken" )
        },
        {
          "AUTHORIZATION": basicAuthHeader()
        } ).then( formatAndSaveToken );
    }

    function revoke() {
      var clientId = $window.atob( iscOauthService.get( "client" ) ).split( ":" )[0];
      return formPost( iscOauthService.getRevocationUrl(),
        {
          "token"     : iscOauthService.get( "accessToken" ),
          "client_id" : clientId,
          "token_type": "revoke"
        }, {} ).finally( function() {
        $http.defaults.headers.common.AUTHORIZATION = '';
        iscOauthService.clearOauthConfig();
      } );
    }

    function introspect() {
      return formPost( iscOauthService.getIntrospectionUrl(),
        {
          "token": encodeURIComponent( iscOauthService.get( "accessToken" ) )
        },
        {
          "AUTHORIZATION": basicAuthHeader()
        } );
    }

    function getUserInfo() {
      return formPost( iscOauthService.getUserInfoUrl(),
        {
          "access_token": encodeURIComponent( iscOauthService.get( "accessToken" ) )
        },
        {} );
    }

    function doOauthCheck( stateParams ) {
      // check for query params -- code, state, iss, launch
      var params = _.pickBy( stateParams, _.identity );
      var stateKey = iscOauthService.getAppStateKey();
      var isSameState = params.state === iscSessionStorageHelper.getValFromSessionStorage( stateKey );
      // if authorization code and query param available, get token and user
      if ( params.code && isSameState ) {
        return api.requestToken( params.code ).then( function( token ) {
          return api.getUserInfo().then( function( user ) {
            user              = _.assignIn( {}, user, { userRole: 'authenticated' } );
            var oauthResponse = _.assignIn( {}, {
              "SessionTimeout": _.get( token, "expiresIn", 300 )
            }, {
              "UserData": user
            } );
            return oauthResponse;
          } );
        } );
      }

      return $q.when( {} );
    }

    function configureBaseUrl( stateParams ) {

      var appConfig = iscCustomConfigService.getConfig();

      // check for query params -- code, state, iss, launch
      var params = _.pickBy( stateParams, _.identity );

      var fhirServerUrl;
      if ( params.iss ) {
        fhirServerUrl = params.iss;
      } else {
        fhirServerUrl = _.get( appConfig, 'fhir.iss', '' );
      }
      if ( fhirServerUrl ) {
        var config = ( appConfig.oauth || appConfig.fhir || {} );
        return setBaseUriFromFhir( fhirServerUrl, config, params );
      } else {
        // save config in appconfig
        if ( _.get( appConfig, "oauth.oauthBaseUrl", "" ) ) {
          iscOauthService.configure( appConfig.oauth );
        }

        return $q.when( _.get( appConfig, "oauth.oauthBaseUrl", "" ) );
      }

    }

    function setBaseUriFromFhir( fhirServerUrl, oauthConfig, params ) {

      if ( !_.endsWith( fhirServerUrl, 'metadata' ) ) {
        fhirServerUrl += ( ( fhirServerUrl.substr( -1 ) !== '/' ) ? "/metadata" : "metadata" );
      }

      return iscHttpapi.get( fhirServerUrl, { showLoader: true } ).then( function( response ) {
        var smartExtension = response.rest[0].security.extension.filter( function( e ) {
          return ( e.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris" );
        } );

        var oauthUri = _.get( smartExtension[0].extension[0], "valueUri", "" );
        var baseUri  = oauthUri.slice( 0, oauthUri.lastIndexOf( "/" ) );
        var config   = _.assignIn( {}, oauthConfig, params, { "oauthBaseUrl": baseUri } );

        iscOauthService.configure( config );
        iscSessionStorageHelper.setSessionStorageValue( "fhirMetaData", response );
        return baseUri;
      } );
    }

    return api;


  }


} )();

