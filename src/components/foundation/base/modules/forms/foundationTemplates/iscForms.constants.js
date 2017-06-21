( function() {
  'use strict';

  angular
    .module( 'isc.forms' )
    .constant( 'FORMS_EVENTS', {
      resetFormModel          : 'iscFormsResetFormModel',
      setFormModel            : 'iscFormsSetFormModel',
      showSubform             : 'iscFormsShowSubform',
      hideSubform             : 'iscFormsHideSubform',
      subformDefinitionChanged: 'iscFormsSubformDefinitionChanged',
      collectionEditStarted   : 'iscFormsCollectionEditStarted',
      collectionEditSaved     : 'iscFormsCollectionEditSaved',
      collectionEditCanceled  : 'iscFormsCollectionEditCanceled',
      collectionItemRemoved   : 'iscFormsCollectionItemRemoved',
      collectionInfoEmitted   : 'iscFormsCollectionInfoEmitted',
      formValidationSuccess   : 'iscFormsValidationSuccess',
      formValidationError     : 'iscFormsValidationError'
    } );

} )();
