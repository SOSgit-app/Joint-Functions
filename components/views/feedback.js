define(["knockout", "trc/trc.spa"],
  function (ko, SPA) {

      return function () {
          var self = SPA.CreateView(this);
          var shell = application.shell;
          var params;

          self.feedback = ko.observable();
          self.back = ko.observable();
          self.end = ko.observable();
          self.title = ko.observable();

          this.activateView = function () {
              params = self.getParameters();
              self.feedback(params.feedback);
              self.back(params.back);
              self.end(params.end);
              self.title(params.title);
          }

          self.continueProcess = function (button, evt) {
              if (params.callBack) params.callBack();
              var closed = self.close();
          };

          self.backProcess = function (button, evt) {
              if (params.retryCallBack) {
                  params.retryCallBack();
              }
              var closed = self.close();
          };
          self.endProcess = function (button, evt) {
              var closed = self.close();
              window.close();
          };
      };
  });