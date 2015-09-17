'use strict';

module.exports = function() {
  var done = this.async();
  this.prompt({
    type: 'list',
    name: 'tests',
    message: 'Where would you like to store your test files?',
    choices: ['With my app code', 'Separately'],
    filter: function(val) {
      var filterMap = {
        'With my app code': 'appcode',
        'Separately': 'separate'
      };
      return filterMap[val];
    }
  }, function(answer) {
    this.tests = {tests: answer.tests};
    done();
  }.bind(this));
};
