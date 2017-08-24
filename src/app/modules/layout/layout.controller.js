/**
 * Created by hzou on 2/8/2016, 8:57:49 AM.
 */

( function() {
  'use strict';

  angular.module( 'layout' )
    .controller( 'layoutController', layoutController );

  function layoutController( devlog, $rootScope, $state ) {
    var log = devlog.channel( 'layoutController' );
    log.debug( 'layoutController LOADED' );

    // ----------------------------
    // vars
    // ----------------------------
    var self = this;

    warnIfDeprecatedLayout( $state.next );

    _.merge( self, {
      //adding additional support for placing layout property in "state.data" (backwards compatible)
      layout     : $state.next.layout || _.get( $state, 'next.data.layout' ),
      layoutClass: getSecondLevelStateName()
    } );

    /**
     * updates the layout and layoutClass based on the next state
     */
    $rootScope.$on( '$stateChangeStart', function( event, state, params ) {

      warnIfDeprecatedLayout( state );

      //adding additional support for placing layout property in "state.data" (backwards compatible)
      self.layout      = state.layout || _.get( state, 'data.layout' );
      self.layoutClass = getSecondLevelStateName();
    } );

    /**
     * @description
     *  it takes the second level $state name and kebab case the name
     *  e.g. "authenticated.patientInfo.medications" => returns "patient-info"
     */
    function getSecondLevelStateName() {
      return _.kebabCase( $state.next.name.split( '.' )[1] || '' );
    }

    function warnIfDeprecatedLayout( state ) {
      if ( state.layout ) {
        log.warn( '[deprecated] "state.layout" property has been deprecated.' );
        log.warn( 'Please use "state.data.layout" at the highest applicable state level to allow data propagation to descendant states.' );
        log.warn( 'state ... ' + state.state );
      }
    }
  }// END CLASS

} )();
