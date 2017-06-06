( function() {
  'use strict';

  angular.module( 'isc.oauth' )
    .factory( 'iscOauthInterceptor', iscOauthInterceptor );

  /* @ngInject */
  function iscOauthInterceptor( $injector, devlog, $q ) {//jshint ignore:line
    var log = devlog.channel( 'iscOauthInterceptor' );

    var $http;
    var iscSessionModel;
    var iscOauthService;
    // ----------------------------
    // factory class
    // ----------------------------

    var factory = {
      request      : request,
      responseError: responseError
    };

    return factory;

    // ----------------------------
    // functions
    // ----------------------------
    function request( config ) {//jshint ignore:line

      //dynamically injecting it to prevent circular Dependency Injections.
      $http           = $http || $injector.get( '$http' );
      iscSessionModel = iscSessionModel || $injector.get( 'iscSessionModel' );
      iscOauthService = iscOauthService || $injector.get( 'iscOauthService' );

      if ( iscSessionModel.isAuthenticated() && !_.get( config, "headers.AUTHORIZATION", false ) ) {
        var token = iscOauthService.get( 'accessToken' );
        _.set( config, "headers.AUTHORIZATION", "BEARER " + token );
        _.set( $http, "defaults.headers.common.AUTHORIZATION", "BEARER " + token );
      }
      return config;
    }

    function responseError( response ) {

      // $rootScope.$emit( AUTH_EVENTS.notAuthenticated, response );
      return $q.reject( response );
    }
  }// END CLASS

} )();
