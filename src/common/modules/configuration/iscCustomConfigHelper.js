/**
 * Created by douglasgoodman on 11/19/14.
 */

(function () {
  'use strict';

  /* @ngInject */
  function iscCustomConfigHelper(devlog, $state) {
    devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper LOADED');

    // ----------------------------
    // vars
    // ----------------------------

    var allStates = {};

    // ----------------------------
    // class factory
    // ----------------------------

    var factory = {
      addStates   : addStates,
      resetStates : resetStates,
      getStateObj : getStateObj,
      getAllStates: getAllStates,

      stateIsExcluded: stateIsExcluded,

      getCurrentStateTranslationKey   : getCurrentStateTranslationKey,
      getSectionTranslationKeyFromName: getSectionTranslationKeyFromName,
      getTranslationKeyFromName       : getTranslationKeyFromName,
      isCurrentState                  : isCurrentState
    };

    return factory;

    // ----------------------------
    // functions
    // ----------------------------

    function addStates(states) {
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.addStates');
      devlog.channel("iscCustomConfigHelper").debug('...states: ' + JSON.stringify(states));

      _.forEach(states, function (state) {
        allStates[state.state] = state;
      });
    }

    function resetStates() {
      allStates = {};
    }

    function getAllStates() {
      return allStates;
    }

    function getStateObj(state) {
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.getStateObj: ' + state);
      var s = allStates[state];
      devlog.channel("iscCustomConfigHelper").debug('...s: ' + JSON.stringify(s));
      return s;
    }

    // ----------------------------
    // used to check if a top nav element is excluded
    // the interceptor uses this to disallow navigation to that state
    // see iscCustomConfigInterceptor.request()
    function stateIsExcluded(stateName) {
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.stateIsExcluded');
      devlog.channel("iscCustomConfigHelper").debug('Checking if state is excluded');
      if (!allStates[stateName]) {
        devlog.channel("iscCustomConfigHelper").debug('State is not in allStates');
        return true;
      }

      if (allStates[stateName].exclude) {
        devlog.channel("iscCustomConfigHelper").debug(JSON.stringify(allStates[stateName]));
        devlog.channel("iscCustomConfigHelper").debug('State is marked as exclude');
        return true;
      }

      return false;
    }

    // ----------------------------
    function getCurrentStateTranslationKey() {
      var stateName = $state.$current.name;
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.getCurrentStateTranslationKey: ' + stateName);

      return getTranslationKeyFromName(stateName);
    }


    // get the translation key from the state name
    function getTranslationKeyFromName(stateName) {
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.getTranslationKeyFromName: ' + stateName);
      var state = allStates[stateName];
      return state ? state.translationKey : 'ISC_NOT_FOUND';
    }

    // get the top level section's translation key from the state name
    function getSectionTranslationKeyFromName(stateName) {
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.getSectionTranslationKeyFromName: ' + stateName);
      var arr     = stateName.split('.');
      var sectArr = arr.splice(0, 2); // the first two values are the section
      var sectionName = sectArr.join('.');

      devlog.channel("iscCustomConfigHelper").debug('...sectArr: ' + sectArr);
      devlog.channel("iscCustomConfigHelper").debug('...sectionName: ' + sectionName);

      var state = allStates[sectionName];

      return state ? state.translationKey : '';
    }

    // is the state currently active
    function isCurrentState(stateName) {
      devlog.channel("iscCustomConfigHelper").debug('iscCustomConfigHelper.isCurrentState: ', stateName);
      return $state.is(stateName);
    }


  }// END CLASS

  // ----------------------------
  // inject
  // ----------------------------

  angular.module('isc.configuration')
    .factory('iscCustomConfigHelper', iscCustomConfigHelper);
})();