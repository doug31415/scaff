/**
 * Created by hzou on 12/13/15.
 */

( function() {
  'use strict';

  angular
    .module( 'home' )
    .controller( 'homeController', homeController );

  /* @ngInject */
  function homeController( devlog ) {
    var log = devlog.channel( 'homeController' );
    log.debug( 'homeController LOADED' );

    // ----------------------------
    // vars
    // ----------------------------
    var self = this;

  }// END CLASS

  // ----------------------------
  // injection
  // ----------------------------

} )();
