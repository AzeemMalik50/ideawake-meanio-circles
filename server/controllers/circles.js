var mongoose = require('mongoose'),
    Circle = mongoose.model('Circle');

module.exports = function(Circles, app) {
  return {
    visualize: function(req, res) {
        Circles.render('index', {}, function(err, html) {
            res.send(html);
        });
    },
    list: function(req, res) {
        Circle.find({},function(err, data){
          res.send(data);
        });
    },
    tree: function(req, res) {
        Circle.buildPermissions(function(data) {
            res.send(data.tree);
        });
    },

    create: function(req, res) {

        var circle = new Circle(req.body);

        circle.save(function(err) {
            if (err) {
                return res.status(500).json({
                    error: 'Cannot save the circle'
                });
            }

            Circle.buildPermissions(function(data) {
                app.set('circles', data);
            });

            res.json(circle);
        });
    },

    update: function(req, res) {

        if (!req.params.name) return res.send(404, 'No name specified');

        validateCircles(req.params.name, req.body.circles, function(err, status) {

            if (err) return res.send(400, status);

            Circle.findOne({
                name: req.params.name
            }).exec(function(err, circle) {
                if (!err && circle) {
                    Circle.findOneAndUpdate({
                        name: circle.name
                    }, {
                        $set: req.body
                    }, {
                        multi: false,
                        upsert: false
                    }, function(err, circle) {
                        if (err) {
                            return res.send(500, err.message);
                        }

                        Circle.buildPermissions(function(data) {
                            app.set('circles', data);
                        });

                        res.send(200, 'updated');
                    });
                }
            });
        });
    },
    userCount: function(req, res) {
        var User = mongoose.model('User');
        var query = {}
        if (req.body && req.body.permissions.length > 0) {
            var circles = []
            for(var x in req.body.permissions) {
              if((req.body.permissions[x] !== undefined)) {
                circles.push(req.body.permissions[x]);
              }
            }
        }
        if (circles.length > 0) {
            query = {'roles' : {$in : circles }};
        } else {
            query = {'roles' : {$in : ['authenticated'] }};
        }
        User.count(query, function(err, count) {
            res.json({'count' : count});
        });
    },
    mine: function(req, res) {
        var descendants = {};
        for (var index in req.acl.user.circles) {
            descendants[index] = req.acl.user.circles[index].decendants;
        }
        return res.send({allowed: req.acl.user.allowed, descendants: descendants });
    },
    byType:  function(req, res) {
      console.log('i am getting a circle server side by type = ', req.params.circleType);
      Circle.find({'circleType':req.params.circleType}).sort("name").exec(function(err, list){
        return res.send(list);
      });
    },
    all: function(req, res) {
        return res.send({
            tree:req.acl.tree,
            circles: req.acl.circles
        });
    },
    show: function(req, res) {
        return Circle.findOne({'name':req.params.name},function(err,one){
            if(err){
                throw err;
            }
            res.send(one);
        });
    },
    loadCircles: function(req, res, next) {
        var data = app.get('circles');


        if (!req.acl) req.acl = {};

        if (!data) {
            Circle.buildPermissions(function(data) {
                app.set('circles', data);
                req.acl.tree = data.tree;
                req.acl.circles = data.circles;

                next();
            });
        } else {
            req.acl.tree = data.tree;
            req.acl.circles = data.circles;
            next();
        }
    },
    userAcl: function(req, res, next) {
        var roles = req.user && req.user.roles ? req.user.roles : ['anonymous'];

        var userRoles = {};
        var list = [];

        roles.forEach(function(role) {
            if (req.acl.circles[role]) {

                if (list.indexOf(role) === -1) list.push(role);
                req.acl.circles[role].decendants.forEach(function(descendent) {

                    if (list.indexOf(descendent) === -1) {
                        list.push(descendent);
                    }

                });
                userRoles[role] = req.acl.circles[role];
            }
        });

        var tree = Circle.buildTrees(userRoles);

        for (var index in tree) {
            tree[index].children = req.acl.tree[index].children;
        }

        req.acl.user = {
            tree: tree,
            circles: userRoles,
            allowed: list,
        };

        return next();
    },
    aclBlocker: function(req, res, next) {
        req.acl.query = function(model) {

            if (!Circles.models[model]) {
                Circles.models[model] = mongoose.model(model);
            }
            return Circles.models[model].where({
                permissions: {
                    $in: req.acl.user.allowed
                }
            });
        };

        next();
    },
    hasCircle: function(circle) {
        return function (req, res, next) {
            if(!req.user || req.acl.user.allowed.indexOf(circle) === -1) {
                return res.status(403).send('User is not authorized for this action');
            }
            next();
        };
    }
  }

};



function validateCircles(name, circles, callback) {

    Circle.buildPermissions(function(data) {
        circles = [].concat(circles);

        circles.forEach(function(parent, index) {

            if (data.circles[name].decendants.indexOf(parent) !== -1) {
                return callback(true, 'Cannot reference parent in child relationship')
            }
            if (index === circles.length - 1) {
                return callback(null, 'valid');
            }
        });
    });
}

/*

,
        userRoles: function(req, res, next) {


            var roles = req.user && req.user.roles ? req.user.roles : ['anonymous'];

            var myRoles = {};

            roles.forEach(function(role) {
                if (req.circles[role]) {
                    myRoles[role] = req.circes[role];
                }
            });

            return myRoles;
        }
*/
