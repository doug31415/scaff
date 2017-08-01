/**
 * Created by probbins on 1/12/2017
 */

( function() {
  'use strict';

  /* @ngInject */
  angular
    .module( 'isc.forms' )
    .factory( 'iscFormsTransformService', iscFormsTransformService );

  /**
   * @description Service for transforming FDN before it is passed to a formly-form.
   * @param $translate
   * @param iscCustomConfigService
   * @param formlyConfig
   * @returns {{initTransforms: initTransforms}}
   */
  /* @ngInject */
  function iscFormsTransformService( $translate,
    iscCustomConfigService, iscFormFieldLayoutService, formlyConfig ) {
    var config           = iscCustomConfigService.getConfig(),
        transformConfig  = {},
        templateConfig   = {},
        formsConfig      = _.get( config, 'forms', {} ),
        updateOnExcluded = formsConfig.updateOnExcluded;

    // This maps legacy names for properties to their new property names
    var propertyCompatibilityMap = {
      "data.emptyCollectionMessage"   : "data.collections.emptyMessage",
      "data.tableHeaderLabel"         : "data.collections.tableCell.headerLabel",
      "data.tableCellType"            : "data.collections.tableCell.type",
      "data.tableCellTemplate"        : "data.collections.tableCell.template",
      "data.tableCellTemplateUrl"     : "data.collections.tableCell.templateUrl",
      "data.computedField.template"   : "data.collections.tableCell.template",
      "data.computedField.templateUrl": "data.collections.tableCell.templateUrl",
      "data.tableCellDisplay"         : "data.collections.tableCell.display"
    };

    var sectionTransforms = [];

    return {
      configure                   : configure,
      initTransforms              : initTransforms,
      ensureBackwardsCompatibility: ensureBackwardsCompatibility,
      transformSections           : transformSections,

      registerSectionTransform : registerSectionTransform,
      registerFieldTransform   : registerFieldTransform
    };

    function initTransforms( transformConfig ) {
      _.merge( templateConfig, transformConfig );

      // Ensure backwards compatibility first
      formlyConfig.extras.fieldTransform.push( ensureBackwardsCompatibility );

      // Then potentially dependent transforms
      formlyConfig.extras.fieldTransform.push( addDataModelDependencies );
      formlyConfig.extras.fieldTransform.push( addInheritedClassNames );
      formlyConfig.extras.fieldTransform.push( addQdTag );
      formlyConfig.extras.fieldTransform.push( fixWatchers );
      formlyConfig.extras.fieldTransform.push( transformLayouts );
      formlyConfig.extras.fieldTransform.push( translateLabels );
      formlyConfig.extras.fieldTransform.push( wrapFieldGroups );
    }

    function configure( config ) {
      _.merge( transformConfig, config );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Ensures backwards compatibility for any renamed FDN properties.
     * This takes legacy property names and moves them in the FDN to their new locations.
     * @param fields
     * @returns {Array}
     */
    function ensureBackwardsCompatibility( fields ) {
      return forEachField( fields, mapLegacyProperties );

      function mapLegacyProperties( field ) {
        _.map( propertyCompatibilityMap, function( newName, legacyName ) {
          var newProp    = _.get( field, newName ),
              legacyProp = _.get( field, legacyName );

          // Only move if new property is not otherwise set
          if ( legacyProp !== undefined && newProp === undefined ) {
            _.set( field, newName, legacyProp );
            _.unset( field, legacyName );
            console.warn( 'Forms engine: %s has been deprecated and may be removed in the future. Use %s for this property instead.', legacyName, newName );
          }
        } );
      }
    }

    function transformLayouts( fields ) {
      iscFormFieldLayoutService.transformContainer( {
        fields : fields
      }, true );
      return fields;
    }

    /**
     * @memberOf iscFormsTransformService
     * @param fields
     * @returns {Array}
     */
    function translateLabels( fields ) {
      return forEachField( fields, function( field ) {
        var label    = _.get( field, 'templateOptions.label' ),
            expProps = _.get( field, 'expressionProperties', {} ),
            expLabel = expProps['templateOptions.label'];

        if ( label && !expLabel ) {
          _.set( field, 'templateOptions.label', $translate.instant( label ) );
        }
      } );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description formly will automatically create a 'formly-field-{type}' class
     * for each field, but it will not inherit those classes from the field's
     * ancestor types. This method explicitly causes those classes to inherit.
     * @param {Array} fields
     * @returns {Array}
     */
    function addInheritedClassNames( fields ) {
      return forEachField( fields, function( field ) {
        if ( !field.type ) {
          return;
        }

        var isControlFlowOnly = field.type === 'controlFlowOnly',
            type              = isControlFlowOnly ? _.get( field, 'data.controlFlowOnly.templateType' ) : field.type,
            className         = isControlFlowOnly ? 'formly-field-' + type : '',
            inheritedClasses  = getInheritedClassName( type );

        field.className = [inheritedClasses, className || '', field.className].join( ' ' );

        function getInheritedClassName( type ) {
          var template    = getRegisteredType( type ),
              extendsType = getAncestorType( template );

          return [
            ( !!extendsType ? getInheritedClassName( extendsType ) : '' ),
            getClassName( template )
          ].join( ' ' );

          function getClassName( field ) {
            var type;
            if ( field.name === 'controlFlowOnly' ) {
              type = _.get( field, 'defaultOptions.data.controlFlowOnly.templateType' );
            }
            else {
              type = field.name;
            }
            return type ? 'formly-field-' + type : '';
          }

          function getAncestorType( type ) {
            return type.extends !== templateConfig.baseType && type.extends;
          }
        }
      } );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Due to the timing of field initialization and the need to attach
     * field watchers to the $scope of the form (and not of the field), formly does not
     * set up any watchers that are defined on custom templates as defaultOptions.watcher.
     * This method explicitly pushes those default watchers into each instance so that the
     * watchers are set up during formly's form initialization.
     *
     * This also corrects the issue that formly allows watcher listeners to be expressions,
     * while Angular does not.
     *
     * @param {Array} fields
     * @returns {Array}
     */
    function fixWatchers( fields ) {
      var typesWithDefaultWatchers  = _.pickBy( formlyConfig.getTypes(), 'defaultOptions.watcher' ),
          typeKeys                  = _.keys( typesWithDefaultWatchers ),
          fieldsWithDefaultWatchers = _.filter( fields, function( field ) {
            return _.includes( typeKeys, field.type );
          } );

      _.forEach( fieldsWithDefaultWatchers, function( field ) {
        var watcher = _.concat(
          _.get( field, 'watcher' ),
          _.get( typesWithDefaultWatchers[field.type], 'defaultOptions.watcher' )
        );
        _.set( field, 'watcher', _.compact( watcher ) );
      } );

      _.forEach( fields, function( field ) {
        _.forEach( field.watcher, function( watch ) {
          // Angular does not support $watch listeners as expressions, but formly thinks it does.
          // So we need to wrap any watch listener that is an expression in a function.
          if ( watch.listener && !_.isFunction( watch.listener ) ) {
            var watchListener = watch.listener;
            // The formly watcher signature takes additional args of field and the watch's deregistration function.
            watch.listener    = function( field, newVal, oldVal, scope, stop ) {
              scope.$eval( watchListener, {
                field : field,
                newVal: newVal,
                oldVal: oldVal,
                stop  : stop
              } );
            };
          }
        } );
      } );

      return fields;
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Wires up the "templateOptions.qdTag" property in the FDN using formly's
     * ngModelAttrs feature.
     * @param {Array} fields
     * @returns {Array}
     */
    function addQdTag( fields ) {
      return forEachField( fields, function( field ) {
        if ( _.get( field, 'templateOptions.qdTag' ) ) {
          _.set( field, 'ngModelAttrs.qdTag', {
            bound    : 'ng-qd-tag',
            attribute: 'qd-tag'
          } );
        }
      } );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Adds the default label wrapper to field groups that have a label defined
     * with "templateOptions.label".
     * @param {Array} fields
     * @returns {Array}
     */
    function wrapFieldGroups( fields ) {
      return forEachField( fields, function( field ) {
        if ( field.fieldGroup ) {
          if ( !_.get( field, 'elementAttributes["transclude-class"]' ) ) {
            // Provides a selector class for the extra ng-transclude that formly adds to field groups
            _.set( field, 'elementAttributes["transclude-class"]', 'formly-field-group-ng-transclude' );
          }

          if ( transformConfig.wrapFieldGroups ) {
            if ( _.get( field, 'templateOptions.label' ) ) {
              var wrapper = field.wrapper || [];
              wrapper.push( 'templateLabel' );
              field.wrapper = _.uniq( wrapper );
            }
          }

          wrapFieldGroups( field.fieldGroup );
        }
      } );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Applies form configuration to each formly field, including
     * external validation systems.
     * @param fields
     * @returns {*}
     */
    function addDataModelDependencies( fields ) {
      return forEachField( fields, function( field ) {
        if ( field.key ) {
          field.modelOptions = {
            // Set ng-model-options.updateOn:blur to limit excessive validation
            updateOn    : excludeUpdateOn( field.type ) ? undefined : formsConfig.updateOn,
            // Debounce for UI responsiveness if updating on change
            debounce    : formsConfig.debounce,
            // Allow invalid so external validations can use the form model for evaluation
            allowInvalid: formsConfig.allowInvalid
          };

          if ( formsConfig.useExternalValidation ) {
            var validators          = field.validators || ( field.validators = {} );
            // Executes external/HS validation api
            validators.hsValidation = {
              expression: 'hsValidation.getError(options.key)',
              message   : 'hsValidation.$error.text'
            };
          }
        }
      } );

      function excludeUpdateOn( type ) {
        if ( _.includes( updateOnExcluded, type ) ) {
          return true;
        }
        // If no match, check the type hierarchy above this type
        var baseType = _.get( getRegisteredType( type ), 'extends' );
        return !!baseType && excludeUpdateOn( baseType );
      }
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Allows runtime configuration of the transforms applied to a form's sections.
     * A function registered in this way will be executed when *any* formly form is instantiated.
     * This function takes a single argument {Array} sections and must return an array of sections.
     * @param {Function} transformFunction
     */
    function registerSectionTransform( transformFunction ) {
      sectionTransforms.push( transformFunction );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description Allows runtime configuration of the field transforms applied to a formly form.
     * A function registered in this way will be executed when *any* formly form is instantiated.
     * This function takes a single argument {Array} fields and must return an array of fields.
     * @param {Function} transformFunction
     */
    function registerFieldTransform( transformFunction ) {
      formlyConfig.extras.fieldTransform.push( transformFunction );
    }

    /**
     * @memberOf iscFormsTransformService
     * @description This function is automatically called by the framework to transform sections of
     * a form before rendering that form.
     * @param {Array} sections
     */
    function transformSections( sections ) {
      _.forEach( sectionTransforms, function( transform ) {
        transform( sections );
      } );
      return sections;
    }

    /**
     * Utility transformation function that applies transformFunction recursively to fieldGroups.
     * @private
     * @param {Array} fields
     * @param {Function} transformFunction
     * @returns {Array}
     */
    function forEachField( fields, transformFunction ) {
      _.forEach( fields, function( field ) {
        transformFunction( field );

        if ( field.fieldGroup ) {
          forEachField( field.fieldGroup, transformFunction );
        }
      } );

      return fields;
    }

    /**
     * @private
     * @param type
     * @returns {*}
     */
    function getRegisteredType( type ) {
      return formlyConfig.getType( type );
    }
  }
} )();
