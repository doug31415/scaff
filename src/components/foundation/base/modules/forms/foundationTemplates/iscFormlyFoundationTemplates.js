( function() {
  'use strict';

  /** Templates adapted from angular-formly-templates-foundation 1.0.0-beta.1
   *  The foundation templates project itself does not work ootb with formly due to changes to api-check.
   *  All api-check calls are omitted from the implementation below.
   *
   *  Templates adapted from formlyFoundation are:
   *    input
   *    checkbox
   *    multiCheckbox
   *    radio
   *    select
   *    textarea
   *
   *  Wrappers adapted are:
   *    templateLabel
   *    templateHasError
   */

  /* @ngInject */
  angular
    .module( 'isc.forms' )
    .factory( 'iscFormlyFoundationTemplates', iscFormlyFoundationTemplates );

  /**
   * @ngdoc factory
   * @memberOf isc.forms
   * @param $filter
   * @param iscCustomConfigService
   * @param iscFormsTemplateService
   * @returns {{init: init}}
   * @description
   * Templates adapted from angular-formly-templates-foundation 1.0.0-beta.1
   *  The foundation templates project itself does not work ootb with formly due to changes to api-check.
   *  All api-check calls are omitted from the implementation below.
   *
   *  Templates adapted from formlyFoundation are:<br />
   *    input<br />
   *    checkbox<br />
   *    multiCheckbox<br />
   *    radio<br />
   *    select<br />
   *    textarea<br />
   *
   *  Wrappers adapted are:<br />
   *    templateLabel<br />
   *    templateHasError
   */
  function iscFormlyFoundationTemplates( $filter, $translate, $sce, iscCustomConfigService, iscFormsTemplateService ) {
    var service = {
      init: init
    };

    return service;

    function init() {
      // Wrappers
      iscFormsTemplateService.registerWrapper( [
        {
          name       : 'templateLabel',
          templateUrl: 'forms/foundationTemplates/wrappers/label.html'
        },
        {
          name       : 'templateConditionalLabel',
          templateUrl: 'forms/foundationTemplates/wrappers/conditional-label.html'
        },
        {
          name       : 'templateHasError',
          templateUrl: 'forms/foundationTemplates/wrappers/has-error.html'
        }
      ] );

      // Templates
      // Base type overrides
      iscFormsTemplateService.registerBaseType();

      // Section (static text)
      iscFormsTemplateService.registerType( {
        name       : 'section',
        wrapper    : ['templateLabel'],
        templateUrl: 'forms/foundationTemplates/templates/section.html',
        controller : htmlController
      } );

      // Instructions (static text)
      iscFormsTemplateService.registerType( {
        name       : 'instructions',
        wrapper    : ['templateLabel'],
        templateUrl: 'forms/foundationTemplates/templates/instructions.html',
        controller : htmlController
      } );

      // Divider (line / hr)
      iscFormsTemplateService.registerType( {
        name       : 'divider',
        wrapper    : ['templateLabel'],
        templateUrl: 'forms/foundationTemplates/templates/divider.html'
      } );

      // Button (supports templateOptions.onClick and data.userScript)
      iscFormsTemplateService.registerType( {
        name       : 'button',
        wrapper    : ['templateLabel'],
        templateUrl: 'forms/foundationTemplates/templates/button.html',
        /* @ngInject */
        controller : function( $scope ) {
          $scope._qdTagSelector = 'button';

          // data.userModel is the parsed and evaled data.userScript
          var userScript   = _.get( $scope.options, 'data.userModel', {} ),
              fdnOnClick   = userScript.onClick,
              fieldOnClick = _.get( $scope.options, 'templateOptions.onClick' ),
              cssClass     = _.get( $scope.options, 'className' );

          $scope.onClick = function() {
            invoke( fieldOnClick );
            invoke( fdnOnClick );
          };

          $scope.getClass = function() {
            var classes = [];
            classes.push( cssClass || 'button' );

            if ( $scope.to.disabled ) {
              classes.push( 'disabled' );
            }

            return classes;
          };

          function invoke( handler ) {
            if ( _.isFunction( handler ) ) {
              handler( $scope );
            }
            else if ( _.isString( handler ) ) {
              $scope.$eval( handler );
            }
          }
        },
        link       : setQdTagManually
      } );

      // Image
      iscFormsTemplateService.registerType( {
        name       : 'image',
        templateUrl: 'forms/foundationTemplates/templates/image.html',
        wrapper    : ['templateLabel']
      } );

      // Input
      iscFormsTemplateService.registerType( {
        name          : 'input',
        templateUrl   : 'forms/foundationTemplates/templates/input.html',
        wrapper       : ['templateLabel', 'templateHasError'],
        defaultOptions: {
          templateOptions: { type: 'text' }
        },
        // IE has an X icon in text inputs that clears the input, but it
        // only fires an 'input' event, not a 'change' event.
        // This causes an 'input' event to also trigger the 'change' event.
        link          : function( scope, element ) {
          var input = element.find( 'input' );
          input.on( 'input', function() {
            input.trigger( 'change' );
          } );
        }
      } );

      // Checkbox
      iscFormsTemplateService.registerType( {
        name       : 'checkbox',
        templateUrl: 'forms/foundationTemplates/templates/checkbox.html',
        wrapper    : ['templateHasError']
      } );

      // Multi-select checkboxes
      iscFormsTemplateService.registerType( {
        name          : 'multiCheckbox',
        templateUrl   : 'forms/foundationTemplates/templates/multiCheckbox.html',
        wrapper       : ['templateLabel', 'templateHasError'],
        defaultOptions: {
          noFormControl: false
        },
        /*@ngInject*/
        controller    : function( $scope ) {
          // When using a template that has an ng-model attribute which is not part of the form model
          // and which is dotted (i.e., "some.dotted.property"), angular-formly will automatically
          // change the ng-model attribute to the model of the formly field.
          // Setting skipNgModelAttrsManipulator to true prevents this and allows a local model
          // to be used for more complex components.
          $scope.options.extras.skipNgModelAttrsManipulator = true;
          $scope._qdTagSelector                             = '.check-list';

          iscFormsTemplateService.initListControlWidget( $scope );

          var opts = $scope.options,
              data = opts.data;

          angular.extend( $scope, {
            displayField: data.displayField
          } );

          $scope.multiCheckbox = {
            checked: [],
            change : setModel
          };

          $scope.isHorizontal = _.get( opts, 'data.layout.orientation' ) === 'horizontal';

          // initialize the checkboxes check property
          var modelValue = _.get( $scope.model, opts.key );
          if ( angular.isArray( modelValue ) ) {
            angular.forEach( $scope.listOptions, function( option, index ) {
              if ( $scope.isObjectModel ) {
                $scope.multiCheckbox.checked[index] = !!_.find( modelValue, function( value ) {
                  return angular.equals( value, option );
                } );
              }
              else {
                $scope.multiCheckbox.checked[index] = _.includes( modelValue, option );
              }
            } );
          }

          function setModel() {
            var array = [];
            _.set( $scope.model, opts.key, array );
            angular.forEach( $scope.multiCheckbox.checked, function( checkbox, index ) {
              if ( checkbox ) {
                array.push( $scope.listOptions[index] );
              }
            } );
          }
        },
        link          : setQdTagManually
      } );

      // Radio button
      iscFormsTemplateService.registerType( {
        name       : 'radio',
        templateUrl: 'forms/foundationTemplates/templates/radio.html',
        wrapper    : ['templateLabel', 'templateHasError'],
        /*@ngInject*/
        controller : function( $scope ) {
          iscFormsTemplateService.initListControlWidget( $scope );
        }
      } );

      // Select/dropdown
      iscFormsTemplateService.registerType( {
        name       : 'select',
        templateUrl: 'forms/foundationTemplates/templates/select.html',
        wrapper    : ['templateLabel', 'templateHasError'],
        /*@ngInject*/
        controller : function( $scope ) {
          iscFormsTemplateService.initListControlWidget( $scope );

          var data = _.get( $scope, 'options.data', {} );

          var isObjectModel = $scope.isObjectModel,
              displayProp   = _.get( data, 'displayField', 'name' ),
              groupProp     = _.get( data, 'groupField', 'group' );

          _.extend( $scope, {
            select: select,
            group : group,
            track : track
          } );

          function select( option ) {
            return ( isObjectModel ? option[displayProp] : option );
          }

          function group( option ) {
            return ( isObjectModel ? option[groupProp] : undefined );
          }

          function track( option ) {
            return ( isObjectModel ? stringify( option ) : option );
          }

          function stringify( json ) {
            return JSON.stringify( angular.copy( json ) );
          }
        }
      } );

      // Textarea
      iscFormsTemplateService.registerType( {
        name          : 'textarea',
        templateUrl   : 'forms/foundationTemplates/templates/textarea.html',
        wrapper       : ['templateLabel', 'templateHasError'],
        defaultOptions: {
          ngModelAttrs: {
            rows: { attribute: 'rows' },
            cols: { attribute: 'cols' }
          }
        }
      } );

      // Date picker (angular-moment-picker)
      iscFormsTemplateService.registerType( {
        name          : 'datePicker',
        templateUrl   : 'forms/foundationTemplates/templates/datePicker.html',
        wrapper       : ['templateLabel', 'templateHasError'],
        defaultOptions: {
          data: {
            collections: {
              tableCell: {
                templateUrl: 'forms/foundationTemplates/tableTemplates/cell.date.html'
              }
            }
          }
        },
        /* @ngInject */
        controller    : function( $scope ) {
          // Normalize an empty date to undefined
          // Otherwise, null or '' date values will cause the form control to be flagged as $dirty on init,
          // when the moment-picker control sets its internal model to undefined.
          if ( !_.get( $scope.model, $scope.options.key ) ) {
            _.set( $scope.model, $scope.options.key, undefined );
          }

          var dateConfig   = _.get( $scope.options, 'data.date', {} ),
              modelOptions = _.get( $scope.options, 'modelOptions', {} );

          // Need to use updateOn: 'blur' with moment-picker
          // Need to allowInvalid in order for min-date and max-date validations to be visible over required
          _.extend( modelOptions, {
            updateOn    : 'blur',
            allowInvalid: true
          } );

          _.extend( $scope, {
            // Scope properties for validation message
            minDate       : $scope.$eval( dateConfig.minDate ),
            maxDate       : $scope.$eval( dateConfig.maxDate ),
            // isc-datepicker properties
            ngModelOptions: modelOptions,
            config        : dateConfig
          } );
        }
      } );

      // Date components [ DD / MM / YYYY ]
      iscFormsTemplateService.registerType( {
        name          : 'dateComponents',
        templateUrl   : 'forms/foundationTemplates/templates/dateComponents.html',
        wrapper       : ['templateLabel', 'templateHasError'],
        defaultOptions: {
          data: {
            collections: {
              tableCell: {
                templateUrl: 'forms/foundationTemplates/tableTemplates/cell.date.html'
              }
            }
          }
        }
      } );

      // Date components [ DD / MM / YYYY ]
      iscFormsTemplateService.registerType( {
        name          : 'dateComponentsPartial',
        templateUrl   : 'forms/foundationTemplates/templates/dateComponentsPartial.html',
        wrapper       : ['templateLabel', 'templateHasError'],
        defaultOptions: {
          validators: {
            partialDate: {
              expression: function( $viewValue, $modelValue, scope ) {
                // Validator expression must return true or false
                return !!(
                  // Define a partial date as:
                  // nothing,
                  _.isEmpty( $viewValue ) ||
                  ( !$viewValue.year && !$viewValue.month && !$viewValue.day ) ||
                  // a year,
                  ( $viewValue.year && !$viewValue.month && !$viewValue.day ) ||
                  // a year and a month,
                  ( $viewValue.year && $viewValue.month && !$viewValue.day ) ||
                  // or a full year, month, and day
                  ( $viewValue.year && $viewValue.month && $viewValue.day )
                );
              },
              message   : '"A partial date must be: a year, a year and month, or a complete date."'
            }
          },
          data      : {
            collections: {
              tableCell: {
                display : function( row, column ) {
                  // partialDate validator ensures we only have a day if we have a month,
                  // and only have a month if we have a year
                  var modelName = column.model,
                      obj       = _.get( row, modelName, {} ),
                      year      = parseInt( obj.year ),
                      month     = parseInt( obj.month ) - 1, // months are 0-indexed in js dates and moment()
                      day       = parseInt( obj.day ),
                      displayValue;

                  if ( !isNaN( day ) && !isNaN( month ) && !isNaN( year ) ) {
                    displayValue = $filter( 'iscDate' )( new Date( year, month, day ), _.get( iscCustomConfigService.getConfig(), 'formats.date.shortDate', 'date' ) );
                  }
                  else if ( !isNaN( month ) && !isNaN( year ) ) {
                    displayValue = ( month + 1 ) + '-' + year;
                  }
                  else if ( !isNaN( year ) ) {
                    displayValue = year.toString();
                  }
                  else {
                    displayValue = '';
                  }

                  return $sce.trustAsHtml( displayValue );
                },
                template: "{{ column.display(row, column.model) }}"
              }
            }
          }
        }
      } );

      // Typeahead (text input with lookup)
      var typeaheadType = {
        name       : 'typeahead',
        templateUrl: 'forms/foundationTemplates/templates/typeahead.html',
        wrapper    : ['templateLabel', 'templateHasError'],
        controller : typeaheadController,
        link       : setQdTagManually
      };
      iscFormsTemplateService.registerType( typeaheadType );

      // Typeahead with third-party/user script support
      // Post-1.6.0 this is synonymous with the 'typeahead' type. Both support the same full API.
      // The 'typeaheadWithScript' type is maintained for backwards compatibility but it functions
      // exactly the same as the 'typeahead' type.
      iscFormsTemplateService.registerType(
        _.extend( {}, typeaheadType,
          {
            name: 'typeaheadWithScript'
          }
        ),
        {
          excludeFromWidgetLibrary: true
        } );


      // Computed Table Field
      // Allows marked-up display of computed sibling fields in the tabular view of a collection
      iscFormsTemplateService.registerType( {
        name          : 'computedTableField',
        // This field should not display as its own field, but should only show in the collection table
        template      : '<span></span>',
        defaultOptions: {
          data: {
            collections: {
              tableCell: {
                display: function( model, field, evalContext ) {
                  var template        = _.get( field, 'customTemplate' ),
                      markedUpDisplay = evalContext( template, {
                        model: model
                      } );
                  return $sce.trustAsHtml( markedUpDisplay );
                }
              }
            }
          }
        }
      } );


      // Embedded form
      iscFormsTemplateService.registerType( {
          name          : 'embeddedForm',
          templateUrl   : 'forms/foundationTemplates/templates/embeddedForm.html',
          wrapper       : ['templateLabel', 'templateHasError'],
          defaultOptions: {
            data: {
              wrapperClass: 'formly-field-no-padding'
            }
          },
          /*@ngInject*/
          controller    : function( $scope ) {
            var opts     = $scope.options,
                subforms = $scope.formState._subforms;

            $scope.efModel = _.get( $scope.model, opts.key );
            if ( !$scope.efModel ) {
              $scope.efModel = {};
              _.set( $scope.model, opts.key, $scope.efModel );
            }

            $scope.efFields = iscFormsTemplateService.getFieldsForEmbeddedForm( opts, subforms );

            $scope.efOptions = _.extend( {}, $scope.formOptions, {
              formState: $scope.formState
            } );
          }
        },
        {
          excludeFromWidgetLibrary: true
        } );

      // Embedded form collection
      iscFormsTemplateService.registerType( {
          name       : 'embeddedFormCollection',
          templateUrl: 'forms/foundationTemplates/templates/embeddedFormCollection.html',
          wrapper    : ['templateLabel', 'templateHasError'],
          /*@ngInject*/
          controller : function( $scope, iscFormsValidationService ) {
            iscFormsValidationService.registerCollection(
              $scope.options.key, {
                id   : $scope.id,
                label: $scope.to.label
              } );
          }
        },
        {
          excludeFromWidgetLibrary: true
        } );

      // Embedded collection of primitive values
      iscFormsTemplateService.registerType( {
          name          : 'primitiveCollection',
          extends       : 'embeddedFormCollection',
          defaultOptions: {
            data: {
              collections: {
                editAs: 'inline'
              }
            }
          }
        },
        {
          excludeFromWidgetLibrary: true
        } );

      /**
       * @description A collection that consists only of selections from a code table.
       * The data model for this widget type is an array of the selected coded items.
       */
      iscFormsTemplateService.registerType( {
        name          : 'codedItemCollection',
        extends       : 'embeddedFormCollection',
        templateUrl   : 'forms/foundationTemplates/templates/codedItemCollection.html',
        defaultOptions: {
          data: {
            listItemSelectionType: 'select',
            collections          : {
              className: {
                view: 'borderless'
              },
              editAs   : 'inline'
            }
          }
        },
        /* @ngInject */
        controller    : function( $scope ) {
          $scope.options.extras.skipNgModelAttrsManipulator = true;

          var codeItemKey = '__CODE_ITEM__',
              key         = $scope.options.key,
              data        = _.get( $scope.options, 'data', {} ),
              mode        = _.get( $scope.formState, '_mode' );

          if ( mode === 'view' ) {
            _.set( $scope.options, 'data.collections.hideTableHeader', true );
          }

          // Create an embedded field for selecting the code item
          var codeTableSelector = {
            key            : codeItemKey,
            type           : data.listItemSelectionType,
            templateOptions: {
              label: data.embeddedLabel
            }
          };
          _.extend( codeTableSelector, {
            data: data
          } );

          _.set( $scope.options, 'data.embeddedFields', [
            codeTableSelector
          ] );

          // Set up a local model for the collection
          var localModel = {},
              model      = _.get( $scope.model, key, [] );

          _.set( localModel, key,
            _.map( model, function( item ) {
                // Add an intermediate key for the embeddedFormCollection
                var obj          = {};
                obj[codeItemKey] = item;
                return obj;
              }
            )
          );
          $scope.localModel = _.get( localModel, key );

          // When changes are made to the collection's model, remove the unneeded key
          $scope.$watch(
            function() {
              return $scope.localModel;
            },
            function( newValue, oldValue ) {
              // flatten localModel to remove the intermediate key
              if ( newValue && !angular.equals( newValue, oldValue ) ) {
                var flattenedModel = _.map( newValue, function( item ) {
                  return item[codeItemKey] || item;
                } );
                _.set( $scope.model, key, flattenedModel );
              }
            },
            true
          );
        }
      } );

      // Embedded Form Listener
      // This field will not be rendered in the DOM, but will listen for FORMS_EVENTS
      // This is useful for communication in embedded subforms
      iscFormsTemplateService.registerType( {
          name       : 'embeddedFormListener',
          templateUrl: 'forms/foundationTemplates/templates/embeddedFormListener.html'
        },
        {
          excludeFromWidgetLibrary: true
        }
      );

      // Control-flow-only widget
      // Useful for UI widgets that are needed to have an effect on control flow,
      // but whose data models should not be persisted in the form's data model.
      //
      // The template type used for the widget is data.controlFlowOnly.templateType;
      // its initial state may be specified with an expression in data.controlFlowOnly.stateInit.
      //
      // Sample usage in FDN:
      // {
      //   "key"            : "chooseBranch",
      //   "type"           : "controlFlowOnly",
      //   "templateOptions": {
      //     "label"  : "This field is for control flow only",
      //     "options": [
      //       "opt 1",
      //       "opt 2"
      //     ]
      //   },
      //   "data"           : {
      //     "controlFlowOnly" : {
      //       "templateType": "radio",
      //       "stateInit"   : "model.someProperty ? 'opt 1' : 'opt 2'"
      //     }
      //   }
      // }

      iscFormsTemplateService.registerType( {
        name          : 'controlFlowOnly',
        templateUrl   : 'forms/foundationTemplates/templates/controlFlowOnly.html',
        defaultOptions: {
          data: {
            controlFlowOnly : {
              wrapperClass: 'formly-field-no-padding'
            }
          }
        },
        /* @ngInject */
        controller    : function( $scope ) {
          var stateKey  = 'controlFlowOnly',
              key       = $scope.options.key,
              data      = _.get( $scope.options, 'data.controlFlowOnly', {} ),
              stateInit = data.stateInit;

          // Eval the initial state based on the data property
          var initialValue = $scope.$eval( stateInit, $scope );

          // Persist it in formState under the stateKey
          var stateModel = _.get( $scope.formState, stateKey );
          if ( _.isEmpty( stateModel ) ) {
            _.set( $scope.formState, stateKey, {} );
            stateModel = _.get( $scope.formState, stateKey );
          }
          _.set( stateModel, key, initialValue );

          // We will shadow its $scope.model with this $scope.localModel.
          $scope.localModel   = stateModel;
          $scope.localOptions = _.merge( {}, $scope.options, {
            type: data.templateType,
            data: {
              _originalModel: $scope.model
            }
          } );
        }
      } );

      /* @ngInject */
      function typeaheadController( $scope, $q, $filter ) {
        iscFormsTemplateService.initListControlWidget( $scope );

        var DEFAULT_MIN_INPUT_LENGTH = 3;

        var key  = $scope.options.key,
            data = _.get( $scope.options, 'data', {} );

        // Properties for user-defined/async scripts
        var userScript       = _.get( data, 'userModel', {} ),
            onSelect         = userScript.onSelect,
            api              = userScript.api || {},
            apiResultsFilter = _.get( api, 'resultsFilter' ),
            apiMinLength     = _.get( api, 'minlength' ),
            apiThreshold     = _.get( api, 'threshold' );

        var minInputLength = parseInt( apiMinLength );

        if ( _.isNaN( minInputLength ) ) {
          minInputLength = DEFAULT_MIN_INPUT_LENGTH;
        }

        _.extend( $scope, {
          displayField       : data.displayField || '',
          getMinInputLength  : getMinInputLength,
          hasApiThreshold    : !!apiThreshold,
          limitToList        : !!data.limitToList,
          minInputLength     : minInputLength,
          onSelect           : _.isFunction( onSelect ) ? onSelect : _.noop,
          onTag              : onTag,
          refresh            : refresh,
          resultsDisplayField: data.resultsDisplayField || ''
        } );

        // api.threshold returns a bool (i.e., whether the search has reached the threshold to call api.get)
        function getMinInputLength( search ) {
          if ( _.isFunction( apiThreshold ) ) {
            var minLength = _.get( search, 'length', 0 );

            if ( apiThreshold( _.get( $scope.model, key ), search ) ) {
              return minLength;
            }
            else {
              return minLength + 1;
            }
          }
          else {
            return $scope.minInputLength;
          }
        }

        function onTag( item ) {
          // ui-select's clear via allow-clear does not reliably clear the model when using tagging,
          // so we must manually null the model if trying to save an empty string
          if ( item === '' ) {
            _.unset( $scope.model, key );
            return '';
          }

          // Other than manually clearing, if we are limiting to the options list, we should short-circuit.
          // Otherwise the search string will be saved as the value, which is counter to limitToList.
          else if ( $scope.limitToList ) {
            return undefined;
          }

          // data.limitToList should ideally be restricted to primitive option lists, but in case it is used
          // with object options, wrap in an object with the displayField property set to the selected value.
          else if ( $scope.isObjectModel ) {
            var itemObj = {};
            _.set( itemObj, $scope.displayField, item );
            return itemObj;
          }

          // Otherwise the user entered a primitive, non-empty string in a limitToList=false widget
          else {
            return item;
          }
        }

        function refresh( search ) {
          var model = _.get( $scope.model, key );
          // If an async API is used, call it and transform the results as configured
          if ( api.get ) {
            // If there is an api.threshold function, only call the API if it is satisfied
            if ( !apiThreshold || ( _.isFunction( apiThreshold ) && apiThreshold( model, search ) ) ) {
              return api
                .get( model, search )
                .then( function( results ) {
                  $scope.selectOptions = ( apiResultsFilter ? apiResultsFilter( results ) : results );
                  return $scope.selectOptions;
                } );
            }
          }
          // Otherwise just return a promise with the search criteria applied as a filter
          else {
            return $q
              .when( $scope.listOptions )
              .then( function( results ) {
                $scope.selectOptions = applyFilter( results, search );
                return $scope.selectOptions;
              } );
          }
        }

        // Applies a filter to async results using the search string
        // The search string is tokenized for a smarter filter
        function applyFilter( results, search ) {
          var tokenFilter;

          // Object-based lists filter on the displayField property
          if ( $scope.isObjectModel ) {
            tokenFilter = function( token ) {
              var filterObject = {};
              _.set( filterObject, $scope.displayField, token );
              return $filter( 'filter' )( results, filterObject );
            };
          }
          // Primitives filter by simple value
          else {
            tokenFilter = function( token ) {
              return $filter( 'filter' )( results, token );
            };
          }

          // This tokenizes the search string by space (' ') and returns the compound result.
          // e.g., if the options list is:
          //   [ 'One', 'Two', 'Three', 'Twelve', 'Twenty', 'Twenty One' ]
          // searching with 'Tw' returns:
          //   [ 'Two', 'Twelve', 'Twenty', 'Twenty One' ]
          // searching with 'Tw One' returns:
          //   [ 'Twenty One' ]
          var filteredResults = _.map( search.split( ' ' ), tokenFilter );
          return _.intersection.apply( this, filteredResults );
        }
      }


      /* @ngInject */
      function htmlController( $scope ) {
        $scope.getHtml = function( propName ) {
          var content = _.get( $scope, propName );

          if ( content ) {
            return $sce.trustAsHtml( $translate.instant( content ) );
          }
          return '';
        };
      }
    }

    function setQdTagManually( scope, elt ) {
      var selector = scope._qdTagSelector,
          qdTag    = _.get( scope, 'to.qdTag' );

      if ( selector && qdTag ) {
        elt.find( selector ).attr( 'qd-tag', qdTag );
      }
    }
  }
} )();
