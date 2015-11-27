
var app = angular.module('myApp', []); 
app.controller('todoCtrl', function($scope) {
    $scope.todoList = [{todoText:'感恩节给母亲打电话', done:false, todoDate: new Date("November 26, 2015").toDateString(), 
						createDate: new Date("November 01, 2015").toDateString()}];

    $scope.todoAdd = function() {
        $scope.todoList.push({todoText:$scope.todoInput, done:false, todoDate:$scope.todoDate.toDateString(), createDate: new Date().toDateString()});
        $scope.todoInput = "";
    };

    $scope.remove = function() {
        var oldList = $scope.todoList;
        $scope.todoList = [];
        angular.forEach(oldList, function(x) {
            if (!x.done) $scope.todoList.push(x);
        });
    };
});
