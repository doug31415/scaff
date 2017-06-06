(function() {
  'use strict';

  //--------------------
  describe( 'iscForm', function() {
    var suiteConfigured,
        suiteMisconfigured,
        suiteWithData,
        suiteLibrary,
        suiteLiteralModel,
        suiteSimple1,
        suiteSimple2,
        suiteSimple3,
        suiteLayout,
        suiteLiteral,
        suiteLocalAssets;

    // Some intentional mis-configurations to exercise safety nets
    var badFormConfig = {
      formDataApi: {
        // this should normally call the save data API, if the default option is not to be used
        save  : null,
        // this should normally return the data to be saved wrapped with metadata
        wrap  : null,
        // this should normally unwrap the metadata from a saved form
        unwrap: function( formData ) {
          return null;
        }
      }
    };

    var goodFormConfig = {
      additionalModelInit: function( additionalModels, stateParams, formModel ) {
        additionalModels.configuredModel = {
          "foo": "bar"
        };
        return additionalModels;
      }
    };

    var libraryFormConfig = {
      library: {
        // Overrides script1 defined in libraryScript and libraryEmbeddedScript
        script1       : function() {
          return "Set in controller script";
        },
        setModelDotLib: function( model, fieldScope ) {
          _.set( model, 'lib', _.get( model, fieldScope.options.key ) );
        }
      }
    };

    var literalFormConfig = {
      formLiteral: {
        name    : 'Literal FDN',
        sections: [
          {
            fields: [
              {
                key            : 'inputField',
                type           : 'input',
                templateOptions: {
                  label: 'Input field on an FDN literal'
                }
              }
            ]
          }
        ]
      }
    };

    var literalModel = {
      "form": {
        "components": {
          "templates": {
            "input": {
              "text": "set in a literal model"
            }
          }
        }
      }
    };

    var goodButtonConfig = {
      className: 'button-container',
      buttons  : {
        testButton: {
          hide     : function() {
            return false;
          },
          text     : 'Test button',
          className: 'test-button'
        }
      }
    };

    window.useDefaultTranslateBeforeEach();

    beforeEach( module(
      'formly', 'foundation', 'ui.select',
      'isc.http', 'isc.forms', 'iscNavContainer', 'isc.authorization', 'isc.notification', 'isc.directives',
      'isc.templates', 'isc.fauxTable', 'isc.filters',
      function( $provide, devlogProvider ) {
        $provide.value( '$log', console );
        $provide.value( 'apiHelper', mockApiHelper );
        $provide.value( 'iscCustomConfigService', mockCustomConfigService );
        devlogProvider.loadConfig( mockCustomConfigService.getConfig() );
      } )
    );

    beforeEach( inject( function( $rootScope,
      $compile,
      $window,
      $httpBackend,
      $timeout,
      $q,
      formlyApiCheck,
      formlyConfig,
      iscFormsApi,
      iscFormDataApi,
      iscNotificationService,
      iscFormsSectionLayoutService,
      iscFormsValidationService ) {
      formlyConfig.disableWarnings   = true;
      formlyApiCheck.config.disabled = true;

      suiteMain = window.createSuite( {
        $window     : $window,
        $compile    : $compile,
        $httpBackend: $httpBackend,
        $timeout    : $timeout,
        $rootScope  : $rootScope,
        $q          : $q,

        iscFormsSectionLayoutService: iscFormsSectionLayoutService,
        iscFormsApi                 : iscFormsApi,
        iscFormDataApi              : iscFormDataApi,
        iscNotificationService      : iscNotificationService,
        iscFormsValidationService   : iscFormsValidationService
      } );
      mockFormResponses( suiteMain.$httpBackend );
    } ) );

    //--------------------
    describe( 'suiteLiteral', function() {
      beforeEach( function() {
        suiteLiteral = createDirective( getMinimalForm(), {
          localFormConfig: literalFormConfig
        } );
      } );

      it( 'should load a literal FDN definition and work like a REST form', function() {
        var suite      = suiteLiteral,
            model      = suite.controller.internalModel,
            newValue   = 'some value',
            inputField = getControlByName( suite, 'inputField' );

        expect( _.get( model, 'inputField' ) ).toBeUndefined();

        expect( inputField.length ).toBe( 1 );
        inputField.val( newValue ).trigger( 'change' );
        suiteMain.$timeout.flush();

        expect( _.get( model, 'inputField' ) ).toEqual( newValue );
      } );
    } );

    //--------------------
    describe( 'suiteLibrary', function() {
      beforeEach( function() {
        suiteLibrary = createDirective( getMinimalForm( 'library' ), {
          localFormConfig: libraryFormConfig
        } );

        suiteMain.$httpBackend.flush();
        suiteMain.$timeout.flush();
      } );

      it( 'should call the library function when the input field is changed', function() {
        var suite      = suiteLibrary,
            model      = suite.controller.internalModel,
            newValue   = 'some value',
            inputField = getControlByName( suite, 'inputField' );

        expect( _.get( model, 'lib' ) ).toBeUndefined();

        // library.json's inputField has an onChange trigger
        // that calls setModelDotLib in lib
        inputField.val( newValue ).trigger( 'change' );
        suiteMain.$timeout.flush();

        expect( _.get( model, 'inputField' ) ).toEqual( newValue );
        expect( _.get( model, 'lib' ) ).toEqual( newValue );
      } );


      it( 'should load function library definitions in subforms, overriding function definitions that are closer to the form', function() {
        var suite         = suiteLibrary,
            instructions  = suite.element.find( '.formly-field-instructions' ),
            // instructions can have labels, so take the last binding for the field
            instructions1 = instructions.filter( '.script1' ).find( '.ng-binding' ).last(),
            instructions2 = instructions.filter( '.script2' ).find( '.ng-binding' ).last(),
            instructions3 = instructions.filter( '.script3' ).find( '.ng-binding' ).last();

        expect( instructions1.length ).toBe( 1 );
        expect( instructions2.length ).toBe( 1 );
        expect( instructions3.length ).toBe( 1 );

        // Mocks are set up so that:
        //   script3 is only defined in the script linked to the embedded form;
        //   script2 is defined as an override in the main form's script;
        //   script1 is defined as an override in the controller's script.
        // This exercises the order in which overrides are applied.
        expect( instructions1.html() ).toEqual( 'Set in controller script' );
        expect( instructions2.html() ).toEqual( 'Set in form script' );
        expect( instructions3.html() ).toEqual( 'Set in embedded script' );

      } );
    } );

    //--------------------
    describe( 'suiteSimple(s)', function() {
      describe( 'all simple suites', function() {
        beforeEach( function() {
          suiteSimple1 = createDirective( getMinimalForm( 'simple1' ) );
          suiteSimple2 = createDirective( getMinimalForm( 'simple2' ) );
          suiteSimple3 = createDirective( getMinimalForm( 'simple3' ) );

          suiteMain.$httpBackend.flush();
        } );

        //--------------------
        it( 'should have basic directive configuration', function() {
          testSuite( suiteSimple1 );
          testSuite( suiteSimple2 );
          testSuite( suiteSimple3 );

          function testSuite( suite ) {
            var formConfig   = getFormConfig( suite ),
                buttonConfig = getButtonConfig( suite );
            expect( formConfig ).toBeDefined();
            expect( buttonConfig ).toBeDefined();
          }
        } );

        //--------------------
        it( 'should populate a minimally specified form with defaults', function() {
          testSuite( suiteSimple1 );
          testSuite( suiteSimple2 );
          testSuite( suiteSimple3 );

          function testSuite( suite ) {
            var buttonConfig = getButtonConfig( suite );
            expect( _.isFunction( buttonConfig.buttons.submit.onClick ) ).toBe( true );
          }
        } );
      } );

      describe( 'simple suite with a required field', function() {
        beforeEach( function() {
          suiteSimple1 = createDirective( getMinimalForm( 'simple1Required' ),
            {
              localFormConfig: {
                disableSubmitIfFormInvalid: true
              }
            } );

          suiteMain.$httpBackend.flush();
        } );

        //--------------------
        it( 'should disable submit when the form is invalid', function() {
          var suite        = suiteSimple1,
              submitButton = getButton( suite, 'submit' ),
              model        = suite.controller.internalModel;

          expect( submitButton.length ).toBe( 1 );
          expect( submitButton.is( ':disabled' ) ).toBe( true );

          model.aField = 'some value';
          digest( suite );

          expect( submitButton.is( ':disabled' ) ).toBe( false );
        } );
      } );

      describe( 'beforeClick tests', function() {
        //--------------------
        it( 'should not complete submission if beforeClick is rejected', function() {
          createForm( function() {
            return suiteMain.$q.reject();
          } );

          var suite              = suiteSimple1,
              submitButton       = getButton( suite, 'submit' ),
              buttonConfig       = getButtonConfig( suite ),
              submitButtonConfig = buttonConfig.buttons.submit;

          spyOn( submitButtonConfig, 'beforeClick' ).and.callThrough();
          spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
          spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();

          // clicking submit should call the submit api
          submitButton.click();
          suiteMain.$timeout.flush();

          // beforeClick is rejected, so onClick and afterClick should NOT be called
          expect( submitButtonConfig.onClick ).not.toHaveBeenCalled();
          expect( submitButtonConfig.afterClick ).not.toHaveBeenCalled();
        } );

        //--------------------
        it( 'should complete submission once beforeClick is resolved', function() {
          createForm( function() {
            return suiteMain.$q.resolve();
          } );

          var suite              = suiteSimple1,
              submitButton       = getButton( suite, 'submit' ),
              buttonConfig       = getButtonConfig( suite ),
              submitButtonConfig = buttonConfig.buttons.submit;

          spyOn( submitButtonConfig, 'beforeClick' ).and.callThrough();
          spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
          spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();

          // clicking submit should call the submit api
          submitButton.click();
          suiteMain.$timeout.flush();

          // beforeClick is resolved, so onClick and afterClick SHOULD be called
          expect( submitButtonConfig.onClick ).toHaveBeenCalled();

          suiteMain.$httpBackend.flush();
          expect( submitButtonConfig.afterClick ).toHaveBeenCalled();
        } );

        function createForm( beforeClick ) {
          suiteSimple1 = createDirective( getMinimalForm( 'simple1' ), {
            localButtonConfig: {
              buttons: {
                submit: {
                  beforeClick: beforeClick
                }
              }
            }
          } );
          suiteMain.$httpBackend.flush();
        }
      } );

      describe( 'simple suite 1 only', function() {
        beforeEach( function() {
          suiteSimple1 = createDirective( getMinimalForm( 'simple1' ) );

          suiteMain.$httpBackend.flush();
        } );

        //--------------------
        it( 'should save when submit is clicked', function() {
          var suite              = suiteSimple1,
              submitButton       = getButton( suite, 'submit' ),
              model              = suite.controller.internalModel,
              buttonConfig       = getButtonConfig( suite ),
              submitButtonConfig = buttonConfig.buttons.submit;

          spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
          spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();
          spyOn( suiteMain.iscFormDataApi, 'submit' ).and.callThrough();
          spyOn( suiteMain.iscFormDataApi, 'post' ).and.callThrough();

          // simple1 autosaves on model change
          model.aField = 'some value';
          digest( suite );
          expect( suiteMain.iscFormDataApi.post ).toHaveBeenCalled();

          model.aField = 'some other value';
          digest( suite );

          // clicking submit should call the submit api
          submitButton.click();
          suiteMain.$httpBackend.flush();

          expect( submitButtonConfig.onClick ).toHaveBeenCalled();
          expect( submitButtonConfig.afterClick ).toHaveBeenCalled();
          expect( suiteMain.iscFormDataApi.submit ).toHaveBeenCalled();
        } );

        //--------------------
        it( 'should go back when cancel is clicked', function() {
          var suite              = suiteSimple1,
              cancelButtonConfig = getButtonConfig( suite ).buttons.cancel;

          spyOn( cancelButtonConfig, 'onClick' ).and.callThrough();
          spyOn( cancelButtonConfig, 'afterClick' ).and.callThrough();
          spyOn( suiteMain.$window.history, 'back' ).and.callThrough();

          getButton( suite, 'cancel' ).click();

          expect( suiteMain.$window.history.back ).toHaveBeenCalled();
        } );

        //--------------------
        // This tests the iscFormsTemplateService.addInheritedClassNames function
        it( 'should load the base formly class for a custom template', function() {
          var suite       = suiteSimple1,
              customField = getControlByName( suite, 'aCustomField' );

          expect( customField.length ).toBe( 1 );

          // The "customTemplate" type extends the base "input" type,
          // so expect the formly-field wrapper to contain these classes:
          // formly-field-input
          // formly-field-customTemplate
          var formlyField = customField.parentsUntil( '[formly-field]' ).parent();
          var className   = formlyField.attr( 'class' );

          expect( _.includes( className, 'formly-field-input' ) ).toBe( true );
          expect( _.includes( className, 'formly-field-customTemplate' ) ).toBe( true );
        } );
      } );
    } );

    describe( 'simple suite 3 only', function() {
      beforeEach( function() {
        suiteSimple3 = createDirective( getMinimalForm( 'simple3' ) );
        suiteMain.$httpBackend.flush();
      } );


      //--------------------
      it( 'should raise an alert when data API submission returns an error', function() {
        var suite              = suiteSimple3,
            submitButton       = getButton( suite, 'submit' ),
            buttonConfig       = getButtonConfig( suite ),
            submitButtonConfig = buttonConfig.buttons.submit;

        var mockedRejection = suiteMain.$q.defer();
        mockedRejection.reject( 'Flagrant system error' );

        spyOn( suiteMain.iscNotificationService, 'showAlert' ).and.callThrough();
        spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
        spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();
        spyOn( suiteMain.iscFormDataApi, 'submit' ).and.returnValue( mockedRejection.promise );

        expect( submitButton.length ).toBe( 1 );
        submitButton.click();
        suiteMain.$timeout.flush();

        expect( submitButtonConfig.onClick ).toHaveBeenCalled();
        expect( suiteMain.iscNotificationService.showAlert ).toHaveBeenCalled();
        expect( submitButtonConfig.afterClick ).not.toHaveBeenCalled();
      } );

      //--------------------
      it( 'should save when submit is clicked', function() {
        var suite              = suiteSimple3,
            submitButton       = getButton( suite, 'submit' ),
            buttonConfig       = getButtonConfig( suite ),
            submitButtonConfig = buttonConfig.buttons.submit;

        spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
        spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();
        spyOn( suiteMain.iscFormDataApi, 'submit' ).and.callThrough();
        spyOn( suiteMain.iscFormDataApi, 'post' ).and.callThrough();

        // simple3 saves only on submit
        // clicking submit should call the submit api
        submitButton.click();
        suiteMain.$httpBackend.flush();

        expect( submitButtonConfig.onClick ).toHaveBeenCalled();
        expect( submitButtonConfig.afterClick ).toHaveBeenCalled();
        expect( suiteMain.iscFormDataApi.submit ).toHaveBeenCalled();
      } );
    } );

    //--------------------
    describe( 'suiteConfigured', function() {
      beforeEach( function() {
        suiteConfigured = createDirective( getConfiguredForm(), {
          localFormConfig  : goodFormConfig,
          localButtonConfig: goodButtonConfig
        } );
        suiteMain.$httpBackend.flush();
      } );

      //--------------------
      it( 'should load configuration passed to the directive', function() {
        var suite      = suiteConfigured,
            formConfig = getFormConfig( suite );
        expect( formConfig.additionalModels.configuredModel.foo ).toEqual( 'bar' );
      } );

      //--------------------
      it( 'should load custom buttons or a container class passed to buttonConfig', function() {
        var suite = suiteConfigured;

        // A custom button container wrapper class should be rendered
        var buttonContainer = suite.element.find( '.button-container' );
        expect( buttonContainer.length ).toBe( 1 );

        // Custom buttons should be rendered
        var testButton = suite.element.find( '.test-button' );

        expect( testButton.length ).toBe( 1 );
        expect( testButton.html().trim() ).toEqual( 'Test button' );
      } );

      //--------------------
      it( 'should load qdTags in the FDN', function() {
        var suite  = suiteConfigured,
            fdn    = suite.controller.formDefinition.subforms.builtinComponents,
            qdTags = getQdTags( fdn.sections[0].fields );

        // Expect some fields to have qdTags in the static mock FDN
        expect( qdTags.length ).toBeGreaterThan( 0 );

        // Expect all of those qdTags in the mock FDN to be rendered
        _.forEach( qdTags, function( qdTag ) {
          expect( suite.element.find( '[qd-tag="' + qdTag + '"]' ).length ).toBe( 1 );
        } );

        function getQdTags( fields ) {
          var tags = [];

          _.forEach( fields, function( field ) {
            tags.push( _.get( field, 'templateOptions.qdTag' ) );

            if ( field.fieldGroup ) {
              tags = _.concat( tags, getQdTags( field.fieldGroup ) );
            }
          } );

          return _.compact( tags );
        }
      } );

      //--------------------
      it( 'should fail validation in a subform when it contains invalid records', function() {
        var suite              = suiteConfigured,
            submitButton       = getButton( suite, 'submit' ),
            buttonConfig       = getButtonConfig( suite ),
            submitButtonConfig = buttonConfig.buttons.submit,
            model              = suite.controller.internalModel,
            subformRecord1     = {},
            subformRecord2     = {};

        spyOn( submitButtonConfig, 'onClick' ).and.callThrough();
        spyOn( submitButtonConfig, 'afterClick' ).and.callThrough();
        spyOn( suiteMain.iscFormDataApi, 'submit' ).and.callThrough();
        spyOn( suiteMain.iscFormDataApi, 'put' ).and.callThrough();
        spyOn( suite.controller, 'validateFormApi' ).and.callThrough();
        spyOn( suiteMain.iscNotificationService, 'showAlert' ).and.callThrough();

        submitButton.click();

        // Validation should fail
        // The submit.onClick function is only called once the validation in iscFormInternal succeeds
        expect( submitButtonConfig.onClick ).not.toHaveBeenCalled();
        expect( suite.controller.validateFormApi ).toHaveBeenCalled();
        expect( suiteMain.iscNotificationService.showAlert ).toHaveBeenCalled();

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
        suiteMain.$timeout.flush();

        // Validation should still fail due to the required fields in the RequiredSubform fields
        // This exercises the validation for subform records that are invalidated without being shown in the UI
        expect( submitButtonConfig.onClick ).not.toHaveBeenCalled();
        expect( suite.controller.validateFormApi ).toHaveBeenCalled();
        expect( suiteMain.iscNotificationService.showAlert ).toHaveBeenCalled();
      } );

      //--------------------
      it( 'should validate data in a subform', function() {
        var suite = suiteConfigured,
            model = suite.controller.internalModel;

        spyOn( suiteMain.iscFormsValidationService, 'validateForm' ).and.callThrough();

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
        expect( suiteMain.iscFormsValidationService.validateForm ).toHaveBeenCalled();
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
    } );


    //--------------------
    describe( 'suiteMisconfigured', function() {
      beforeEach( function() {
        suiteMisconfigured = createDirective( getConfiguredForm(), {
          localFormConfig: badFormConfig
        } );
        suiteMain.$httpBackend.flush();
      } );

      //--------------------
      it( 'should fall back to default behaviors for poorly configured forms', function() {
        var suite        = suiteMisconfigured,
            buttonConfig = getButtonConfig( suite );
        expect( _.isFunction( buttonConfig.buttons.submit.onClick ) ).toBe( true );
        // TODO -- extend
      } );
    } );


    //--------------------
    describe( 'suiteLayout', function() {
      beforeEach( function() {
        suiteLayout = createDirective( getMinimalForm( 'wizard' ),
          {
            localButtonConfig: suiteMain.iscFormsSectionLayoutService.getWizardButtonConfig()
          }
        );
        suiteMain.$httpBackend.flush();
      } );

      //--------------------
      it( 'should lay out as a wizard', function() {
        var suite = suiteLayout,
            nextButton,
            prevButton,
            submitButton;

        // wizard.json is 2 sections
        getControls();
        expect( nextButton.length ).toBe( 1 );
        expect( prevButton.length ).toBe( 0 );
        expect( submitButton.length ).toBe( 0 );

        nextButton.click();

        getControls();
        expect( nextButton.length ).toBe( 0 );
        expect( prevButton.length ).toBe( 1 );
        expect( submitButton.length ).toBe( 1 );

        function getControls() {
          nextButton   = suite.element.find( '.wizard-next-btn' );
          prevButton   = suite.element.find( '.wizard-prev-btn' );
          submitButton = suite.element.find( '.wizard-submit-btn' );
        }
      } );
    } );

    //--------------------
    describe( 'suiteWithData', function() {
      beforeEach( function() {
        suiteWithData = createDirective( getFormWithData() );
        suiteMain.$httpBackend.flush();
      } );

      //--------------------
      it( 'should parse the form data ID into an int', function() {
        var parsedId = suiteWithData.controller.parsedFormDataId;
        expect( parsedId ).not.toBe( "3" );
        expect( parsedId ).toBe( 3 );
      } );

      //--------------------
      it( 'should load form data from the ID', function() {
        var suite         = suiteWithData,
            mockData      = _.find( mockFormStore.formData, { id: 3 } ).data,
            expectedModel = suite.controller.internalModel,
            buttonConfig  = getButtonConfig( suite );

        expect( expectedModel.form.components.templates )
          .toEqual( mockData.form.components.templates );
        expect( buttonConfig.buttons.submit.onClick ).toBeDefined();
      } );

    } );

    describe( 'suiteWithData - view mode', function() {
      beforeEach( function() {
        suiteWithData = createDirective( getFormWithData( 'view' ) );
        suiteMain.$httpBackend.flush();
      } );


      //--------------------
      it( 'should load an existing form in view mode', function() {
        var suite        = suiteWithData,
            buttonConfig = getButtonConfig( suite );

        expect( buttonConfig.buttons.submit.hide ).toBe( true );

        var subform   = getControlByName( suite, 'subform.components' ).filter( '.subform' ),
            fauxTable = subform.find( 'faux-table' ),
            tableRows = fauxTable.find( '.tr' );

        expect( subform.length ).toBe( 1 );
        expect( fauxTable.length ).toBe( 1 );
        expect( tableRows.length ).toBe( 2 ); // one header row, one data row
      } );
    } );

    //--------------------
    describe( 'suiteLiteralModel', function() {
      beforeEach( function() {
        suiteLiteralModel = createDirective( getConfiguredForm(), {
          localModel: literalModel
        } );

        suiteMain.$httpBackend.flush();
        suiteMain.$timeout.flush();
      } );

      it( 'should load a literal model passed in', function() {
        var suite           = suiteLiteralModel,
            model           = suite.controller.internalModel,
            embeddedWrapper = 'form.components',
            inputKey        = 'templates.input.text',
            expectedValue   = getLocalModel(),
            inputField      = getControlByName( suite, inputKey ),
            newValue        = 'some new value';

        expect( inputField.length ).toBe( 1 );
        expect( getModel() ).toEqual( expectedValue );
        expect( inputField.val() ).toEqual( expectedValue );

        inputField.val( newValue ).trigger( 'change' );
        suiteMain.$timeout.flush();

        // The form's model should still update from UI changes
        expect( getModel() ).toEqual( newValue );

        // The literal model passed in should not be updated
        expect( getLocalModel() ).toEqual( expectedValue );

        function getLocalModel() {
          return _.get( literalModel, [embeddedWrapper, inputKey].join( '.' ) );
        }

        function getModel() {
          return _.get( model, [embeddedWrapper, inputKey].join( '.' ) );
        }
      } );

    } );

    describe( 'suiteLocalAssets', function() {
      it( 'should load an FDN definition from assets', function() {
        spyOn( suiteMain.iscFormsApi, 'getFdnAsset' ).and.callThrough();
        spyOn( suiteMain.iscFormsApi, 'getFormDefinition' );

        suiteLocalAssets = createDirective( getMinimalForm( {
          formKey: 'localFdnTest'
        } ), {
          localFormConfig: {
            loadFormAsAsset: true
          }
        } );

        suiteMain.$httpBackend.flush();
        suiteMain.$timeout.flush();

        var suite        = suiteLocalAssets,
            formTitle    = suite.element.find( '.form-title' ),
            sectionTitle = suite.element.find( '.form-section' ),
            instructions = suite.element.find( '.instructions' );

        // Asset-based FDN goes through getFdnAsset
        // Linked subforms share the "loadFormAsAsset" configuration
        expect( suiteMain.iscFormsApi.getFdnAsset ).toHaveBeenCalledWith( 'localFdnTest' );
        expect( suiteMain.iscFormsApi.getFdnAsset ).toHaveBeenCalledWith( 'subforms/localFdnSubformTest' );
        expect( suiteMain.iscFormsApi.getFormDefinition ).not.toHaveBeenCalled();

        expect( formTitle.length ).toBe( 1 );
        expect( formTitle.html() ).toContain( 'Asset Form' );

        expect( sectionTitle.length ).toBe( 1 );
        expect( sectionTitle.html() ).toContain( 'Form loaded as an FDN asset' );

        expect( instructions.length ).toBe( 1 );
        expect( instructions.html() ).toContain( 'Subform loaded as an FDN asset' );
      } );
    } )

  } );
})();