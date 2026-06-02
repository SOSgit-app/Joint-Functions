define(["knockout", "trc/trc.spa", "playbook/models/themes"],
function (ko, SPA, Themes) {

    var _defaultTheme = Themes.resolveTheme("playbook.resources");

    return function () {
        var self = SPA.CreateView(this),
            _activateTheme = null;

        this.theme = ko.observable();
        this.content = ko.observable();
        this.visibleFolders = ko.observableArray([]);

        this.content.subscribe(function (val) {
            self.theme(Themes.resolveTheme(_activateTheme, Object.resolve(val, "theme"), _defaultTheme));
            var folders = [];
            if (val) {
                folders = Array.filter(val.folders, function (f) {
                    return (f && f.visible && _getVisibleLinks(f).length > 0) ? true : false;
                });
            }
            self.visibleFolders(folders);
        });

        function _getVisibleLinks(folder) {
            return folder ? Array.filter(folder.links, function (l) {
                return (l && l.visible);
            }) : [];
        }

        function _computeLinksPerColumn(folder) {
            return Themes.attr([folder, self.theme()], "linksPerColumn", 10);
        }

        this.getLeftLinks = function (folder) {
            var links = _getVisibleLinks(folder);
            var count = links.length;
            var perColumn = _computeLinksPerColumn(folder, self.theme());

            if (count <= perColumn)
                return links;

            if (count <= (perColumn * 2))
                return links.slice(0, perColumn);

            var left = Math.ceil(count / 2);
            return links.slice(0, left);
        };

        this.getRightLinks = function (folder) {
            var links = _getVisibleLinks(folder);
            var count = links.length;
            var perColumn = _computeLinksPerColumn(folder, self.theme());

            if (count <= perColumn)
                return [];

            if (count <= (perColumn * 2))
                return links.slice(perColumn, count);

            var left = Math.ceil(count / 2);
            return links.slice(left, links.length);
        };

        this.hasRightLinks = function (folder) {
            var perColumn = _computeLinksPerColumn(folder, self.theme());
            return (_getVisibleLinks(folder).length > perColumn);
        };

        this.activateView = function () {
            var parameters = self.getParameters(),
                content = Object.resolve(parameters, "content");

            _activateTheme = Object.resolve(parameters, "theme");
            self.content(content);
            _activateTheme = null;

            Themes.call(self.theme(), ["activateView"], [self, null, content]);
        };

        this.mapView = function (view) {
            var e = self.elements || {};
            e.dialog = TRC.selectFirst("div.trc-pbce.dialog", self.view);
            if (e.dialog) {
                e.html = TRC.selectFirst("div.trc-pbce.html", e.dialog);
                e.title = TRC.selectFirst("div.trc-pbce.title", e.dialog);
                e.scroller = TRC.selectFirst("div.trc-pbce.scroller", e.dialog);
            }
            self.elements = e;
        };

        this.bindView = function (view) {
            Object.resolve(self.theme(), "bindView", [self, view, self.content()]);
        };

        this.attachView = function (view) {
            Object.resolve(self.theme(), "attachView", [self, view, self.content()]);
        };

        this.completeView = function (view) {
            Object.resolve(self.theme(), "completeView", [self, view, self.content()]);
        };

        this.renderFolder = function (folder, elements) {
            try {
                if (folder && Object.isFunction(folder.afterRender)) {
                    folder.afterRender.call(folder, elements);
                }
            }
            catch (err) {
                self.logMethodError("renderFolder", err);
            }
        };

        this.onFolderClick = function (folder, evt) {
            try {
                evt = evt || event;
                var divFolder = TRC.selectParentNode(evt.srcElement, "div.trc-pbce.folder");
                if (divFolder) {
                    var links = TRC.selectFirst("div.trc-pbce.links", divFolder);
                    if (links) {
                        var slideDuration = Math.max(folder.links.length, 1) * 40;
                        if (folder.open) {
                            $(links).slideUp(slideDuration, function () {
                                TRC.Utils.removeClass(divFolder, ["open"]);
                                folder.open = false;
                            });
                        }
                        else {
                            $(links).slideDown(slideDuration, function () {
                                folder.open = true;
                                TRC.Utils.addClass(divFolder, ["open"]);
                            });
                        }
                    }
                }
            }
            catch (err) {
                self.logMethodError("onFolderClick", err, true);
            }
        };

        this.onLinkClick = function (link, evt) {
            try {
                evt = evt || event;
                if (link) {
                    switch (typeof (link.link)) {
                        case "string":
                            window.open(link.link, link.target, link.window);
                            break;

                        default:
                            if (Object.isFunction(link.link))
                                link.link.call(link);
                            break;
                    }
                }
            }
            catch (err) {
                self.logMethodError("onLinkClick", err, true);
            }
            finally {
                if (link)
                    link.clicked = true;
            }
        };

        this.onButtonClick = function (a, evt) {
            try {
                Themes.call([self.content(), self.theme()], ["onButtonClick"], [self, a, evt || event], function () {
                    self.close();
                });
            }
            catch (err) {
                self.logMethodError("onButtonClick", err, true);
            }
        };
    };
});