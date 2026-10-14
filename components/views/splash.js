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

          self.submitPassword = function () {
              var entered = String(self.password() || "").trim();
              if (entered === ACCESS_CODE) {
                  self.showError(false);
                  self.unlocked(true);
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
              self.close();
              shell.loaded(true);
              window.openView("mission");
          };
      };
  });
