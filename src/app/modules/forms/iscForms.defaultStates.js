/**
 * Created by probbins on 8/11/2016
 */

( function() {
  'use strict';

  /* @ngInject */
  angular.module( 'isc.forms' )
    .config( function( iscStateProvider ) {
      iscStateProvider.state( getDefaultStates() );
    } );

  function getDefaultStates() {
    return {
      'index.form'         : {
        state      : 'index.form',
        url        : 'forms/:mode/:formKey?formDataId',
        templateUrl: 'forms/iscForms.html',
        controller : 'iscFormsController as formsCtrl',
        roles      : ['*']
      },
      'index.formByVersion': {
        state      : 'index.formByVersion',
        url        : 'forms/:mode/:formKey/:formVersion?formDataId',
        templateUrl: 'forms/iscForms.html',
        controller : 'iscFormsController as formsCtrl',
        roles      : ['*']
      }
    };
  }

} )();
