define(["knockout", "trc/trc.spa"],
  function (ko, SPA) {

      return function () {
          var self = SPA.CreateView(this);
          var shell = application.shell;
          var params;

          self.video = ko.observable();
          self.isShow = ko.observable(false);

          this.activateView = function () {
              params = self.getParameters();
              //shell.videoPlaying(true);
              self.video(params.video);
              if (params.isShow) {
                  self.isShow(params.isShow)
              }
          }

          self.closeVid = function (button, evt) {
              //if (!shell.watchedVideo()) shell.watchedVideo(true);
              if (params.callBack && self.isShow()) params.callBack();
             // shell.videoPlaying(false);
              var closed = self.close();
          };
      };
  });