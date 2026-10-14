define(["knockout", "trc/trc.spa", "client/lodash.min.js"],
  function (ko, SPA, _) {

      return function () {

          var self = SPA.CreateView(this);
          var shell = window.application.shell;
          var dataModel = window.application.dataModel;

          self.isActive = ko.observable(false);
          self.congratulationText = ko.observable("CONGRATULATIONS!");
          self.feedback = ko.observable(dataModel.content.endActivityText);
          self.showCompletionConfirm = ko.observable(false);
          self.learnerName = ko.observable("");
          self.completionDateTime = ko.observable("");
          self.nameFieldFocused = ko.observable(false);

          self.canConfirm = ko.computed(function () {
              return String(self.learnerName() || "").trim().length > 0;
          });

          this.formatCompletionStamp = function (date) {
              try {
                  return date.toLocaleString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit"
                  });
              } catch (e) {
                  return date.toString();
              }
          };

          this.activateView = function () {
              var params = self.getParameters();
              if (params && params.feedback) {
                  self.feedback(params.feedback);
              }
              self.showCompletionConfirm(false);
              self.learnerName("");
              self.completionDateTime("");
          };

          this.openCompletionConfirm = function () {
              self.completionDateTime(self.formatCompletionStamp(new Date()));
              self.showCompletionConfirm(true);
              window.setTimeout(function () {
                  self.nameFieldFocused(true);
              }, 50);
          };

          this.cancelCompletionConfirm = function () {
              self.showCompletionConfirm(false);
          };

          this.confirmCompletion = function () {
              if (!self.canConfirm()) {
                  return;
              }
              var name = String(self.learnerName() || "").trim();
              var stamp = self.completionDateTime() || self.formatCompletionStamp(new Date());
              shell.completionRecord = {
                  name: name,
                  completedAt: stamp,
                  completedAtIso: new Date().toISOString()
              };
              self.showCompletionConfirm(false);
              self.finishActivity();
          };

          this.finishActivity = function () {
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
              window.setTimeout(function () { self.isActive(true); }, 500);
          };
      };
  });
