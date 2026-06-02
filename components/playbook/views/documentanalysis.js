define(["knockout", "trc/trc.spa", "playbook/models/themes"],
function (ko, SPA, Themes) {

    var _defaultTheme = Themes.resolveTheme("playbook.documentanalysis");

    return function () {
        var self = SPA.CreateView(this),
            _activateTheme = null,
            _document = null,
            _panel = null, //"list";
            _category = null;

        this.model = ko.observable();
        this.theme = ko.observable();
        this.categories = ko.observableArray();
        this.documents = ko.observableArray();
        this.currentDocument = ko.observable();
        this.currentPanel = ko.observable();
        this.currentCategory = ko.observable();

        this.model.subscribe(function (val) {
            self.theme(Themes.resolveTheme(_activateTheme, Object.resolve(val, "theme"), _defaultTheme));
            self.currentPanel("list");
            self.currentCategory(null);
            self.categories(Object.resolve(val, "categories"));
            self.documents(Object.resolve(val, "documents"));
        });

        this.currentDocument.subscribe(function (val) {
            if (_document != val) {
                _document = val;
                if (_document) {
                    Object.resolve(_document, "visited", [true]);
                    _updateText();
                }
            }
        });

        this.currentPanel.subscribe(function (val) {
            if (_panel != val) {
                _panel = val;
                if (self.view) {
                    if (val == "list") {
                        if (self.elements.documentList)
                            TRC.Style.renderView(self.elements.documentList, 50);
                    }
                    else if (val == "doc") {
                        if (self.elements.categories)
                            TRC.Style.renderView(self.elements.categories, 50);
                        if (self.elements.documentView)
                            TRC.Style.renderView(self.elements.documentView, 50);
                    }
                }
            }
        });
               
        this.currentCategory.subscribe(function (val) {
            if (_category != val) {
                _category = val;
                _setCategory(self.elements.documentView, val);
            }
        });

        function _setCategory(element, cat, toggle) {
            Array.foreach(self.categories(), function (c) {
                if (c == cat && (!toggle || !TRC.Utils.hasClass(element, c.css))) {
                    TRC.Utils.addClass(element, c.css);
                    return;
                }
                TRC.Utils.removeClass(element, c.css);
            });
        }

        function _updateText() {
            try {
                var docText = self.elements.documentText;
                if (docText) {
                    while (docText.lastChild) {
                        docText.removeChild(docText.lastChild);
                    }
                    Array.foreach(Object.resolve(_document, 'textNodes'), function (tn) {
                        docText.appendChild(tn);
                    });
                }
            }
            catch (error) {
                self.logMethodError("_updateText", error);
            }
        }

        function _mapView(view) {
            if (arguments.length > 0)
                self.view = view;
            var e = {};
            if (self.view) {
                e.html = TRC.selectFirst("div.trc-pbce.html", self.view);
                e.menu = TRC.selectFirst("div.trc-pbce.menu", self.view);
                e.dialog = TRC.selectFirst("div.trc-pbce.dialog", self.view);
                if (e.dialog) {
                    e.documentList = TRC.selectFirst("div.trc-pbce.document-list", e.dialog);
                    e.documentView = TRC.selectFirst("div.trc-pbce.document-view", e.dialog);
                    if (e.documentView)
                        e.documentText = TRC.selectFirst("div.trc-pbce.text", e.documentView);
                    e.categories = TRC.selectFirst("div.trc-pbce.categories", e.dialog);
                    if (e.categories)
                        e.categoryLinks = TRC.selectAll("a.trc-pbce.category", e.categories);
                }
                e.button = TRC.selectFirst("div.trc-pbce.button", self.view);
            }
            self.elements = e;
        }

        //#region View Library events
        this.activateView = function () {
            var parameters = self.getParameters(),
                model = Object.resolve(parameters, "content");

            _activateTheme = Object.resolve(parameters, "theme");
            self.model(model);
            _activateTheme = null;

            Themes.call(self.theme(), ["activateView"], [self, null, model]);
        };

        this.bindView = function (view) {
            _mapView(view);
            Themes.call(self.theme(), ["bindView"], [self, view, self.model()]);
        };

        this.attachView = function (view) {
            Themes.call(self.theme(), ["attachView"], [self, view, self.model()]);
        };

        this.completeView = function (view) {
            Themes.call(self.theme(), ["completeView"], [self, view, self.model()]);
        };

        this.canCloseView = function () {
            Themes.call(self.theme(), ["canCloseView"], [self, self.view, self.model()]);
        };
        //#endregion

        this.onDocItemAdded = function (elements, data) {
            Array.foreach(elements, function (e) {
                if (TRC.Utils.hasClass(e, "trc-pbce") && TRC.Utils.hasClass(e, "document")) {
                    TRC.Style.renderView(e);
                    return -1;
                }
            });
        };

        this.selectDocument = function (doc, index) {
            try {
                if (doc && _document != doc)
                    self.currentDocument(doc);
                self.currentPanel("doc");
            }
            catch (error) {
                self.logMethodError("selectDocument", error);
            }
        };

        this.selectCategory = function (category, a) {
            try {
                if (_category != category && TRC.Utils.hasClass(a, "category")) {
                    Array.foreach(self.elements.categoryLinks, function (link) {
                        if (link && link != a)
                            TRC.Utils.removeClass(link, "selected");
                    });
                    TRC.Utils.addClass(a, "selected");
                    self.currentCategory(category);
                }
            }
            catch (error) {
                self.logMethodError("selectCategory", error);
            }
        };

        this.onDocumentTextClick = function (evt) {
            try {
                if (evt && _category) {
                    var ds = TRC.Utils.getAttr(evt.srcElement, "data-statement");
                    if (ds) {
                        var st = Array.lookupBy(Object.resolve(_document, 'statements'), "id", ds[0]);
                        if (st) {
                            st.category = _category.id;
                            _setCategory(evt.srcElement, _category, true);
                        }
                    }
                }
            }
            catch (error) {
                self.logMethodError("onDocTextClick", error);
            }
        };
    };
});