define([],
function () {
    var DocumentAnalysis = new function () {

        this.Analysis = function (id, categories, documents, overrides) {
            var self = id;

            this.id = id;
            
            this.categories = Array.isArray(categories) ? categories : [];
            this.documents = Array.isArray(documents) ? documents : [];

            function _analysis() {
                return _self;
            }

            Array.foreach(this.documents, function(d) {
                d.agalysis = _analysis;
            });

            this.resolveCategory = function (cat) {
                return (typeof (cat) === "object") ? cat : Array.lookupBy(self.categories, "id", cat);
            }

            this.resolveDocument = function (doc) {
                return (typeof (doc) === "object") ? doc : Array.lookupBy(self.documents, "id", doc);
            }

            function _getState() {

            }
            function _setState(state) {

            }

            this.getState = _getState;
            this.setState = _setState;

            Object.merge(this, overrides);

            this.base = {
                getState: _getState,
                setState: _setState
            };
        };

        function _StatementClass(id, category, override) {
            var self = this;

            this.id = id;
            this.category = category || null;
            this.selected = [];

            Object.merge(this, override);           // This is for attaching additional options

            if (!Array.isArray(this.selected))
                this.selected = [];
        };

        this.Statement = _StatementClass;

        this.Document = function (id, title, text, overrides) {
            var self = this;

            this.id = id;                           // This is the ID of the document
            this.title = title || "";               // This is the title/name of the document
            this.description = null;                // This is a short descriptiom that appears below the title on Document List
            this.active = true;                     // This tells whether the document is active (listed) or not
            this.text = text || "";                   // The URL of the HTML file for the document contents

            function _document() {
                return self;
            }

            var _statements = [];
            function _getStatements() {
                return _statements;
            }

            var _isVisited = false;
            function _visited() {
                if (arguments.length > 0)
                    _isVisited = !(!arguments[0]);
                return _isVisited;
            }

            function _getState() {
                // If not a document then don't bother
                if (!self.isDocument)
                    return;

                var selState = null;
                for (var i = 0, len = self.selectables.length, sel; i < len; i++) {
                    sel = self.selectables[i];
                    if (sel && sel.selectedBucket) {
                        selState = selState || {};
                        selState[i] = sel.selectedBucket;
                    }
                }

                return { s: (selState ? selState : 0), v: (self.visited() ? 1 : 0) };
            };

            function _setState(state) {
                if (state) {
                    if (state.hasOwnProperty("s")) {
                        for (var s in state.s) {
                            var st = self.statements.find(s);
                            if (st)
                                st.catagory = state.s[s];
                        }
                    }
                    if (state.hasOwnProperty("v"))
                        self.visited(Boolean(state.v));
                }
            };

            var _root = null;
            if (this.text) {
                _root = document.createElement("DIV");
                TRC.Utils.setInnerHTML(_root, this.text);
                var ds = TRC.selectAll("[data-statement]", _root), st;
                Array.foreach(ds, function (s) {
                    if (s) {
                        ds = TRC.Utils.getAttr(s, "data-statement");
                        if (ds) {
                            ds = ds.split(/[\|,;]/gi);
                            if (ds[0]) {
                                st = new _StatementClass(ds[0], Array.pick(ds, 1, null), { document: _document });
                                _statements.push(st);
                            }
                        }
                    }
                });
            }

            var _nodes = null
            function _textNodes() {
                if (!_nodes && _root) {
                    _nodes = [];
                    var node = _root.firstChild;
                    while (node) {
                        _nodes.push(node);
                        node = node.nextSibling;
                    }
                }
                return _nodes;
            }

            this.statements = _getStatements;
            this.getState = _getState;
            this.setState = _setState;
            this.visited = _visited;
            this.textNodes = _textNodes;

            Object.merge(this, overrides);

            this.base = {
                statements: _getStatements,
                visited: _visited,
                getState: _getState,
                setState: _setState,
                textNodes: _textNodes
            };

        };

        this.Category = function (id, title, css, printCss) {
             this.id = id;                          // This is the ID of the bucket
             this.title = title;                    // This is the title/name of the bucket
             this.css = css;            // This is the color of the bucket, e.g. red
             this.printCss = printCss;              // This is for use with black/white color schemes such as printing
        };
    }
    return DocumentAnalysis;
});