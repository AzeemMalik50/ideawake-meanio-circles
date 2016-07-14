'use strict';

//Circles service used for circles REST endpoint
angular.module('mean.circles').factory('UserList', ['$uibModal', 'Circles' , 'Awareness', 'Invites', '$filter',
  function($uibModal, Circles, Awareness, Invites, $filter){


    var sendInvites = function(invites) {
      console.log('sending invites', invites);
      return Invites.save({invites: invites}).$promise;
    }

  return {
    'openModal': function(_defaults) {
      var modalInstance = $uibModal.open({
        animation: true,
        backdrop: true,
        templateUrl: 'admindashboard/views/admindashboard/modals/create-list.html',
        controller: function ($scope, $uibModalInstance) {
          $scope.invites = {
            roles: ['authenticated'],
            type: 'employee',
            inviteList: []
          };
          $scope.group = {'circleType':_defaults.type};
          $scope.$watch('userList', function(val, old){
            if (val !== old && val !== '' && $scope.invites){
                $scope.invites.inviteList = $filter('csvToObj')(val);
                console.log($scope.invites);
            }
          });
          $scope.ok = function () {
            $scope.group.category = [$scope.category];
            console.log('category_b', $scope.category, $scope.group.category);

            if(!$scope.group || !$scope.group.name || $scope.group.name.length == 0) {
              alert('Name is required');
            } else if( !$scope.category ) {
              alert('category is required');
            } else {
              var circle = new Circles($scope.group);
              circle.$save(function(newCircle){
                  $scope.invites.roles.push(circle.name);
                  sendInvites($scope.invites).then(function(){
                  console.log('success sent invites');
                  Awareness.awareness('success', 'User List Created!', true);

                  $uibModalInstance.close(newCircle);
                  }, function(error) {
                    console.log('unable to send invites');
                    Awareness.awareness('danger', 'Unable to send invites', true);
                  $uibModalInstance.close(newCircle);
                  });

              });
            }
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
        },
        size: '',
        resolve: {
        }
      });
      return modalInstance.result;
    }
  };
}]);
