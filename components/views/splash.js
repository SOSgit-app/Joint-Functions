define(["knockout", "trc/trc.spa"],
  function (ko, SPA) {

      return function () {
          var self = SPA.CreateView(this);
          var shell = application.shell;

          self.onButtonClick = function (button, evt) {
              var closed = self.close();
              shell.loaded(true);
              window.openView("mission");
          };
      };
  });
