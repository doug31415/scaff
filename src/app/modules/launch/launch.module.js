
( function() {
  'use strict';

  angular.module( 'launch', ['ui.router', 'isc.oauth'] )
    .config( function( iscStateProvider ) {
      iscStateProvider.state( getStates() );
    } );


  /**
   * @description this is where module specific states are defined.
   *  Be sure not to make any method name or the structural changes; any changes may prevent ```slush isc:page``` from working properly
   *
   * @returns {} -- UI router states
   */
  function getStates() {
    return {
      'unauthenticated.launch': {
        url            : 'launch?code&state&iss&launch&error',
        template       : '',
        state          : 'unauthenticated.launch',
        data           : {
          layout         : "layout/tpls/blank.html"
        },
        roles          : ["*"],
        controller     : "launchController as launchCtrl",
        resolve        : {
          /* @ngInject */
          configureOauthProperties : function( $window, iscOauthService ) {
            /**
             * Configure or override default oauth config
             **/
            var redirectUrl = $window.location.protocol + "//" +
                              $window.location.hostname +
                              ( $window.location.port ? ":" + $window.location.port : "" ) +
                              $window.location.pathname +
                              "#/launch";

            var config = {
              'scope'       : "user/*.read",
              'responseType': 'code',
              'responseMode': 'query',
              "redirectUrl" : redirectUrl
            };

            return iscOauthService.configure( config );
          },
          /* @ngInject */
          oauthBaseUri : function( iscOauthApi, $stateParams ) {
            return iscOauthApi.configureBaseUrl( $stateParams );
          },
          /* @ngInject */
          oauthResponse : function( oauthBaseUri, iscOauthApi, $stateParams ) {
            return iscOauthApi.doOauthCheck( $stateParams );
          }
        }

      }
    };
  }

} )();

