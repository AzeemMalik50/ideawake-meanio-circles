'use strict';

/* jshint -W098 */
// The Package is past automatically as first parameter
module.exports = function(Circles, app, auth, database) {

  var circles = Circles.controller;

  app.use(circles.loadCircles);
  app.use(circles.userAcl);
  app.use(circles.aclBlocker);

  app.get('/api/circles/visualize', circles.visualize);
  app.get('/api/circles/list', circles.list);
  app.get('/api/circles/tree', circles.tree);
  app.get('/api/circles/mine', circles.mine);
  app.get('/api/circles/usercount', circles.userCount);
  app.get('/api/circles/type/:circleType', circles.byType);
  app.get('/api/circles/types/:circleTypes', circles.byTypes);
  app.get('/api/circles/all', circles.hasCircle('admin'), circles.all);

  app.route('/api/circles/:name')
      .post(circles.hasCircle('admin'), circles.create)
      .put(circles.hasCircle('admin'), circles.update)
      .get(circles.show);
};
