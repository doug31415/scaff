( function() {
  'use strict';

  /**
   * Wraps the formlyConfig service:
   * registerBaseType should be called (once), then registerType may be used to register any other types.
   *
   * The base type provides common functionality for all formly templates and their controllers. This includes:
   *
   * _                  : makes lodash available in FDN expressions
   * moment             : makes moment available in FDN expressions
   * formModel          : a reference to the root formly model. This is useful for expressions that may need to modify
   *                      model values outside their own control or section scope
   * hasCustomValidator : a function that takes a custom validator name and returns whether that validator is used on
   *                      this control. This is useful for making custom validators reusable by defining them once on
   *                      the control template and then including them by name in controls that should use them.
   * getDefaultViewValue: a function that returns the display for a view mode field which uses the default view template.
   *
   */

  /* @ngInject */
  angular
    .module( 'isc.forms' )
    .factory( 'iscFormsTemplateService', iscFormsTemplateService );

  /**
   * @ngdoc factory
   * @memberOf isc.forms
   * @name iscFormsTemplateService
   * @param $filter
   * @param $window
   * @param $sce
   * @param iscCustomConfigService
   * @param formlyConfig
   * @param hsModelUtils
   * @returns {{isTypeRegistered: isTypeRegistered, getRegisteredType: getRegisteredType, registerWrapper: *, registerBaseType: registerBaseType, registerType: registerType, appendWrapper: appendWrapper}}
   * @description
   * Wraps the formlyConfig service:
   * registerBaseType should be called (once), then registerType may be used to register any other types.
   *
   * The base type provides common functionality for all formly templates and their controllers. This includes:
   *
   * _                  : makes lodash available in FDN expressions
   * moment             : makes moment available in FDN expressions
   * formModel          : a reference to the root formly model. This is useful for expressions that may need to modify
   *                      model values outside their own control or section scope
   * hasCustomValidator : a function that takes a custom validator name and returns whether that validator is used on
   *                      this control. This is useful for making custom validators reusable by defining them once on
   *                      the control template and then including them by name in controls that should use them.
   * getDefaultViewValue: a function that returns the display for a view mode field which uses the default view template.
   *
   */
  /* @ngInject */
  function iscFormsTemplateService( $filter, $window, $sce, $q, $translate, formlyConfig,
    iscNavContainerModel, iscSessionModel,
    iscFormDataApi, iscFormsCodeTableApi,
    iscCustomConfigService, iscFormsSectionLayoutService, iscFormsTransformService,
    hsModelUtils ) {
    var baseType = '__iscFormsBase__';

    var config           = iscCustomConfigService.getConfig(),
        moduleConfig     = _.get( config, 'moduleApi', {} ),
        formsConfig      = _.get( config, 'forms', {} ),
        baseCtrlConfig   = {},
        updateOnExcluded = formsConfig.updateOnExcluded,
        widgetLibrary    = [],
        functionLibrary  = {
          _     : _,
          moment: moment
        },
        customButtonDefaults,
        customFormDefaults;

    // YYYY-MM-DDThh:mm:ss.xxxZ   or
    // YYYY-MM-DD hh:mm:ss.xxxxxx or
    // YYYY-MM-DD hh:mm:ss
    var isoRE = /^\d{4}[-\/]{1}\d{2}[-\/]{1}\d{2}[T ]{1}\d{2}:{1}\d{2}:{1}\d{2}(.{1}\d{3,}Z?)?$/;

    var defaultViewConfig = {
      getValue   : defaultGetValue,
      wrapContent: defaultWrapContent
    };

    iscFormsTransformService.initTransforms( {
      baseType: baseType
    } );

    var service = {
      appendWrapper            : appendWrapper,
      configureDefaultViewMode : configureDefaultViewMode,
      getButtonDefaults        : getButtonDefaults,
      getFieldsForEmbeddedForm : getFieldsForEmbeddedForm,
      getFormDefaults          : getFormDefaults,
      getGlobalFunctionLibrary : getGlobalFunctionLibrary,
      getSectionForEmbeddedForm: getSectionForEmbeddedForm,
      getRegisteredType        : getRegisteredType,
      getWidgetList            : getWidgetList,
      initListControlWidget    : initListControlWidget,
      isTypeRegistered         : isTypeRegistered,
      isWrapperRegistered      : isWrapperRegistered,
      loadCodeTables           : loadCodeTables,
      overrideWidgetList       : overrideWidgetList,
      registerBaseType         : registerBaseType,
      registerButtonDefaults   : registerButtonDefaults,
      registerFormDefaults     : registerFormDefaults,
      registerGlobalLibrary    : registerGlobalLibrary,
      registerType             : registerType,
      removeWrapper            : removeWrapper,
      registerWrapper          : formlyConfig.setWrapper
    };

    return service;

    /**
     * @description Configures the default view mode functions
     * @param {Object} config - Takes getValue(value, fieldDefinition) and wrapContent(value) functions.
     * getValue takes the raw data model value (which may be an object) and the fdn definition for the field
     * and should return a string to display.
     * wrapContent takes this string to display and should return a string or sanitized html to render on the form.
     */
    function configureDefaultViewMode( config ) {
      extendConfig( 'getValue' );
      extendConfig( 'wrapContent' );

      function extendConfig( name ) {
        defaultViewConfig[name] = _.isFunction( config[name] ) ? config[name] : defaultViewConfig[name];
      }
    }

    /**
     * @description Registers default buttons for all forms using this service. These will automatically be
     * retrieved by instances of iscForm, or may be programmatically retrieved with getButtonDefaults and extended.
     * @param {Object|Function} defaults - default options for buttons. If a function, takes arguments for
     * the form mode (edit or view) and the sectionLayout, and it should return a buttonConfig object.
     * If an object, it should be a buttonConfig object.
     */
    function registerButtonDefaults( defaults ) {
      customButtonDefaults = defaults;
    }

    /**
     * @memberOf iscFormsTemplateService
     * @description Gets the default configuration for form buttons. If no custom configuration is registered
     * with registerButtonDefaults, this will return an object with a cancel button that navigates back one
     * history section, and a submit button which calls the configured formDataApi.submit function.
     * @param {String} mode - The edit/view mode of the containing form
     * @param {String} sectionLayout - The sectionLayout setting of the containing form
     * @returns {{cancel: {onClick: function, afterClick: function, className: string, text: string}, submit: {onClick: function, afterClick: function, cssClass: string, text: string}}}
     */
    function getButtonDefaults( mode, sectionLayout ) {
      var customDefaults,
          sectionLayoutDefaults = {},
          defaultButtonConfig   = {
            className: '',
            buttons  : {
              cancel: {
                onClick   : _.noop,
                afterClick: afterCancel,
                className : 'cancel button large float-left',
                text      : mode === 'view' ? $translate.instant( 'Back' ) : $translate.instant( 'Cancel' ),
                order     : 1
              },
              submit: {
                onClick   : onSubmit,
                afterClick: afterSubmit,
                className : 'button large float-right',
                text      : $translate.instant( 'Submit' ),
                hide      : mode === 'view',
                order     : 2
              }
            }
          };

      // Handle custom service-level defaults
      if ( customButtonDefaults ) {
        if ( _.isFunction( customButtonDefaults ) ) {
          customDefaults = customButtonDefaults.call( this, mode, sectionLayout );
        }
        else if ( _.isObject( customButtonDefaults ) ) {
          customDefaults = customButtonDefaults;
        }
      }

      // Additional defaults by section layout type
      switch ( sectionLayout ) {
        case 'wizard' :
          sectionLayoutDefaults = iscFormsSectionLayoutService.getWizardButtonConfig();
          break;
      }

      // Custom defaults override all system defaults, including sectionLayout-specific buttons
      return customDefaults || _.defaultsDeep( {}, sectionLayoutDefaults, defaultButtonConfig );

      function onSubmit( context ) {
        var configuredDataApi = context.formConfig.formDataApi;

        // Default api for submitting a form is to submit to iscFormDataApi
        var wrappedData = configuredDataApi.wrap( context );
        return configuredDataApi.submit( wrappedData, context.options.formState._id, context );
      }

      function afterSubmit() {
        iscNavContainerModel.navigateToUserLandingPage();
      }

      function afterCancel() {
        $window.history.back();
      }
    }

    /**
     * @memberOf iscFormsTemplateService
     * @description Registers default form configuration for all forms using this service. This configuration will
     * automatically be retrieved by instances of iscForm, or may be programmatically retrieved with getFormDefaults
     * and extended.
     * @param {Object} defaults
     */
    function registerFormDefaults( defaults ) {
      customFormDefaults = defaults;
    }

    /**
     * @memberOf iscFormsTemplateService
     * @description Gets the default configuration for form options. If no custom configuration is registered
     * with registerFormDefaults, this will return an object with default endpoints for the formDataApi (based on
     * the app's configuration) and an empty additionalModels object.
     * @returns {{formDataApi: { wrap : function, unwrap: function, load: function, save: function, submit: function }, additionalModels: {}}}
     */
    function getFormDefaults() {
      // Defaults for formDataApi property -- use iscFormDataApi
      var formDataApi = {
        wrap  : wrapDefault,
        unwrap: unwrapDefault,
        load  : loadDefault,
        save  : saveDefault,
        submit: submitDefault
      };

      return customFormDefaults || {
          formDataApi     : formDataApi,
          additionalModels: {}
        };

      function wrapDefault( formScope ) {
        var formData       = formScope.model,
            formState      = formScope.options.formState,
            formDefinition = formScope.formDefinition.form;

        // Wrap data with additional information and metadata
        return {
          additionalModels: formScope.additionalModels,
          formData        : {
            formKey    : formState._formKey,
            formName   : formDefinition.name,
            formVersion: formState._formVersion,
            id         : formState._id,
            data       : formData
          }
        };
      }

      function unwrapDefault( responseData ) {
        return _.get( responseData, 'data', {} );
      }

      function loadDefault( id, formConfig ) {
        if ( id !== undefined ) {
          return iscFormDataApi.get( id, getConfiguredUrl( 'get', { formConfig: formConfig } ) );
        }
        else {
          return $q.when( {} );
        }
      }

      function saveDefault( formData, id, formScope ) {
        if ( id !== undefined ) {
          return iscFormDataApi.put( id, formData, getConfiguredUrl( 'put', formScope ) );
        }
        else {
          return iscFormDataApi.post( formData, getConfiguredUrl( 'post', formScope ) )
            .then( function( form ) {
              formScope.options.formState._id = form.id;
              return form;
            } );
        }
      }

      function submitDefault( formData, id, formScope ) {
        return iscFormDataApi.submit( id, formData, getConfiguredUrl( 'submit', formScope ) )
          .then( function( form ) {
            formScope.options.formState._id = form.id;
            return form;
          } );
      }

      function getConfiguredUrl( verb, formScope ) {
        return _.get( formScope.formConfig, 'formDataApi.urls.' + verb );
      }
    }

    /**
     * Gets the list of fields that an embeddedForm(Collection) should use
     * @param field - The field definition
     * @param subforms - The list of subforms
     * @returns {Array}
     */
    function getFieldsForEmbeddedForm( field, subforms ) {
      var section = getSectionForEmbeddedForm( field, subforms );
      return _.get( section, 'fields', [] );
    }

    /**
     * Returns the section that an embeddedForm(Collection) refers to.
     * @param field - The field definition
     * @param subforms - The list of subforms
     * @returns {Object}
     */
    function getSectionForEmbeddedForm( field, subforms ) {
      var embeddedSection  = _.get( field, 'data.embeddedSection' ),
          embeddedType     = _.get( field, 'data.embeddedType' ),
          embedAllSections = _.get( field, 'data.embedAllSections' ),
          subform          = subforms[embeddedType],
          sections         = _.get( subform, 'sections', [] ),
          section;

      // If embedAllSections is specified, create a wrapper section that includes
      // the fields from all sections in the linked form.
      // This involves copying the fields from each section into a fieldGroup,
      // labeling that fieldGroup with the section's name, then wrapping it all
      // into a single section object to return.
      if ( embedAllSections ) {
        section = {
          fields : []
        };

        _.forEach( sections, function( sectionToGroup ) {
          var wrappedFieldGroup = {
            templateOptions : {
              label : sectionToGroup.name
            },
            fieldGroup      : sectionToGroup.fields
          };
          section.fields.push( wrappedFieldGroup );
        } );
      }

      // Section lookup can be either a 0-based index or a section name
      else if ( embeddedSection !== undefined ) {
        if ( _.isNumber( embeddedSection ) ) {
          section = _.get( sections, embeddedSection );
        }
        else {
          section = _.find( sections, { name: embeddedSection } );
        }
      }
      // If no section was provided, use the first one
      else {
        section = _.get( sections, '0' );
      }

      return angular.copy( section ) || {};
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param type - The formly type to check
     * @returns {boolean} - Whether the given type should always use the default updateOn behavior
     */
    function excludeUpdateOn( type ) {
      if ( _.includes( updateOnExcluded, type ) ) {
        return true;
      }
      // If no match, check the type hierarchy above this type
      var baseType = _.get( getRegisteredType( type ), 'extends' );
      return !!baseType && excludeUpdateOn( baseType );
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param type
     * @returns {boolean}
     */
    function isTypeRegistered( type ) {
      return !!getRegisteredType( type );
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param wrapper
     * @returns {boolean}
     */
    function isWrapperRegistered( wrapper ) {
      return !!formlyConfig.getWrapper( wrapper );
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param type
     * @returns {*}
     */
    function getRegisteredType( type ) {
      return formlyConfig.getType( type );
    }

    /**
     * @memberOf iscFormsTemplateService
     * @description Defines the base controller instantiated for all formly fields. This is automatically called by
     * the base framework, but may be called by an application with a config argument to extend the base functionality.
     * @param {Object=} config - Accepts an optional init() function which is run when each base controller is instantiated,
     * and an optional scope function which is extended into the base controller's scope.
     */
    function registerBaseType( config ) {
      _.merge( baseCtrlConfig, config );

      // Base type overrides
      formlyConfig.setType( {
        name       : baseType,
        overwriteOk: true,
        controller : /* @ngInject */ function controller( $scope, iscNotificationService ) {
          iscNotificationService.registerFieldScope( $scope );

          var formlyRootCtrl = getFormlyRoot( $scope );

          // Validation for external/HS api
          if ( formsConfig.useExternalValidation ) {
            var removeWatch = $scope.$watch(
              // Wait for formControl to be populated
              function() {
                return $scope.options.formControl;
              },
              // Configure a listener for that ngModel and drop the watch
              function( ngModelController ) {
                if ( ngModelController ) {
                  removeWatch();
                  var formDef    = formlyRootCtrl.formDefinition,
                      // Pull the hsValidation params from the form level
                      // This may need to support field-level modules and recordNames in the future
                      moduleName = formDef.hsValidationModule,
                      recordName = formDef.hsValidationRecordName;

                  _.extend( hsValidation, {
                    module    : $window[moduleName],
                    recordName: recordName
                  } );

                  if ( hsValidation.module && hsValidation.recordName && ngModelController.$viewChangeListeners ) {
                    ngModelController.$viewChangeListeners.push(
                      function() {
                        hsModelUtils.validateRecord(
                          hsValidation.module,
                          // Currently passing the root form model
                          // this may need to be scoped to subforms or sections
                          $scope.formModel,
                          hsValidation.recordName
                        );
                      }
                    );
                  }
                }
              }
            );
          }

          // Validation show condition
          switch ( $scope.formOptions.formState._validateOn ) {
            case 'blur':
              $scope.validationShowCondition = '$touched';
              break;

            case 'submit':
              $scope.validationShowCondition = '$submitted';
              break;

            // Default is to validate on $dirty
            default:
              $scope.validationShowCondition = '$dirty';
              break;
          }

          // External/HS validation
          var hsValidation = {
            getError: function( spec ) {
              if ( hsValidation.module ) {
                hsValidation.$error = hsModelUtils.getError(
                  hsValidation.module,
                  // hsModelUtils.getError expects the root of the spec to be the recordName
                  [hsValidation.recordName, spec].join( '.' )
                );
                return !hsValidation.$error;
              }
              return true;
            },
            $error  : ''
          };

          // Inject utilities so they are available in FDN expressions
          _.extend( $scope, {
            // Libraries
            _     : _,
            moment: moment,

            // Utility properties
            formModel       : formlyRootCtrl.model,
            additionalModels: formlyRootCtrl.additionalModels,
            mode            : formlyRootCtrl.mode,

            // Utility functions
            hasCustomValidator : hasCustomValidator,
            getDefaultViewValue: getDefaultViewValue,

            // HS validation
            hsValidation: hsValidation

            // Additional configured scope properties
          }, baseCtrlConfig.scope );

          registerHideGroups( $scope );

          // If an additional init function is configured, invoke it
          if ( baseCtrlConfig.init && _.isFunction( baseCtrlConfig.init ) ) {
            baseCtrlConfig.init.call( null, this );
          }

          // Helper functions
          function getFormlyRoot( scope ) {
            if ( scope.formInternalCtrl ) {
              return scope.formInternalCtrl;
            }
            var parent = scope.$parent;
            if ( parent ) {
              return getFormlyRoot( parent );
            }
            return {};
          }

          function getContainingScope( scope ) {
            if ( _.get( scope, 'field.fieldGroup' ) ) {
              return scope;
            }
            var parent = scope.$parent;
            if ( parent ) {
              return getContainingScope( parent );
            }
            return {};
          }

          function registerHideGroups( scope ) {
            var hideExpression   = _.get( scope, 'options.hideExpression' ),
                hideIfGroupEmpty = _.get( scope, 'options.data.hideIfGroupEmpty' ),
                fieldGroup;

            if ( hideExpression || hideIfGroupEmpty ) {
              fieldGroup = getContainingScope( scope );

              // If no containing fieldGroup, abort
              if ( _.isEmpty( fieldGroup ) ) {
                return;
              }

              // Init visibility tracker
              if ( !fieldGroup.visibilityRegistry ) {
                fieldGroup.visibilityRegistry = [];
              }

              // Any field in this field group with a hideExpression should register with that field group
              if ( hideExpression ) {
                registerWithFieldGroup();
              }

              // Any field with a hideIfGroupEmpty flag should watch that registry
              // hideIfGroupEmpty and hideExpression are mutually exclusive
              else if ( hideIfGroupEmpty ) {
                watchContainer();
              }
            }

            function registerWithFieldGroup() {
              // Because hideExpressions use ng-if, if we are instantiating a field's scope that has a
              // hideExpression, it must have evaluated to true or we would not be instantiating field scope.
              var registry = fieldGroup.visibilityRegistry,
                  id       = scope.$id;

              // Notify the containing field group that this scope is visible.
              registry.push( id );

              // When this field is hidden (by being removed from the DOM), remove its id from the registry.
              scope.$on( '$destroy', function() {
                _.pull( registry, id );
              } );
            }

            function watchContainer() {
              // Set up a watch on the fieldGroup to toggle the property on this field.
              // The watch needs to be on the container because this field will be destroyed if it is hidden.
              var deregisterWatch = fieldGroup.$watch( function() {
                  return fieldGroup.visibilityRegistry.length;
                },
                function( visibleChildren ) {
                  _.set( scope, 'options.hide', visibleChildren === 0 );
                }
              );
              fieldGroup.$on( '$destroy', function() {
                deregisterWatch();
              } );
            }
          }

          function hasCustomValidator( validatorName ) {
            var customValidators = _.get( $scope, 'options.data.validators' );
            return customValidators && _.includes( customValidators, validatorName );
          }

          function getDefaultViewValue() {
            var value       = _.get( $scope.model, $scope.options.key ),
                getValue    = defaultViewConfig.getValue,
                wrapContent = defaultViewConfig.wrapContent;

            return wrapContent( getValue( value, $scope.options ) );
          }
        }
      } );
    }

    function defaultGetValue( value, fieldDefinition ) {
      if ( _.isObject( value ) ) {
        var displayField = _.get( fieldDefinition, 'data.displayField', 'name' );
        return value[displayField];
      }
      else {
        if ( value && isoRE.test( value ) ) {
          var mValue = moment( value );
          if ( mValue.isValid() ) {
            return $filter( 'iscDate' )( mValue, _.get( config, 'formats.date.shortDate', 'date' ) );
          }
        }
        return value;
      }
    }

    function defaultWrapContent( value ) {
      if ( value === undefined ) {
        return $sce.trustAsHtml( '<p class="not-specified">' + $translate.instant( 'Not specified' ) + '</p>' );
      }
      else {
        return $sce.trustAsHtml( '<p>' + value + '</p>' );
      }
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param type
     */
    function registerType( type, options ) {
      // Ensure all templates extend the base type for functionality
      type.extends     = type.extends || baseType;
      type.overwriteOk = true;
      options          = options || {};

      widgetLibrary.push( {
          name      : type.name,
          showInList: !options.excludeFromWidgetLibrary
        }
      );
      formlyConfig.setType( type );
    }

    /**
     * @memberOf iscFormsTemplateService
     */
    function getWidgetList() {
      var list = _.compact(
        _.map( widgetLibrary, function( widget ) {
          return widget.showInList ? widget.name : undefined;
        } )
      );

      return _.sortBy( list, function( name ) {
        return name;
      } );
    }

    /**
     * @memberOf iscFormsTemplateService
     * @description Overrides the setting for a widget as to whether it is returned by getWidgetList().
     * @param name
     * @param showInList
     */
    function overrideWidgetList( name, showInList ) {
      var widget = _.find( widgetLibrary, { name: name } );
      if ( widget ) {
        widget.showInList = showInList;
      }
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param {Object} library - Properties are functions that should be available to FDN expressions.
     * @description Registers the functions in the given library with the forms module.
     * Subsequent calls to this function will override any library members of the same name.
     * Functions in this library will be available to all forms in the application via formState.lib.{functionName}.
     */
    function registerGlobalLibrary( library ) {
      _.extend( functionLibrary, library );
    }

    /**
     * @memberOf iscFormsTemplateService
     * @return {Object}
     * @description Returns the library of functions registered with the service.
     */
    function getGlobalFunctionLibrary() {
      return functionLibrary;
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param wrapperName
     * @param templateName
     * @description Adds wrapperName to the list of wrapper templates on templateName.
     */
    function appendWrapper( wrapperName, templateName ) {
      var template = getRegisteredType( templateName ),
          wrappers = _.get( template, 'wrapper', [] );
      if ( !_.includes( wrappers, wrapperName ) ) {
        wrappers.push( wrapperName );
        _.set( template, 'wrapper', wrappers );
        registerType( template );
      }
    }

    /**
     * @memberOf iscFormsTemplateService
     * @param wrapperName
     * @param templateName
     * @description Removes wrapperName from the list of wrapper templates on templateName.
     */
    function removeWrapper( wrapperName, templateName ) {
      var template = getRegisteredType( templateName ),
          wrappers = _.get( template, 'wrapper', [] );

      _.pull( wrappers, wrapperName );
    }

    /**
     * @memberOf iscForm
     * @param formDefinition
     * @description
     * Loads all code tables which are needed for formDefinition and which are not already cached
     * by iscFormsCodeTableApi.
     * @returns {Promise}
     */
    function loadCodeTables( formDefinition ) {
      var codeTables        = [],
          codeTablePromises = [],
          codeTableConfig   = _.get( moduleConfig, 'formCodeTables', {} ),
          bundleRequests    = codeTableConfig.bundleRequests,
          bundleSize        = codeTableConfig.bundleSize,
          namesToRequest    = [];

      // Scrape formDefinition response for any needed code tables.
      // This includes data.codeTable in the definition's form or in any of its subforms.
      // Code tables linked in other ways, such as expressionProperties['data.codeTable'] or as
      // default properties on custom widgets, should either be pre-loaded by the containing module
      // or will be loaded as needed by initListControlWidget in iscFormsTemplateService.

      _.forEach( formDefinition.form.sections, queueCodeTableLoad );
      _.forEach( formDefinition.subforms, function( subform ) {
        _.forEach( subform.sections, queueCodeTableLoad );
      } );

      _.forEach( _.uniqBy( codeTables, 'name' ), function( codeTable ) {
        // If the code table has not been fetched yet, do so
        if ( !iscFormsCodeTableApi.getSync( codeTable.name ) ) {
          if ( bundleRequests ) {
            namesToRequest.push( codeTable.name );
            if ( bundleSize && namesToRequest.length >= bundleSize ) {
              flushBundle();
            }
          }
          else {
            codeTablePromises.push( iscFormsCodeTableApi.getAsync( codeTable.name, codeTable.order ) );
          }
        }
      } );

      if ( bundleRequests ) {
        flushBundle();
      }

      return $q.all( codeTablePromises );

      function flushBundle() {
        if ( namesToRequest.length ) {
          codeTablePromises.push( iscFormsCodeTableApi.getAsyncBundle( namesToRequest ) );
          namesToRequest = [];
        }
      }

      function queueCodeTableLoad( container ) {
        // Recurse for these mutually-exclusive cases:
        //   fields              (by section);
        //   fieldGroup          (by fieldGroup);
        //   data.embeddedFields (literal field definitions for embedded forms/collections).
        var fields = container.fields || container.fieldGroup || _.get( container, 'data.embeddedFields', [] );

        _.forEach( fields, function( field ) {
          var name  = _.get( field, 'data.codeTable' ),
              order = _.get( field, 'data.orderField' );
          if ( name ) {
            codeTables.push( {
              name : name,
              order: order
            } );
          }
          queueCodeTableLoad( field );
        } );
      }
    }

    /**
     * @memberOf iscFormsTemplateService
     * @description Initializes the given formly-field scope with a listOptions property. This property is an array
     * of the options in the scope's templateOptions.options (if specified), plus the resolved list of its data.codetable
     * options (if specified).
     * This function also sets an inferred isObjectModel property based on the results of initializing this list.
     * @param scope
     */
    function initListControlWidget( scope ) {
      scope.$watchGroup( [getCodeTable, getOptions], setProperties );
      setProperties();

      function setProperties( options ) {
        options = options || {};

        var data                = _.get( scope, 'options.data', {} ),
            codeTable           = options[0] || getCodeTable(),
            explicitOptions     = options[1] || getOptions() || [],
            codeTableOptions    = codeTable ? iscFormsCodeTableApi.getSync( codeTable ) : [],
            defaultDisplayField = formsConfig.defaultDisplayField,
            listOptions         = _.concat( [], explicitOptions, codeTableOptions );

        // If a code table is specified but it has not been loaded from the server yet,
        // call the server API and resume the field's function after it completes.
        if ( codeTable && !codeTableOptions ) {
          iscFormsCodeTableApi.getAsync( codeTable, data.orderField ).then( function() {
            setProperties( options );
          } );
        }
        else {
          var isObject = getObjectFlag();

          // Set default display field, if it exists and the field does not override it
          if ( defaultDisplayField && isObject ) {
            // displayField is used by hard list controls like selects or radios
            if ( !data.displayField ) {
              _.set( scope, 'options.data.displayField', defaultDisplayField );
            }
            // resultsDisplayField is used by soft list controls like typeaheads
            if ( !data.resultsDisplayField ) {
              _.set( scope, 'options.data.resultsDisplayField', defaultDisplayField );
            }
          }

          _.extend( scope, {
            isObjectModel: isObject,
            listOptions  : listOptions
          } );

        }

        function getObjectFlag() {
          return ( data.isObject === undefined && listOptions.length ) ?
            _.isObject( _.head( listOptions ) )
            : data.isObject;
        }
      }
      function getOptions() {
        return _.get( scope, 'options.templateOptions.options' );
      }

      function getCodeTable() {
        return _.get( scope, 'options.data.codeTable' );
      }
    }
  }
} )();
