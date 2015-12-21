var angularTemplatePreprocessor = require("wallaby-ng-html2js-preprocessor");
module.exports                  = function () {
  'use strict';

  var commonConfig = require('./gulp/common.json');

  var commonVendorJs    = (commonConfig.vendor.js || []).map(noInstrument);
  var commonVendorMocks = (commonConfig.vendor.mocks || []).map(noInstrument);
  var commonModuleMocks = (commonConfig.module.mocks || []).map(noInstrument);
  var commonModuleJs    = commonConfig.module.js || [];
  var commonModuleTests = commonConfig.module.tests || [];

  return {
    basePath       : '..', // Ignored through gulp-karmaa
    "files"        : []
      .concat(commonVendorJs)
      .concat(commonVendorMocks)
      .concat(commonModuleMocks)
      .concat(commonModuleJs),
    "tests"        : commonModuleTests,
    "preprocessors": {
      "src/common/modules/**/*.html": function (file) {
        return angularTemplatePreprocessor.transform(file, {
          "stripPrefix": "src/common/modules/",
          "moduleName" : "isc.templates"
        });
      }
    },
    "testFramework": "jasmine"
  };

  function noInstrument(file) {
    return { pattern: file, instrument: false };
  }
};