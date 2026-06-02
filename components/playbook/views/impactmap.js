define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/impactmap"],
    function (ko, SPA, Themes, ImpactMap) {

        var _defaultTheme = Themes.resolveTheme("playbook.impactmap"),
            description = undefined,
            content = undefined;

        return function () {
            var self = SPA.CreateView(this),
                _activateTheme = null;


            this.theme = ko.observable();
            this.nodes = ko.observableArray();
            this.nodeState = ko.observableArray();
            this.defaultText = '';


            this.activateView = function () {
                var parameters = self.getParameters(),
                  map = parameters.document.scaleMap;

                _activateTheme = Object.resolve(parameters, "theme");
                self.theme(Themes.resolveTheme(_activateTheme, _defaultTheme));
                self.nodes(Object.resolve(parameters.document, "nodes"));
                self.nodeState(Object.resolve(parameters.document, "nodeState"));
                self.defaultText = Object.resolve(parameters.document, "defaultText");

                Array.foreach(self.nodes(), function (node) {
                    var impact = map(node);
                    if (impact) {
                        self.nodeState().push(impact);
                    }
                }, 0)


                Themes.call(self.theme(), ["activateView"], [self]);


            };

            this.bindView = function (view) {
                Themes.call(self.theme(), ["bindView"], [self, view]);
            };

            this.attachView = function (view) {
                Themes.call(self.theme(), ["attachView"], [self, view]);
            };

            this.completeView = function (view) {
                Themes.call(self.theme(), ["completeView"], [self, view]);
            };

            this.mapView = function () {
                description = TRC.$('.trc-pbce.node-description');
            }

            this.getImpact = function (id) {
                var impact = Array.lookupBy(self.nodeState(), 'id', id);
                return (impact) ? 'node-' + impact.dir + '-' + impact.impact + '-' + impact.scale : '';
            }

            this.onNodeClick = function (node, evt) {
                var id = node.getAttribute('data-id'),
                    selectedNode = Array.lookupBy(self.nodes(), 'id', id);
                TRC.html(description, selectedNode.description);
                return false;
            }


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
