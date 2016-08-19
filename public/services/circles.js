'use strict';

//Circles service used for circles REST endpoint
angular.module('mean.circles').factory('Circles', ['$resource',
  function($resource) {
    return $resource('api/circles/:name', {
      name: '@name'
    }, {
      update: {
        method: 'PUT'
      },
      mine: {
        method: 'GET',
        isArray: false,
        url: '/api/circles/mine'
      },
      bytype: {
        method: 'GET',
        isArray: true,
        url: '/api/circles/type/:type'
      },
      all: {
        method: 'GET',
        isArray: false,
        url: '/api/circles/all'
      },
      list: {
        method: 'GET',
        isArray: true,
        url: '/api/circles/list'
      },
      usercount: {
        method: 'GET',
        isArray: false,
        url: '/api/circles/usercount'
      }
    });
  }
]);
