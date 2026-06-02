define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/cba"],
    function (ko, SPA, Themes, CBA) {

      var _defaultTheme = Themes.resolveTheme("playbook.cba");

      return function () {
        var self = SPA.CreateView(this),
            activateTheme = null;

        this.theme = ko.observable();
        this.Assessment = ko.observable();

        this.activateView = function () {
          var parameters = self.getParameters();
          
          self.Assessment = parameters.document;
          activateTheme = Object.resolve(parameters, "theme");
          self.theme(Themes.resolveTheme(activateTheme, _defaultTheme));

          Themes.call(self.theme(), ["activateView"], [self]);
        };

        this.mapView = function (view) {
          var inputs = $('form :input').on('click', function () { self.Assessment.selection = $(this).val(); });
        }

        this.bindView = function (view) {
            Themes.call(self.theme(), ["bindView"], [self, view]);
        };

        this.attachView = function (view) {
            Themes.call(self.theme(), ["attachView"], [self, view]);
        };

        this.completeView = function (view) {
            Themes.call(self.theme(), ["completeView"], [self, view]);
        };

        //close button in modal view
        this.onButtonClick = function (button, evt) {
          try {
            Themes.call([self.theme()], ["onButtonClick"], [self, button, evt || event],
                function () {
                  self.close();
                });
          } catch (err) {
            self.logMethodError("onButtonClick", err, true);
          }
        };
      };
    });
