/**
 * Created by douglasgoodman on 11/24/14.
 */

( function() {
  'use strict';

  angular.module( 'iscNavContainer', ['ui.router',
    'pascalprecht.translate',
    'isc.configuration',
    'isc.core',
    'isc.authentication',
    'isc.authorization',
    'isc.states'] )
    .run( function( $rootScope, $state ) {
      //needed for support dynamic title change
      $rootScope.$state = $state;
    } );

} )();
