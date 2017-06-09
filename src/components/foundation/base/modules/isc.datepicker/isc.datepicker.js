/**
 * Created by probbins on 3/3/2017, 12:56:21 PM.
 */

( function() {
  'use strict';

  angular
    .module( 'isc.datepicker' )
    .directive( 'iscDatepicker', iscDatepicker );


  /**
   * @description Wrapper for angular-moment-picker (which is created via a moment-picker directive).
   *
   * See template for required shim attribute, if using a moment-picker outside this wrapper.
   *
   * The "config" object attribute accepts any attribute that moment-picker supports. See the moment-picker
   * documentation for the most current list of these.
   * https://github.com/indrimuska/angular-moment-picker#options
   *
   *
   * Notes:
   *
   *   ng-model-options
   * Using 'updateOn' with a value more frequent than 'blur' can cause some issues with the model
   * updating as the user is entering a date using the keyboard in the input, making the input
   * unusable for entering dates by keyboard. Using updateOn: 'blur' is strongly recommended.
   *
   *
   *   min-view and max-view
   * Manually setting the min-view and max-view attributes on a moment-picker can cause undesired
   * behavior when changing the input manually; specifically, changing parts of the date (such as the year)
   * may not update the model. The component automatically determines min-view and max-view based on the
   * provided format; omitting these attributes and allowing the component to do so is the recommended approach.
   *
   *
   * @param devlog
   * @param $compile
   * @param iscCustomConfigService
   * @returns {Object}
   */

  /* @ngInject */
  function iscDatepicker( devlog, $compile, iscCustomConfigService ) {
    var log = devlog.channel( 'iscDatepicker' );
    log.logFn( 'LOADED' );

    return {
      restrict        : 'E',
      link            : link,
      scope           : true,
      require         : 'ngModel',
      bindToController: {
        'ngModel': '=ngModel',
        'config' : '=?'
      },
      controller      : iscDatepickerController,
      controllerAs    : 'dateCtrl',
      templateUrl     : function( elem, attrs ) {
        return attrs.templateUrl || 'isc.datepicker/isc.datepicker.html';
      }
    };

    /* @ngInject */
    function iscDatepickerController( $scope ) {
      var self = this;

      // When a moment-picker input is cleared, the ng-model value is set to true.
      // This occurs even in demo plunkers from the moment-picker github site.
      // So, set up a watch for this condition and if this occurs, null the value instead.
      $scope.$watch(
        function() {
          return self.ngModel;
        },
        function( value ) {
          if ( value === true ) {
            self.ngModelCtrl.$setViewValue( null );
            self.ngModelCtrl.$commitViewValue();
          }
        } );
    }

    function link( scope, elem, attrs, ngModelCtrl ) {
      var input       = elem.find( 'input' ),
          ctrl        = scope.dateCtrl,
          model       = ctrl.ngModel,
          momentModel = moment( model ),
          config      = _.get( ctrl, 'config', {} ),
          format      = config.format,
          locale      = config.locale;

      // Default date format from app config, if none specified for this instance.
      var defaultDateFormat = _.get(
        iscCustomConfigService.getConfig(),
        'formats.date.shortDate',
        'MM/DD/YYYY'
      );

      // Set locale on this instance, if specified
      if ( locale ) {
        momentModel.locale( locale );
      }

      ctrl.ngModelCtrl    = ngModelCtrl;
      // Need to take the ng-model and pass it through as a moment()
      // If the date is undefined/empty, pass undefined, since moment(undefined) is the current date
      ctrl.ngModel        = model ? momentModel : undefined;
      // moment-picker also requires a separate formatted model
      ctrl.formattedModel = ( model && format ) ? momentModel.format( format ) : model;

      // Need to copy ng attributes to moment-picker's input
      copyAttr( 'ngModelOptions' );
      copyAttr( 'ngRequired' );
      copyAttr( 'ngDisabled' );

      copyAttr( 'disabled' );
      copyAttr( 'required' );

      // The main moment-picker attribute gets the formatted model
      // This needs to happen here and not in the template so the dynamically added attributes work
      setAttr( 'momentPicker', 'dateCtrl.formattedModel' );
      setAttr( 'ngModel', 'dateCtrl.ngModel' );

      // Set default format (will be overridden by config format, if provided)
      setAttr( 'format', defaultDateFormat );

      // Also copy in moment-picker configuration attributes
      // These can be any attributes specified on https://github.com/indrimuska/angular-moment-picker
      _.forOwn( config, function( value, configItem ) {
        setAttr( configItem, value );
      } );

      // Set the name attribute on the moment-picker input so that we can look it up
      // in the ng-form and perform validation.
      var name = attrs.name;
      if ( name ) {
        var pickerName = name + '_momentPicker';
        setAttr( 'name', pickerName );

        // After the child control has been instantiated, we need to replicate its validation
        // properties so this control will look and behave correctly.
        scope.$evalAsync( function() {
          var childControl = ngModelCtrl.$$parentForm[pickerName];

          _.extend( ngModelCtrl.$validators, childControl.$validators );
          ngModelCtrl.$parsers    = childControl.$parsers;
          ngModelCtrl.$formatters = childControl.$formatters;

          // Keep $touched and $dirty in sync for proper display
          scope.$watch(
            function() {
              return childControl.$touched;
            },
            function( touched ) {
              if ( touched ) {
                ngModelCtrl.$setTouched();
              }
              else {
                ngModelCtrl.$setUntouched();
              }
            } );

          scope.$watch(
            function() {
              return childControl.$dirty;
            },
            function( dirty ) {
              if ( dirty ) {
                ngModelCtrl.$setDirty();
              }
              else {
                ngModelCtrl.$setPristine();
              }
            } );
        } );
      }

      $compile( input )( scope );


      function copyAttr( attr ) {
        setAttr( attr, attrs[attr] );
      }

      function setAttr( attr, value ) {
        var attrValue = _.isObject( value ) ? JSON.stringify( value ) : value;
        if ( attrValue !== undefined ) {
          input.attr( _.kebabCase( attr ), attrValue );
        }
      }
    }
  }
} )();
