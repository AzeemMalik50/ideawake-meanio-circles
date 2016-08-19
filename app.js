'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;
var async = require('async');

var mongoose = require('mongoose');

var Circles = new Module('circles');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */

Circles.register(function(app, auth, database) {

  Circles.controller = require('./server/controllers/circles')(Circles, app);
  Circles.registerCircle = registerCircle;
  Circles.updateCircleMemberCount = updateCircleMemberCount;
  Circles.routes(app, auth, database);
  Circles.angularDependencies(['mean.users']);

  Circles.menus.add({
    title: 'Circles',
    link: 'manage circles',
    roles: ['authenticated', 'admin'],
    menu: 'main'
  });

  Circles.models = {};

  return Circles;
});

function updateCircleMemberCount() {
  var Circle = require('mongoose').model('Circle');
  var User = require('mongoose').model('User');
  Circle.find({}, function(err, circles) {
    async.eachOfLimit(circles,1,function(circle,key,next) {
      User.count( {roles :{$in :[circle.name]}}, function(err, count){
        if(err){
          next(err);
        }
        Circle.update({name:circle.name},{$set :{ members:count}}, function(err) {
          next(err);
        });
      });
    }, function(err){
      if(err){
        console.log(err);
      }
      console.log('Finished updating circles!');
    });
  });
}

function registerCircle(name, parents) {
  var Circle = require('mongoose').model('Circle');

  var query = { name: name };
  var set = {};
  if(parents) {
    set.$push = {
      circles: parents
    };
  }

  Circle.findOne(query, function(err, data) {
    if (!err && !data) {
      Circle.findOneAndUpdate(query, set, {
        upsert: true
      }, function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
  });
}

/*
Y Override queries to check user permisisons
Y Add middleware for checking for specific circles by name
O Page to create and manage circles + sow circles heirarchy
*/
