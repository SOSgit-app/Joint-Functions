define(["knockout", "trc/trc.spa", "client/lodash.min.js"],
  function (ko, SPA, _) {

      return function () {

          var self = SPA.CreateView(this);
          var shell = window.application.shell;
          var dataModel = window.application.dataModel;

          self.isActive = ko.observable(false);
          self.congratulationText = ko.observable("CONGRATULATIONS!");
          self.feedback = ko.observable(dataModel.content.endActivityText);

          this.activateView = function () {
              var params = self.getParameters();
              if (params) {
                  self.feedback(params.feedback);
              }

          };

          this.submit = function () {
              self.isActive(false);
              shell.startPlayVideo("JF504_7", function () {
                  var scorm = window.application.scorm;
                  window.setTimeout(function () {
                      scorm.setScore(100, true, function () {
                          scorm.setStatus("completed", true, function () {
                              var closed = self.close();
                              self.closeActivity();
                          }, function (data) {
                              alert(data);
                          });
                      }, function (data) {
                          alert(data);
                      });
                  });
              });
          };        

          this.closeActivity = function () {
              window.close();
          };

          this.compositionComplete = function (view) {
              window.setTimeout(function () { self.isActive(true); }, 500); //find another call after view is loaded
          };
      };
  });
