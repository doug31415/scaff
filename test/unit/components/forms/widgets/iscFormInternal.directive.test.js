(function() {
  'use strict';

  describe( 'iscFormInternal', function() {
    var suiteForm,
        suiteInternal,
        suiteSubform;

    beforeEach( module(
      'formly', 'foundation',
      'isc.http', 'isc.forms', 'iscNavContainer', 'isc.authorization', 'isc.notification', 'isc.directives',
      'isc.templates',
      function( $provide, devlogProvider ) {
        $provide.value( '$log', console );
        $provide.value( 'apiHelper', mockApiHelper );
        $provide.value( 'iscCustomConfigService', mockCustomConfigService );
        devlogProvider.loadConfig( mockCustomConfigService.getConfig() );
      } )
    );

    beforeEach( inject( function( $rootScope, $compile, $window, $httpBackend, $timeout,
                                  formlyApiCheck, formlyConfig,
                                  iscFormDataApi, iscNotificationService, iscFormsValidationService ) {
      formlyConfig.disableWarnings   = true;
      formlyApiCheck.config.disabled = true;

      suiteMain = window.createSuite( {
        $window     : $window,
        $compile    : $compile,
        $httpBackend: $httpBackend,
        $timeout    : $timeout,
        $rootScope  : $rootScope,

        formDataApi        : iscFormDataApi,
        notificationService: iscNotificationService,
        validationService  : iscFormsValidationService
      } );
      mockFormResponses( suiteMain.$httpBackend );

      // Create an isc-form to get what would normally be passed to isc-form-internal
      suiteForm = createDirective( getConfiguredForm(), {
        localFormConfig  : {},
        localButtonConfig: {}
      } );
      suiteMain.$httpBackend.flush();

      suiteInternal = createDirective( getInternalForm(), {
        formCtrl: suiteForm.controller
      } );

      suiteInternal.controller = suiteInternal.$isolateScope.formInternalCtrl;

      suiteSubform = createDirective( getSubform(), {
        formInternalCtrl: suiteInternal.controller
      } );

      suiteSubform.controller = suiteSubform.$isolateScope.subformCtrl;
    } ) );

    
    //--------------------
    it( 'should change page when the selector is changed', function() {
      var suite         = suiteInternal,
          subformConfig = suite.controller.multiConfig;

      spyOn( subformConfig, 'selectPage' ).and.callThrough();

      expect( getPageIndex() ).toEqual( 0 );
      subformConfig.selectPage( 1 );
      expect( getPageIndex() ).toEqual( 1 );

      function getPageIndex() {
        return _.indexOf( subformConfig.selectablePages, subformConfig.currentPage );
      }
    } );


    //--------------------
    it( 'should show page 5 once the model is updated', function() {
      var suite         = suiteInternal,
          subformConfig = suite.controller.multiConfig,
          model         = suite.controller.model,
          lastPage      = subformConfig.pages[4],
          value         = 'something';

      spyOn( suiteMain.formDataApi, 'post' ).and.callThrough();

      expect( model.RequiredInput ).toBeUndefined();
      expect( lastPage._isHidden ).toBe( true );

      // Enter a value for RequiredInput
      getControlByName( suite, 'RequiredInput' )
        .val( value )
        .trigger( 'change' );
      digest( suite );

      expect( model.RequiredInput ).toEqual( value );
      expect( lastPage._isHidden ).toBe( false );
      // This form is configured to autosave on page change
      expect( suiteMain.formDataApi.post ).not.toHaveBeenCalled();

      // Change page to trigger saving and cover page watches
      subformConfig.selectPage( 2 );
      digest( suite );
      expect( suiteMain.formDataApi.post ).toHaveBeenCalled();
    } );


    //--------------------
    it( 'should run validation when submit is clicked', function() {
      var suite              = suiteForm,
          submitButton       = getButton( suite, 'submit' ),
          buttonConfig       = getButtonConfig( suite ),
          submitButtonConfig = buttonConfig.submit,
          model              = suite.controller.model,
          subformRecord1     = {},
          subformRecord2     = {},
          subformRecordData  = {
            RequiredInputInASubform : "some data",
            RequiredInputInASubform2: "some other data"
          };

      spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
      spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();
      spyOn( suiteMain.formDataApi, 'post' ).and.callThrough();
      spyOn( suiteMain.formDataApi, 'put' ).and.callThrough();
      spyOn( suite.controller, 'validateFormApi' ).and.callThrough();
      spyOn( suiteMain.notificationService, 'showAlert' ).and.callThrough();

      submitButton.click();

      // Validation should fail
      // The submit.onClick function is only called once the validation in iscFormInternal succeeds
      expect( submitButtonConfig.onClick ).not.toHaveBeenCalled();
      expect( suite.controller.validateFormApi ).toHaveBeenCalled();
      expect( suiteMain.notificationService.showAlert ).toHaveBeenCalled();

      // Set the RequiredInput and add two empty records to the RequiredSubform
      getControlByName( suite, 'RequiredInput' )
        .val( 'some value' )
        .trigger( 'change' );

      // Adding objects directly to subform model, to bypass validation
      // This normally cannot be done through the UI but could be done through a script or event
      model.RequiredSubform = [];
      model.RequiredSubform.push( subformRecord1 );
      model.RequiredSubform.push( subformRecord2 );

      submitButton.click();

      // Validation should still fail due to the required fields in the RequiredSubform fields
      // This exercises the validation for subform records that are invalidated without being shown in the UI
      expect( submitButtonConfig.onClick ).not.toHaveBeenCalled();
      expect( suite.controller.validateFormApi ).toHaveBeenCalled();
      expect( suiteMain.notificationService.showAlert ).toHaveBeenCalled();

      _.extend( subformRecord1, subformRecordData );
      _.extend( subformRecord2, subformRecordData );
      suiteMain.$timeout.flush();
      submitButton.click();
      suiteMain.$timeout.flush();

      // Validation should now succeed
      expect( submitButtonConfig.onClick ).toHaveBeenCalled();
      expect( suite.controller.validateFormApi ).toHaveBeenCalled();
      suiteMain.$httpBackend.flush();
      expect( submitButtonConfig.afterClick ).toHaveBeenCalled();
      expect( suiteMain.formDataApi.post ).toHaveBeenCalled();
    } );


    //--------------------
    it( 'should close a subform when cancel is clicked - Modal and Inline', function() {
      // Open a subform of each editAs type, enter a field, and click cancel
      test ('testSubformPage', true);
      test( 'testSubformInline' );
      test( 'testSubformModal' );

      function test( subformName, isFullPage ) {
        var suite     = suiteSubform,
            subform   = getControlByName( suite, subformName ).filter( '.subform' ),
            addButton = subform.find( 'button.embedded-form-add' );

        expect( addButton.length ).toBe( 1 );
        expect( subform.length ).toBe( 1 );

        // Open the subform
        addButton.click();
        digest( suite );

        var cancelButton = suite.element.find( '.embedded-form-cancel' ),
            shownForm    = subform.find( '.formly' ),
            inputField   = getControlByName( suite, 'aField' );

        // Verify it opened, change a field
        if ( isFullPage ) {
          spyOn(suite.controller.childConfig, 'onCancel').and.callThrough();
        }
        else {
          expect( shownForm.length ).toBe( 1 );
        }
        expect( cancelButton.length ).toBe( 1 );
        expect( inputField.length ).toBe( 1 );

        inputField.val( 'some value' ).trigger( 'change' );
        cancelButton.click();
        digest( suite );

        // Click cancel to close it
        cancelButton = suite.element.find( '.embedded-form-cancel' );
        shownForm    = subform.find( '.formly' );
        inputField   = getControlByName( suite, 'aField' );

        expect( cancelButton.length ).toBe( 0 );
        expect( inputField.length ).toBe( 0 );

        if (isFullPage) {
          expect (suite.controller.childConfig.onCancel).toHaveBeenCalled();
        }
        else {
          expect( shownForm.length ).toBe( 0 );
        }
      }
    } );


    //--------------------
    it( 'should validate data in a subform', function() {
      var suite = suiteForm,
          model = suite.controller.model;

      spyOn( suiteMain.validationService, 'validateForm' ).and.callThrough();

      // Set the RequiredInput
      getControlByName( suite, 'RequiredInput' )
        .val( 'some value' )
        .trigger( 'change' );

      // Open the subform, enter a record, and submit the subform
      var subform = getControlByName( suite, 'RequiredSubform' ).filter( '.subform' );
      subform.find( 'button.embedded-form-add' ).click();

      var requiredInputs = getControlByName( suite, 'RequiredInputInASubform' ),
          subformSave    = suite.element.find( 'button.embedded-form-save' );

      requiredInputs.first().val( 'required field 1' ).trigger( 'change' );

      suiteMain.$timeout.flush();
      subformSave.click();

      // Only one of the required inputs has been entered, so validation for the subform fails
      expect( suiteMain.validationService.validateForm ).toHaveBeenCalled();
      expect( model.RequiredSubform ).toBeUndefined();

      requiredInputs.last().val( 'required field 2' ).trigger( 'change' );

      suiteMain.$timeout.flush();
      subformSave.click();

      // Update is performed on ngModelController, so trigger change on
      // the element with that ng-model
      subform.trigger( 'change' );
      digest( suite );

      expect( _.isArray( model.RequiredSubform ) ).toBe( true );
      expect( model.RequiredSubform.length ).toEqual( 1 );
    } );

    //--------------------
    it( 'should allow editing of data in a subform', function() {
      // TODO
    });
    } );
})();