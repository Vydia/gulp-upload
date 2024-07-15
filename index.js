'use strict';

var _ = require('lodash');
var through = require('through2');
var PluginError = require('plugin-error');
var urllib = require('urllib');
var formstream = require('formstream');
var path = require('path');

// consts
var PLUGIN_NAME = 'gulp-upload';

var defaultOptions = {
  method: 'post',
  timeout: 5000
}

// exporting the plugin main function
module.exports = function(options) {
  if (!options) {
    options = {};
  }
  if (!options.server) {
    throw new PluginError(PLUGIN_NAME, 'Could not find server to upload.');
  }
  var callback = options.callback || function(){};

  return through.obj(async function(file, enc, next) {
    if (!file.isBuffer()) return next();

    var self = this;
    var content = file.contents.toString();
    var form = formstream();
    var data = options.data || {};
    for (var key in data) {
      var value = data[key];
      if (typeof value === 'function') {
        form.field(key, value(file));
      } else {
        form.field(key, data[key]);
      }
    }

    var fileinputname = options.fileinputname || "file";
    form.file(fileinputname, file.path);

    var inputOptions = _.omit(options, 'server', 'data', 'fileinputname')
    var requestOptions = Object.assign({}, defaultOptions, inputOptions, {
      headers: form.headers(options.headers),
      stream: form
    })

    console.log('got here before await')
    const { data: resData, res } = await urllib.request(options.server, requestOptions);
    console.log('got here after await')
    callback(null, resData, res);
    self.push(file);
    next();
  });
};
