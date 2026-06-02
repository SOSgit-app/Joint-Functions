define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/documentedit"],
function (ko, SPA, Themes, DocumentEdit) {

        var _defaultTheme = Themes.resolveTheme("playbook.documentedit");

        return function () {
            var self = SPA.CreateView(this),
                activateTheme = null,
                _blankDocument = {
                    header: "",
                    sections: [],
                    footer: ""
                };

            function renderOption(elements, option, isAvailable) {
                var a = TRC.filterFirst(elements, "A.trc-pbce");
                if (a && option) {
                        var item = option,
                            section = item.section,
                            from = isAvailable ? section.available : section.selected,
                            to = isAvailable ? section.selected : section.available;
                        TRC.addEventListener(a, "click", function () {
                            try {
                                if (item)
                                    item.checked(!item.checked());
                            }
                            catch (err) {
                                alert(TRC.getErrorMessage(err));
                            }
                        });
                        TRC.addEventListener(a, "dblclick", function () {
                            try {
                                if (item) {
                                    if (Array.indexOf(to(), item.id) == -1) {
                                        var index = from().indexOf(item.id);
                                        if (index != -1)
                                            from.splice(index, 1);
                                        to.push(item.id);
                                    }
                                    item.checked(false);
                                }
                            }
                            catch (err) {
                                alert(TRC.getErrorMessage(err));
                            }
                        });
                }
            }

            this.document = ko.observable(_blankDocument);
            this.theme = ko.observable();
            this.config = [];

            this.document.subscribe(function(doc) {
                self.theme(Themes.resolveTheme(activateTheme, Object.resolve(doc, "theme"), _defaultTheme));
                activateTheme = null;
            });

            this.activateView = function () {
                var parameters = self.getParameters(),
                    document = Object.resolve(parameters, "document");

                activateTheme = Object.resolve(parameters, "theme");

                if (!document && self.parent)
                    document = Object.resolve(Object.resolve(parameters, "content"), "body");

                this.document(document);
            };

            this.mapView = function (view) {
                self.base.mapView(view);
            };

            this.canCloseView = function () {
                return Function.invoke(self.document(), "syncState", [self]);
            };

            this.renderSection = function (elements, section) {
                try {
                    var div = TRC.filterFirst(elements, "div.trc-pbce.section");
                    if (div)
                        TRC.Style.renderView(div, 250);
                }
                catch (err) {
                    self.logErrorMethod("renderSection", err);
                }
            };

            this.resolveHtml = function (html) {
                return (self.parent && Object.isFunction(self.parent.resolveEmailHtml)) ? self.parent.resolveEmailHtml(self.email, html) : html;
            };

            this.renderSelected = function (elements, option) {
                renderOption(elements, option, false);
            };


            this.renderAvailable = function (elements, option) {
                renderOption(elements, option, true);
            };

            this.addItems = function (section, evt) {
                try {
                    var checked = [];
                    Array.foreach(section.resolve(section.available()), function (option) {
                        if (option && option.checked())
                            checked.push(option.id);
                    });
                    Array.foreach(checked, function (id) {
                        var temp = section.available();
                        section.available.splice(temp.indexOf(id), 1);
                        section.selected.push(id);
                        section.resolve([id])[0].checked(false);
                    });
                }
                catch (error) {
                    alert(TRC.getErrorMessage(error));
                }
            };

            this.removeItems = function (section, evt) {
                try {
                    var checked = [];
                    Array.foreach(section.resolve(section.selected()), function (option) {
                        if (option && option.checked())
                            checked.push(option.id);
                    });
                    Array.foreach(checked, function (id) {
                        var temp = section.selected();
                        section.selected.splice(temp.indexOf(id), 1);
                        section.available.push(id);
                        section.resolve([id])[0].checked(false);
                    });
                }
                catch (err) {
                    self.logMethodError("removeItem", err, true);
                }
            };

            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.document(), self.theme()], ["onButtonClick"], [self, button, evt || event],
                        function () {
                            self.close();
                        });
                }
                catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };
        };
});