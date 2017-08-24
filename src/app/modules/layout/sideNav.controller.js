/**
 * Created by  on 2/8/2016, 8:57:49 AM.
 */

/**
 *
 * Add code like this to the state for which you want to add a second-level navigation
 *
 *
 function getStates() {
    return {
      'index.components'     : {
        url           : 'components',
        templateUrl   : 'layout/sideNav.html',
        controller    : 'sideNavController as sideNavCtrl',
        state         : 'index.components',
        translationKey: "Components",
        roles         : ["*"],
        displayOrder  : 2,
        resolve       : {
          \/* @ngInject *\/
         secondLevel: function ($state) {
          var self = this;
          return getChildrenStates(); //returns ["index.components.grid"] state object

          function getChildrenStates() {
            return $state.get().filter(function (state) {
              return isDirectChild(state);
            });

            function isDirectChild(state) {
              var statename = state.state || "";
              return _.startsWith(statename, self.state + ".") && _.includes(statename.substr(self.state.length + 1), ".") === false;
            }
          }
        }
      },
      'index.components.grid': {
        url           : '/grid',
        state         : 'index.components.grid',
        templateUrl   : 'components/grid.html',
        controller    : 'componentsController as componentsCtrl',
        translationKey: 'Grid',
        roles         : ['*']
      }
    };
 */
( function() {

  'use strict';

  angular.module( 'layout' )
    .controller( 'sideNavController', sideNavController );

  function sideNavController( $state, devlog, secondLevel ) {
    var log = devlog.channel( 'sideNavController' );
    log.debug( 'sideNavController LOADED' );

    // ----------------------------
    // vars
    // ----------------------------
    var self      = this;
    log.log( '$state.current', $state.current );
    log.log( '$state.current.name', $state.current.name );
    log.log( 'secondLevel', secondLevel );

    self.navItems = secondLevel;

  }// END CLASS

} )();
