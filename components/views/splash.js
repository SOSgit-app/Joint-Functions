define(["knockout", "trc/trc.spa"],
  function (ko, SPA) {

      return function () {
          var self = SPA.CreateView(this);
          var shell = application.shell;
          var ACCESS_CODE = "8476";

          self.unlocked = ko.observable(false);
          self.password = ko.observable("");
          self.showError = ko.observable(false);
          self.passwordFocused = ko.observable(true);

          self.enterActivity = function () {
              self.close();
              shell.loaded(true);
              window.openView("mission");
          };

          self.submitPassword = function () {
              var entered = String(self.password() || "").trim();
              if (entered === ACCESS_CODE) {
                  self.showError(false);
                  self.unlocked(true);
                  // Continue immediately after a correct code so learners aren't stuck on splash.
                  window.setTimeout(function () {
                      self.enterActivity();
                  }, 150);
                  return;
              }
              self.showError(true);
              self.password("");
              self.passwordFocused(false);
              window.setTimeout(function () {
                  self.passwordFocused(true);
              }, 0);
          };

          self.onPasswordKeyup = function (data, evt) {
              if (evt && (evt.keyCode === 13 || evt.which === 13)) {
                  self.submitPassword();
                  return false;
              }
              return true;
          };

          self.onButtonClick = function () {
              if (!self.unlocked()) {
                  return;
              }
              self.enterActivity();
          };
      };
  });
