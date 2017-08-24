/**
 * Created by  on 1/5/2016, 3:56:02 PM.
 */

( function() {

  'use strict';

  angular
    .module( 'login', ['ui.router', 'isc.common'] )

    /* @ngInject */
    .config( function( iscStateProvider, $urlRouterProvider ) {
      iscStateProvider.state( getStates() );
    } );

  function getStates() {
    return {
      'unauthenticated.login': {
        url           : 'login',
        state         : 'unauthenticated.login',
        templateUrl   : 'login/login.html',
        translationKey: 'Login',
        controller    : 'loginController as loginCtrl',
        layout        : "layout/tpls/blank.html",
        roles         : ['*'],
        landingPageFor: ['*']
      }
    };
  }
} )();
