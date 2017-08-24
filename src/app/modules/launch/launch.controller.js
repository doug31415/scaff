
( function() {
  'use strict';

  angular.module( 'launch' )
    .controller( 'launchController', launchController );

  /* @ngInject */
  function launchController ( $rootScope, oauthResponse, iscSessionModel, AUTH_EVENTS ) {
    if ( !_.isEmpty( oauthResponse ) ) {
      var loginResponse = angular.copy( oauthResponse );
      _.set( loginResponse, "UserData.userRole", "authenticated" );
      iscSessionModel.create( loginResponse, true );

    } else {
      $rootScope.$emit( AUTH_EVENTS.notAuthenticated );
    }
  }// END CLASS

} )();
