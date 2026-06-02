define(["knockout"],
function (ko) {

    function DocumentModel(
        id,             // unique document id
        header,         // optional static heading text | text /html string
        sections,       // a collectin of DocumentEdit.SectionModel (see below) objects | an array
        footer,         // optional static footer text | text /html string
        overrides       // optional overrides
    ) {
        if (String.isEmpty(id))
            throw new Error("Invalid DocumentEdit.Document Id");

        var self = this;

        this.id = id;
        this.completed = false;
        this.header = header;
        this.sections = sections || [];
        this.footer = footer;

        function _getState() {
            var state = null, ss;
            Array.foreach(self.sections, function (s) {
                if ((s instanceof SectionModel) && Function.isFunction(s, "getState")) {
                    ss = s.getState.call(s);
                    if (!Object.isNull(ss)) {
                        state = state || {};
                        state[s.id] = ss;
                    }
                }
            });
            return state;
        }

        function _setState(state) {
            Array.foreach(self.sections, function(s) {
                if ((s instanceof SectionModel) && Function.isFunction(s, "setState")) {
                    s.setState(((state && state.hasOwnProperty(s.id)) ? state[s.id] : null));
                }
            });
        }

        var base = {
            getState: _getState,
            setState: _setState
        };

        Object.merge(this, base);
        Object.merge(this, overrides);

        Array.foreach(this.sections, function (s) {
            if (s)
                s.document = self;
        });

        this.base = function () {
            return base;
        };

        this.toHtml = function (view) {
            var html = "<div class='trc-pbc doc-edit' style='overflow:visible;'>";
            try {
                if (self.header)
                    html += "<div class='trc-pbce header'>" + self.header + "</div>";

                Array.foreach(self.sections, function (section) {
                    html += "<div class='trc-pbce section'>";
                    if (section.title)
                        html += "<span class='trc-pbce title'>" + section.title + "</span>";
                    html += "<ul class='trc-pbce options'>";
                    try {
                        if (Function.isFunction(section, "selected")) {
                            var selected = section.resolve(section.selected());
                            Array.foreach(selected, function (option) {
                                if (option)
                                    html += "<li>" + option.label + "</li>";
                            });
                        }
                    }
                    finally {
                        html += "</ul></div>\r\n";
                    }
                });

                if (self.footer)
                    html += "<div class='trc-pbce footer'>" + self.footer + "</div>";
            }
            catch (err) {
            }
            finally {
                html += "</div>";
            }
            return html;
        };
    }

    function SectionModel(
        id,             // unique section id within the document
        header,         // header of the section | html/html string
        options,        // a list of all availabe options, an array of DocumentEdit.ItemModel 
        selected,       // a collection of (see below) objects by default listed on the left 'INCLUDED' side
        available,      // a collection of DocumentEdit.ItemModel objects by default listed on the right 'AVAILABLE' side
        overrides       // optional overrides, can be used to customize 'footer', 'selectedTitle' and/or 'availableTitle'
    ) {
        if (String.isEmpty(id))
            throw new Error("Invalid DocumentEdit.Section Id");
        var self = this;
        this.id = id;
        this.header = header;
        this.options = [];
        this.selected = ko.observableArray(selected || []);
        this.available = ko.observableArray(available || []);

        function _resolve(items) {
            var options = [];
            if (Array.isArray(self.options) && Array.isArray(items)) {
                for (var i = 0, option; i < items.length; i++) {
                    option = Array.lookupBy(self.options, "id", items[i]);
                    if (option)
                        options.push(option);
                }
            }
            return options;
        }

        function _reset() {
            self.selected.splice(0, self.selected().length);
            var all = [];
            Array.foreach(self.options, function (o) {
                if (o)
                    all.push(o.id);
            });
            self.available(all);
        }

        function _getState() {
            state = Array.prototype.concat.call([], self.selected());
            return state.length > 0 ? state : null;
        }

        function _setState(state) {
            _reset();
            var i;
            Array.foreach(state, function (s) {
                i = self.available().indexOf(s);
                if (i != -1)
                    self.available.splice(i, 1);
                if (self.selected().indexOf(s) == -1)
                    self.selected.push(s);
            });
        }

        var base = {
            resolve: _resolve,
            reset: _reset,
            getState: _getState,
            setState: _setState
        };

        Object.merge(this, base);
        Object.merge(this, overrides);

        this.base = function () {
            return base;
        };

        Array.foreach(options, function (o) {
            if (o) {
                if (Array.isArray(o) && o.length > 1)
                    o = new OptionModel(o[0], o[1], (o.length > 3 ? arguments[2] : null));
                if (o instanceof OptionModel) {
                    self.options.push(o);
                    o.section = self;
                }
            }
        });
    }

    function OptionModel(
        id,             // unique id within the document section
        text            // text shown on the screen | text/html string
    ) {
        if (String.isEmpty(id))
            throw new Error("Invalid DocumentEdit.Option Id");
        var self = this;
        this.id = id;
        this.label = text || this.id;

        var checked = false;
        if (arguments.length > 2) {
            switch (typeof (arguments[2])) {
                case "boolean":
                    checked = arguments[2];
                    break;
                case "object":
                    if (arguments[2])
                        Object.merge(this, arguments[2]);
                    break;
            }
        }
        this.checked = ko.observable(checked);
    }

    return {
        Document: DocumentModel,
        Section: SectionModel,
        Option: OptionModel
    };
});