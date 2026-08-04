define(["knockout", "trc/trc.spa", "client/lodash.min.js", "scripts/jquery.ui.touch-punch.js"],
  function (ko, SPA, _, touchPunch) {

      return function () {

          var self = SPA.CreateView(this);
          var shell = window.application.shell;
          var dataModel = window.application.dataModel;

          self.isActive = ko.observable(false);
          self.explanation = ko.observable();

          this.activateView = function () {
              var params = self.getParameters();
            
              self.explanation(dataModel.content.instruction);
              shell.tutorial.view = 'description';
              // if (dataModel.content.tutorial) shell.tutorial.show();
          };

          this.submit = function () {
              shell.tutorial.hide();
              self.isActive(false);
              window.setTimeout(function () {
                  shell.tutorial.hasPlayed(false);
                  var closed = self.close();
                  window.openView("scenario");
              });

          };

          this.compositionComplete = function (view) {
              window.setTimeout(function () { self.isActive(true); }, 500); //find another call after view is loaded
          };
      };
  });
