define([
  'jquery',
  'underscore',
  'backbone',
  '<%= viewPath %>'
], function ($, _, Backbone, <%= viewName %>) {
  'use strict';

  describe('<%= viewName %> view', function () {
    beforeEach(function () {
      this.view = new <%= viewName %>();
      this.view.render();
    });
    it('render() should return the view object', function () {
      expect(this.view.render()).to.equal(this.view);
    });

    it('should contain 2 regions', function () {
      expect(this.view.render().$el.find('div').length).to.equal(2);
    });

  });
});