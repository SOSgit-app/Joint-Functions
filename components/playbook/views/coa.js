define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/coa", "jqueryui"],
    function (ko, SPA, Themes, Coa) {

        var _defaultTheme = Themes.resolveTheme("playbook.coa");

        return function () {
            var self = SPA.CreateView(this),
                activateTheme = null;

            this.theme = ko.observable();
            this.COACollection = [];
            this.selected = ko.observable();

            this.activateView = function () {
                var parameters = self.getParameters();
                this.COACollection = Object.resolve(parameters.document, "instances");
                this.selected = Object.resolve(parameters.document, "selected");
                activateTheme = Object.resolve(parameters, "theme");
                self.theme(Themes.resolveTheme(activateTheme, _defaultTheme));

                Themes.call(self.theme(), ["activateView"], [self]);
            };

            this.mapView = function (view) {
                var tabs = $('[data-tab]'),
                    content = $('[data-content]'),
                    levels = $('[data-id]'),
                    coa = $('[data-coa]'),
                    sliders = $('.coa-slider');

                tabs.on('click', function () {
                    var tabIndex = $(this).attr('data-tab');
                    tabs.removeClass('active')
                      .addClass('inactive')
                      .eq(tabIndex)
                      .addClass('active')
                      .removeClass('inactive');
                    content.hide().eq(tabIndex).show();
                });

                //selected coa
                coa.on('click', function () {
                    coa.not(this).removeAttr('checked');
                    $(this).attr('checked', 'checked');
                    self.selected.coa = $(this).attr('data-coa');
                });

                //radio selection

                levels.on('click', function () {
                    var elem = $(this),
                      indicator = elem.attr('data-indicator'),
                      id = elem.attr('data-id');

                    elem.addClass('selected').siblings().removeClass('selected');
                    self.selected.levels[indicator] = id;
                });

                //slider selection
                sliders.each(function (index) {
                    var elem = $(this),
                        max = elem.attr('data-max'),
                        mid = Math.ceil((parseInt(max, 8) + 1) / 2);

                    elem.empty().slider({
                        min: 1, max: max, range: 'min', value: mid, animate: true, slide: function (event, ui) {
                            var indicator = $(this).attr('data-indicator');
                            self.selected.levels[indicator] = ui.value;
                        }
                    });
                });
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
