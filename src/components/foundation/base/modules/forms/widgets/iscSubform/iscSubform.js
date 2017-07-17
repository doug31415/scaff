( function() {
  'use strict';

  angular.module( 'isc.forms' )
    .directive( 'iscSubform', iscSubform );

  /* @ngInject */
  /**
   * @ngdoc directive
   * @memberOf isc.forms
   * @param FORMS_EVENTS
   * @param $q
   * @param $translate
   * @param iscScrollContainerService
   * @param iscConfirmationService
   * @returns {{restrict: string, replace: boolean, controllerAs: string, scope: {model: string, options: string, formTitle: string, breadcrumbs: string, mainFormConfig: string, subformConfig: string}, bindToController: boolean, controller: controller, link: link, templateUrl: directive.templateUrl}}
   */
  function iscSubform( FORMS_EVENTS, $q, $translate, iscScrollContainerService, iscConfirmationService ) {//jshint ignore:line

    // ----------------------------
    // vars
    // ----------------------------

    // ----------------------------
    // class factory
    // ----------------------------
    var directive = {
      restrict        : 'E',
      replace         : true,
      controllerAs    : 'subformCtrl',
      scope           : {
        model         : '=',
        options       : '=',
        formTitle     : '=',
        breadcrumbs   : '=?',
        mainFormConfig: '=',
        subformConfig : '='
      },
      bindToController: true,
      controller      : controller,
      link            : link,
      templateUrl     : function( elem, attrs ) {
        return attrs.templateUrl || 'forms/widgets/iscSubform/iscSubform.html';
      }
    };

    return directive;

    // ----------------------------
    // functions
    // ----------------------------
    /* @ngInject */
    function controller( $scope ) {
      var self = this;
      var currentScrollPos;

      self.breadcrumbs = self.breadcrumbs || [];
      self.childConfig = {
        breadcrumbs: self.breadcrumbs
      };
      self.breadcrumbs.push( {
        name: self.formTitle,
        ctrl: self
      } );

      _.merge( self, {
        onClick        : onClick,
        breadcrumbClick: breadcrumbClick,
        formButtons    : getFormButtons(),
        showButton     : showButton,

        // header actions
        showAction: showAction,
        evalAction: evalAction
      } );

      function getFormButtons() {
        var buttons     = _.get( self, 'mainFormConfig.buttonConfig.buttons', {} );
        var buttonArray = _.map( buttons, function( button, name ) {
            return _.merge( {}, button, {
              name: name
            } );
          }
        );
        return _.sortBy( buttonArray, 'order' );
      }

      function showButton( button ) {
        return _.isFunction( button.hide ) ? !button.hide( self.mainFormConfig.buttonContext ) : !button.hide;
      }

      function onClick( button ) {
        var click      = button.onClick || function() {
              },
            afterClick = button.afterClick || function() {
              };

        $q.when( click( self.mainFormConfig.buttonContext ) )
          .then( afterClick );
      }

      function breadcrumbClick( index, onCancel ) {
        var dirtyBreadcrumb,
            breadcrumbCount = self.breadcrumbs.length - index - 1;

        for ( var i = index; i < self.breadcrumbs.length; i++ ) {
          var breadcrumb = self.breadcrumbs[i];
          if ( _.get( breadcrumb, 'subform.form.$dirty' ) ) {
            dirtyBreadcrumb = breadcrumb;
            break;
          }
        }

        if ( dirtyBreadcrumb ) {
          iscConfirmationService
            .show( dirtyBreadcrumb.childName + ' ' + $translate.instant( 'contains unsaved data. Proceed?' ) )
            .then( onYes );
        }
        else {
          onYes();
        }
        function onYes() {
          onCancel( breadcrumbCount );
        }
      }

      // Event listeners
      $scope.$on( FORMS_EVENTS.showSubform, function( event, subformParams ) {
        var childName;
        if ( _.get( subformParams, 'options.formState._mode' ) === 'view' ) {
          childName = $translate.instant( 'View' );
        }
        else {
          childName = $translate.instant( subformParams.isNew ? 'Add' : 'Edit' );
        }
        childName += ' ' + $translate.instant( subformParams.itemLabel );

        _.extend( self.childConfig, subformParams );

        self.childConfig.onSubmitAll = onSubmitAll;
        self.childConfig.formTitle   = childName;
        self.childConfig.renderForm  = true;

        _.extend(
          _.last( self.breadcrumbs ),
          {
            onCancel : subformParams.onCancel,
            subform  : subformParams.subform,
            childName: childName
          }
        );

        currentScrollPos = subformParams.scrollPos;

        // Prevent this event from cascading up to parents
        event.stopPropagation();

        function onSubmitAll() {
          if ( subformParams.onSubmit() ) {
            var submitParent = _.get( self, 'subformConfig.onSubmitAll' );
            if ( submitParent ) {
              submitParent();
            }
          }
        }
      } );

      $scope.$on( FORMS_EVENTS.hideSubform, function( event ) {
        self.childConfig.renderForm = false;

        _.defer( function() {
          delete self.childConfig.subform;
        }, 0 );

        _.delay( function() {
          iscScrollContainerService.setCurrentScrollPosition( currentScrollPos, 150 );
        }, 600 );

        // Prevent this event from cascading up to parents
        event.stopPropagation();

        // Return to parent breadcrumb state
        var breadcrumb = self.breadcrumbs.pop();
        while ( breadcrumb && breadcrumb.ctrl !== self ) {
          breadcrumb = self.breadcrumbs.pop();
        }
        self.breadcrumbs.push( breadcrumb );
      } );

      // Header actions
      function showAction( action, section ) {
        var modeMatches = !action.mode || self.options.formState._mode === action.mode,
            hidden      = action.hide && evalAction( section )( action.hide );

        return modeMatches && !hidden;
      }

      function evalAction( section ) {
        return function( prop ) {
          return $scope.$eval( prop, {
            section  : section,
            formState: self.options.formState
          } );
        };
      }
    }

    function link( scope, element, attrs ) {
      iscScrollContainerService.setCurrentScrollPosition( 0 );
    }

  }//END CLASS

  // ----------------------------
  // injection
  // ----------------------------

} )();
