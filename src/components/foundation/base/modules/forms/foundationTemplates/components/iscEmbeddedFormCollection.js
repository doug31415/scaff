( function() {
  'use strict';

  // ----------------------------
  // injection
  // ----------------------------

  angular.module( 'isc.forms' )
    .directive( 'iscEmbeddedFormCollection', iscEmbeddedFormCollection );
  /**
   * @ngdoc directive
   * @memberOf isc.forms
   * @name iscEmbeddedFormCollection
   * @scope
   * @restrict 'E'
   * @param $filter
   * @param FoundationApi
   * @param iscCustomConfigService
   * @param FORMS_EVENTS
   * @param iscFormsTemplateService
   * @param iscFormsValidationService
   * @param iscScrollContainerService
   * @returns {{restrict: string, replace: boolean, require: string, controllerAs: string, scope: {id: string, formState: string, options: string}, bindToController: boolean, controller: controller, link: link, templateUrl: string}}
   */
  /* @ngInject */
  function iscEmbeddedFormCollection( $filter, $timeout, $translate, FoundationApi, iscCustomConfigService, iscConfirmationService, FORMS_EVENTS,
    iscFormsTemplateService, iscFormsValidationService, iscFormsTransformService,
    iscScrollContainerService ) {//jshint ignore:line

    // ----------------------------
    // vars
    // ----------------------------
    var PRIMITIVE_KEY = '_primitiveValue';

    var PRIMITIVE_OBJECT = {
      key            : PRIMITIVE_KEY,
      type           : 'input',
      templateOptions: {
        label: $translate.instant( 'Value' )
      }
    };

    // ----------------------------
    // class factory
    // ----------------------------
    var directive = {
      restrict        : 'E',
      replace         : true,
      require         : 'ngModel',
      controllerAs    : 'efCollectionCtrl',
      scope           : {
        id              : '@',
        formState       : '=',
        config          : '=?',
        options         : '=',
        additionalModels: '=?'
      },
      bindToController: true,
      controller      : controller,
      link            : link,
      templateUrl     : function( elem, attrs ) {
        return attrs.templateUrl || 'forms/foundationTemplates/components/iscEmbeddedFormCollection.html';
      }
    };

    return directive;

    // ----------------------------
    // functions
    // ----------------------------
    /* @ngInject */
    function controller( $scope ) {
      var self = this;

      var opts             = self.options,
          templateOptions  = opts.templateOptions,
          key              = opts.key,
          collectionOpts   = _.get( opts, 'data.collections', {} ),
          collectionConfig = _.get( collectionOpts, 'config', {} ),
          fieldFilter      = _.get( collectionConfig, 'fieldFilter', {} ),
          dataFilter       = _.get( collectionConfig, 'dataFilter', {} ),
          dateFormat       = _.get( iscCustomConfigService.getConfig(), 'formats.date.shortDate', 'date' ),
          editAs           = _.get( collectionOpts, 'editAs' ),
          modelType        = _.get( collectionOpts, 'modelType', 'array' ),
          modelTypeOptions = _.get( collectionOpts, 'modelTypeOptions', {} ),
          allowReordering  = _.get( collectionOpts, 'allowReordering' ),
          confirmDeletion  = _.get( collectionOpts, 'confirmDeletion' ),
          subforms         = self.formState._subforms,
          useDynamicFields = _.get( collectionOpts, 'useDynamicFields' ),
          embeddedType     = _.get( opts, 'data.embeddedType' ),
          embeddedSection  = iscFormsTemplateService.getSectionForEmbeddedForm( opts, subforms );

      self.config = _.defaultsDeep( self.config, {
        fields   : _.get( opts, 'data.embeddedFields' ),
        callbacks: {
          beforeUpdate: _.get( collectionConfig, 'callbacks.beforeUpdate' ),
          beforeDelete: _.get( collectionConfig, 'callbacks.beforeDelete' )
        },
        model    : {
          maxSize    : _.get( collectionConfig, 'model.maxSize' ),
          defaultItem: _.get( collectionConfig, 'model.defaultItem' )
        }
      } );

      _.extend( self, {
        editAs          : editAs,
        modelType       : modelType,
        modelTypeOptions: modelTypeOptions,
        keyProp         : modelTypeOptions.key,
        valueProp       : modelTypeOptions.value,
        dateFormat      : dateFormat,
        isNew           : false,
        renderForm      : false,
        modalName       : 'editCollection_' + key,
        formName        : 'form_' + key,
        mode            : self.formState._mode,

        // Track whether this is a collection of primitives or objects
        isPrimitive  : opts.type === 'primitiveCollection' || opts.extends === 'primitiveCollection',
        isObjectBased: modelType !== 'array',
        isHashtable  : modelType === 'hashtable' && !!modelTypeOptions.value,

        // Local model of validation errors set by iscFormsValidationService
        validationErrors: getValidation(),

        // The data model for editing a single subform instance
        editModel: {},

        // The (singular) label for each subform instance
        label: _.get( opts, 'data.embeddedLabel', templateOptions.label ),

        // Inherit formState for subform
        subformOptions: {
          formState: _.extend( {}, self.formState )
        },
        subform       : {}
      } );

      setCollectionConfiguration();

      processFieldsArray();

      if ( useDynamicFields ) {
        $scope.$on( FORMS_EVENTS.subformDefinitionChanged, function( event, def ) {
          processFieldsArray( def );
          // Force subform to close, if it is open
          hideSubform();
        } );
      }

      // Functions and callbacks
      _.extend( self, {
        cancel                    : cancel,
        editForm                  : editForm,
        emitInfo                  : emitInfo,
        hasValidationError        : hasValidationError,
        isAddItemDisabled         : isAddItemDisabled,
        isSubmitDisabled          : isSubmitDisabled,
        newForm                   : newForm,
        removeForm                : removeForm,
        saveForm                  : saveForm,
        transformCollectionToModel: transformCollectionToModel,
        transformModelToCollection: transformModelToCollection
      } );

      // Watches
      $scope.$watch( getValidation, function( value ) {
        self.validationErrors = _.get( value, 'records' );
      } );

      // Field/column filtering
      if ( fieldFilter.listener && fieldFilter.expression ) {
        var listener = fieldFilter.listener;

        // If the listener is an expression, wrap it in a function for the watch
        if ( !_.isFunction( listener ) ) {
          listener = function() {
            return $scope.$eval( fieldFilter.listener, {
              formState: self.formState
            } );
          };
        }
        $scope.$watch( listener, function( newVal, oldVal ) {
          if ( !angular.equals( newVal, oldVal ) ) {
            applyFieldFilter();
          }
        } );
      }

      // Data/row filtering
      if ( dataFilter.listener && dataFilter.expression ) {
        var listener = dataFilter.listener;

        // If the listener is an expression, wrap it in a function for the watch
        if ( !_.isFunction( listener ) ) {
          listener = function() {
            return $scope.$eval( dataFilter.listener, {
              formState: self.formState
            } );
          };
        }

        $scope.$watch( listener, function( newVal, oldVal ) {
          if ( !angular.equals( newVal, oldVal ) ) {
            applyDataFilter();
          }
        } );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       * @returns {*}
       */
      function getValidation() {
        return self.formState._validation[self.id];
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function createTableFields() {
        // Flatten field groups down for table header and cell iteration
        self.flattenedFields = $filter( 'iscFormsFlattenedFields' )( self.fields );

        // Table configuration
        // Fields
        self.tableColumns = _.map( self.flattenedFields, function( field ) {
          return {
            id         : field.id,
            key        : field.label,
            model      : field.model,
            templateUrl: field.templateUrl,
            display    : field.display,
            type       : field.type,
            dateFormat : self.dateFormat,

            // Custom templates
            customTemplate   : field.customTemplate,
            customTemplateUrl: field.customTemplateUrl
          };
        } );

        // Actions
        if ( self.mode !== 'view' ) {
          var actionsTemplate;

          // Default actions template
          if ( self.collectionLayoutActions === undefined ) {
            actionsTemplate = 'actions/' + ( self.collectionLayout || 'table' ) + '-actions.html';
          }
          // Custom actions template (if defined)
          else {
            actionsTemplate = self.collectionLayoutActions;
          }

          if ( actionsTemplate ) {
            self.tableColumns.push(
              {
                key        : 'Actions',
                sortable   : false,
                templateUrl: ['forms/collectionLayouts/', actionsTemplate].join( '' )
              }
            );
          }
        }

        // Callbacks to actions defined in this directive need to be linked in the tableConfig object
        // The isolation level of the faux-table prevents it from reaching this controller
        self.tableConfig = {
          sortable   : true,
          columns    : self.tableColumns,
          emptyText  : _.get( self.options, 'data.collections.emptyMessage' ),
          hideHeader : _.get( self.options, 'data.collections.hideTableHeader' ),
          evalContext: $scope.$eval,
          options    : collectionOpts,
          callbacks  : _.extend( {}, {
            invokeExpr        : invokeExpr,
            editForm          : editForm,
            emitInfo          : emitInfo,
            removeForm        : removeForm,
            moveUp            : moveUp,
            moveDown          : moveDown,
            hasValidationError: hasValidationError
          }, _.get( self.options, 'data.collections.config.callbacks' ) )
        };

        // Apply any customized field-level filtering
        if ( fieldFilter.expression ) {
          applyFieldFilter();
        }
      }

      /**
       * Applies any configured filter on which fields should show in the collection view.
       */
      function applyFieldFilter() {
        if ( fieldFilter.expression ) {
          var fields  = self.flattenedFields,
              columns = self.tableColumns;

          var filteredFields = evalFunctionOrExpression( fieldFilter.expression, ['fields'], fields ),
              excludedFields = _.difference( fields, filteredFields );

          var filteredColumns = _.reject( columns, function( column ) {
            return _.find( excludedFields, { id: column.id } );
          } );

          self.tableConfig.columns = filteredColumns;
        }
      }

      /**
       * Applies any configured filter on which rows should show in the collection view.
       */
      function applyDataFilter() {
        if ( dataFilter.expression ) {
          self.filteredCollection = evalFunctionOrExpression( dataFilter.expression, ['data'], self.collectionModel );
        }
        else {
          self.filteredCollection = self.collectionModel;
        }
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       * @param expr - The function or expression to evaluate
       * @param localKeys - An array of local keys that will be mapped to any additional
       * arguments and provided as a local scope to expr, if it is an expression.
       * Ex.: evalFunctionOrExpression( 'fields.length + value', ['fields', 'value'], [1, 2, 3], 10 ) will return 13;
       * @returns {*}
       */
      function evalFunctionOrExpression( expr, localKeys ) {
        var evalArgs = _.toArray( arguments ).slice( 2 );
        if ( _.isFunction( expr ) ) {
          return expr.apply( self, evalArgs );
        }
        else {
          // Always inject formState for expressions that use a library
          var locals = {
            formState : self.formState
          };
          _.forEach( evalArgs, function( arg, index ) {
            locals[localKeys[index]] = arg;
          } );
          return $scope.$eval( expr, locals );
        }
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       * @description
       * Sets the internal values for configurable properties related to how the collection is rendered.
       */
      function setCollectionConfiguration() {
        // Layout and className may be specified as strings (applies to all modes) or objects (to apply to specific modes)
        var mode                    = self.mode,
            collectionLayout        = _.get( collectionOpts, 'layout' ),
            collectionClassName     = _.get( collectionOpts, 'className' ),
            collectionLayoutActions = _.get( collectionOpts, 'layoutActions' ),
            modeLayout              = _.get( collectionLayout, mode, collectionLayout ),
            modeClassName           = _.get( collectionClassName, mode, collectionClassName );

        // In case layout or className is specified for only one mode
        modeLayout    = _.isObject( modeLayout ) ? undefined : modeLayout;
        modeClassName = _.isObject( modeClassName ) ? undefined : modeClassName;

        _.extend( self, {
          collectionLayout       : modeLayout,
          collectionClassName    : modeClassName,
          collectionLayoutActions: collectionLayoutActions
        } );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       * @description
       * Builds the internal fields array from the subform definition and initializes the table field config.
       * @param dynamicArray
       */
      function processFieldsArray( dynamicArray ) {
        var explicitFields = _.isArray( self.config.fields ) ? self.config.fields : [];

        if ( self.isPrimitive ) {
          self.fields = {
            '0': PRIMITIVE_OBJECT
          };
        }
        else if ( explicitFields.length ) {
          self.fields = explicitFields;
        }
        else {
          self.fields = angular.copy(
            dynamicArray || _.get( embeddedSection, 'fields', [] )
          );
        }

        mergeBuiltInTemplates( self.fields );

        // Manually apply compatibility transform to fields;
        // this is necessary because formly has not seen them yet.
        self.fields = iscFormsTransformService.ensureBackwardsCompatibility( self.fields );

        createTableFields();
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       * @description
       * Merges properties on built-in templates into the fields list in this controller.
       * This is necessary because the formly engine has not yet processed these templates,
       * and we may need properties defined as defaultOptions in those templates to render them in the collection.
       * @param fields
       */
      function mergeBuiltInTemplates( fields ) {
        _.forEach( fields, function( field ) {
          // Recurse for fieldGroups
          if ( field.fieldGroup ) {
            mergeBuiltInTemplates( field.fieldGroup );
          }
          else {
            var type = _.get( field, 'type', '' );
            if ( type && !_.startsWith( type, 'embeddedForm' ) ) {
              var options = _.get( iscFormsTemplateService.getRegisteredType( field.type ), 'defaultOptions' );
              if ( options ) {
                angular.merge( field, options, field );
              }
            }
          }
        } );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function onCollectionModified() {
        self.subformOptions.formState._validation.$submitted = false;

        self.transformCollectionToModel();
        self.ngModelCtrl.$commitViewValue();
        self.ngModelCtrl.$setTouched();
        self.ngModelCtrl.$setDirty();
        self.ngModelCtrl.$validate();
      }


      /**
       * @memberOf iscEmbeddedFormCollection
       * @description The following data model types are supported: primitive, array, hashtable, object.
       * All of these types are handled by the iteration and editing process as an array,
       * so we need to transform object and hashtable types into an array for self.collectionModel.
       *
       * For an 'object' type, assuming ctrl.keyProp = 'key':
       {
         "myKey1" : {
           "myProp1" : "value1",
           "myProp2" : "value2"
         },
         "myKey2" : {
           "myProp1" : "value3",
           "myProp2" : "value4"
         }
       }
       * is transformed into:
       [
       {
         "key"     : "myKey1",
         "myProp1" : "value1",
         "myProp2" : "value2"
       },
       {
         "key"     : "myKey2",
         "myProp1" : "value3",
         "myProp2" : "value4"
       }
       ]

       * For a 'hashtable' type, assuming ctrl.keyProp = 'key' and ctrl.valueProp = 'value':
       {
         "myKey1" : "myValue1",
         "myKey2" : "myValue2"
       }
       * is transformed into:
       [
       {
         "key"   : "myKey1",
         "value" : "myValue1"
       },
       {
         "key"   : "myKey2",
         "value" : "myValue2"
       }
       ]
       */
      function transformModelToCollection( model ) {
        // Primitive collection -- an array of primitive values
        if ( self.isPrimitive ) {
          self.collectionModel = _.map( model, function( value ) {
            var primitiveWrapper            = {};
            primitiveWrapper[PRIMITIVE_KEY] = value;
            return primitiveWrapper;
          } );
        }

        else if ( self.isObjectBased && _.isObject( model ) ) {
          var data = [];

          _.forOwn( model, function( value, key ) {
            var baseObj           = {};
            baseObj[self.keyProp] = key;

            // Hashtable type -- an object with key/value pairs
            if ( self.isHashtable ) {
              baseObj[self.valueProp] = value;
              data.push( baseObj );
            }
            // Object type -- an object with property keys and object values
            else {
              data.push( _.extend( {}, value, baseObj ) );
            }
          } );

          self.collectionModel = data;
        }

        // Array type -- an array with object values
        else {
          self.collectionModel = model;
        }

        applyDataFilter();
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       * @description Reverses the transformation performed in transformModelToCollection.
       */
      function transformCollectionToModel() {
        // Primitive collection -- an array of primitive values
        if ( self.isPrimitive ) {
          self.ngModelCtrl.$setViewValue(
            _.map( self.collectionModel, function( item ) {
              return item[PRIMITIVE_KEY];
            } )
          );
        }

        else if ( self.isObjectBased ) {
          var objectValue = {};

          _.forEach( self.collectionModel, function( item ) {
            var key = item[self.keyProp],
                value;

            // Hashtable type -- an object with key/value pairs
            if ( self.isHashtable ) {
              value = item[self.valueProp];
            }
            // Object type -- an object with property keys and object values
            else {
              value = _.omit( item, self.keyProp );
            }

            objectValue[key] = value;
          } );

          self.ngModelCtrl.$setViewValue( objectValue );
        }

        // Array type -- an array with object values
        else {
          self.ngModelCtrl.$setViewValue( self.collectionModel );
        }

        applyDataFilter();
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function updateModelWithValidation() {
        // Broadcast down to the subform listener to set the model
        $scope.$broadcast( FORMS_EVENTS.setFormModel, self.editModel, false );
        iscFormsValidationService.validateForm( self.subform.form );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function updateModel() {
        // Broadcast down to the subform listener to set the model
        $scope.$broadcast( FORMS_EVENTS.setFormModel, self.editModel, true );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function showSubform() {
        // Delete the controller's reference to the formly-form's form attribute.
        // It will be regenerated on the scope by the formly-form when it is shown next time.
        // If this is not done, then when the form is requested the next time,
        // the value currently in self.subform will be orphaned and validation will not function properly.

        // This needs to be guaranteed to occur after any previous use of self.renderForm is set to false,
        // but before the next time self.renderForm is set to true.
        delete self.subform.form;

        switch ( editAs ) {
          case 'modal':
            $timeout( function() {
              // When self.renderForm is set to true, the formly-form will be created and added to the DOM.
              // This will regenerate self.subform for validation of the subform.
              self.renderForm = true;

              FoundationApi.publish( self.modalName, 'open' );
            }, 0 );
            break;

          case 'inline':
            self.renderForm = true;
            break;

          default:
            $scope.$emit( FORMS_EVENTS.showSubform, {
              isNew           : self.isNew,
              itemLabel       : self.label,
              model           : self.editModel,
              fields          : self.fields,
              className       : embeddedSection.className,
              options         : self.subformOptions,
              subform         : self.subform,
              onCancel        : self.cancel,
              onSubmit        : self.saveForm,
              scrollPos       : iscScrollContainerService.getCurrentScrollPosition(),
              isSubmitDisabled: self.isSubmitDisabled
            } );
        }
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function hideSubform() {
        switch ( editAs ) {
          case 'modal':
            // Defer to avoid a flicker while Foundation catches up
            $timeout( function() {
              self.renderForm = false;
            }, 0 );
            FoundationApi.publish( self.modalName, 'close' );
            break;

          case 'inline':
            self.renderForm = false;
            break;

          default:
            $scope.$emit( FORMS_EVENTS.hideSubform );
        }
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function isSubmitDisabled() {
        return self.subformOptions.formState._disableSubmitIfFormInvalid && self.subform.form.$invalid;
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function isAddItemDisabled() {
        if ( self.disabled ) {
          return true;
        }

        var currentSize = _.get( self.collectionModel, 'length', 0 ),
            maxSizeProp = _.get( self.config, 'model.maxSize' );

        if ( maxSizeProp !== undefined ) {
          var maxSize;

          // Function
          if ( _.isFunction( maxSizeProp ) ) {
            var result = parseInt( maxSizeProp( self.collectionModel ) );
            if ( !_.isNaN( result ) ) {
              maxSize = result;
            }
          }
          // Number
          else if ( _.isNumber( maxSizeProp ) ) {
            maxSize = maxSizeProp;
          }
          // Possible expression
          else {
            maxSize = $scope.$eval( maxSizeProp, {
              formState      : self.formState,
              collectionModel: self.collectionModel
            } );
          }
          return ( maxSize !== undefined ) && currentSize >= maxSize;
        }
        return false;
      }

      // --------------------------------------------------
      // Table/collection actions

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function newForm() {
        if ( !self.renderForm ) {
          self.isNew         = true;
          self.originalModel = undefined;

          // Set local model from configured default if provided
          var defaultItem = _.get( self.config, 'model.defaultItem' );

          if ( defaultItem !== undefined ) {
            // Function
            if ( _.isFunction( defaultItem ) ) {
              self.editModel = defaultItem( self.collectionModel );
            }
            // Possible expression
            else if ( _.isString( defaultItem ) ) {
              self.editModel = $scope.$eval( defaultItem, {
                formState      : self.formState,
                collectionModel: self.collectionModel
              } );
            }
            // Everything else
            else {
              self.editModel = angular.copy( defaultItem );
            }
          }
          else {
            self.editModel = {};
          }

          // Notify with event
          showSubform();
          $scope.$emit( FORMS_EVENTS.collectionEditStarted, {
            key      : self.options.key,
            editModel: self.editModel
          } );

          // Defer the update until the formly-form has finished being initialized;
          // otherwise a race condition can prevent the broadcast message from being heard
          $timeout( updateModel, 0 );
        }
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function cancel( depth ) {
        self.subformOptions.formState._validation.$submitted = false;

        // Notify with event
        hideSubform();
        $scope.$emit( FORMS_EVENTS.collectionEditCanceled, {
          key      : self.options.key,
          editModel: self.editModel,
          depth    : depth || 1
        } );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function saveForm() {
        self.subformOptions.formState._validation.$submitted = true;

        var isSubformValid = self.isPrimitive || iscFormsValidationService.validateForm( self.subform.form ).isValid;

        // If this subform is valid, save the data and return
        if ( isSubformValid ) {
          // Update local model
          if ( self.isNew ) {
            self.collectionModel.push( self.editModel );
          }
          else {
            var model = self.collectionModel[self.editIndex];
            _.remove( self.validationErrors, model );

            _.set( self.collectionModel, self.editIndex, self.editModel );
          }
          self.editIndex = undefined;

          // Invoke callback
          var updateCallback = _.get( self.config, 'callbacks.beforeUpdate' );
          if ( updateCallback ) {
            if ( _.isFunction( updateCallback ) ) {
              updateCallback( self.collectionModel, self.editModel );
            }
            else {
              $scope.$eval( updateCallback, {
                formState      : self.formState,
                collectionModel: self.collectionModel,
                item           : self.editModel
              } );
            }
          }

          // Update ng-model
          onCollectionModified();

          // Notify with event
          hideSubform();
          $scope.$emit( FORMS_EVENTS.collectionEditSaved, {
            key      : self.options.key,
            editModel: self.editModel
          } );
        }
        return isSubformValid;
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function emitInfo( row, data ) {
        var index = _.indexOf( self.collectionModel, row );

        $scope.$emit( FORMS_EVENTS.collectionInfoEmitted, {
          key  : self.options.key,
          data : data,
          index: index
        } );
      }

      function invokeExpr( expr ) {
        return $scope.$eval( expr, self );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function editForm( row ) {
        if ( !self.renderForm ) {
          var index = _.indexOf( self.collectionModel, row );

          self.isNew     = false;
          self.editIndex = index;

          // Set local model
          self.editModel = {};
          _.merge( self.editModel, self.collectionModel[index] );

          // Notify with event
          showSubform();
          $scope.$emit( FORMS_EVENTS.collectionEditStarted, {
            key      : self.options.key,
            editModel: self.editModel,
            index    : self.editIndex
          } );

          // Defer the update until the formly-form has finished being initialized;
          // otherwise a race condition can prevent the broadcast message from being heard
          $timeout( updateModelWithValidation, 0 );
        }
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function removeForm( row ) {
        if ( confirmDeletion ) {
          iscConfirmationService
            .show( $translate.instant( 'Are you sure you want to delete this {{ItemLabel}}?', { ItemLabel: self.label } ) )
            .then( onYes );
        }
        else {
          onYes();
        }

        function onYes() {
          // Make local change
          var index = _.indexOf( self.collectionModel, row );

          self.collectionModel.splice( index, 1 );

          // Invoke callback
          var deleteCallback = _.get( self.config, 'callbacks.beforeDelete' );
          if ( deleteCallback ) {
            if ( _.isFunction( deleteCallback ) ) {
              deleteCallback( self.collectionModel, row );
            }
            else {
              $scope.$eval( deleteCallback, {
                formState      : self.formState,
                collectionModel: self.collectionModel,
                item           : row
              } );
            }
          }

          // Update ng-model
          onCollectionModified();

          // Notify with event
          $scope.$emit( FORMS_EVENTS.collectionItemRemoved, row );
        }
      }

      // Row reordering
      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function moveUp( row ) {
        move( row, -1 );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function moveDown( row ) {
        move( row, +1 );
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function move( row, offset ) {
        var index = _.indexOf( self.collectionModel, row );

        var rowToMove  = _.pullAt( self.collectionModel, index ),
            firstHalf  = _.slice( self.collectionModel, 0, index + offset ),
            secondHalf = _.slice( self.collectionModel, index + offset );

        self.collectionModel = _.concat( firstHalf, rowToMove, secondHalf );
        onCollectionModified();
      }

      /**
       * @memberOf iscEmbeddedFormCollection
       */
      function hasValidationError( row ) {
        return _.includes( self.validationErrors, row );
      }
    }

    function link( scope, el, attrs, ngModelCtrl ) {
      var ctrl = scope.efCollectionCtrl;

      ctrl.disabled = attrs.disabled;

      // Hold reference to ngModelCtrl in main controller
      ctrl.ngModelCtrl = ngModelCtrl;

      // Initialize model value for collection rows in $render
      ngModelCtrl.$render = function() {
        var model = ngModelCtrl.$modelValue || [];
        ctrl.transformModelToCollection( model );
      };
    }

  }//END CLASS

} )();
