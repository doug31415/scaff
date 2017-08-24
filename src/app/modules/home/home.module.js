/**
 * Created by hzou on 12/13/15.
 */

( function() {

  'use strict';

  angular
    .module( 'home', ['ui.router', 'isc.common'] )
    .config( function( iscStateProvider, $urlRouterProvider ) {
      iscStateProvider.state( getStates() );
    } );

  /**
   * @description this is where module specific states are defined.
   *  Be sure not to make any method name or the structural changes; any changes may prevent ```slush isc:page``` from working properly
   *
   * @returns {} -- UI router states
   */
  function getStates() {
    return {
      'authenticated.home': {
        url           : 'home',
        templateUrl   : 'home/home.html',
        controller    : 'homeController as homeCtrl',
        state         : 'authenticated.home',
        translationKey: 'My Home',
        roles         : ["*"],
        landingPageFor: ["provider"],
        displayOrder  : 1
      }
    };
  }
} )();
