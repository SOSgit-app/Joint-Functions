define([],
function () {

    return new function () {

        function _Catalog(name, config, folders) {

            Object.merge(config, { name: name, key: "id" });
            var self = new TRC.List(config, []);
            self.folders = self.items;

            Array.foreach(folders, function (folder) {
                if (folder) {
                    folder.catalog = self;
                    self.folders.push(folder);
                }
            });

            self.showLink = function (links, visible) {
                try {
                    if (!Array.isArray(links)) {
                        links = [links];
                    }
                    if (links.length < 1 || self.folders.length < 1)
                        return;

                    visible = Object.ifNull(visible, true);

                    Array.foreach(self.folders, function (folder) {
                        if (folder) {
                            Array.foreach(folder.links, function (link) {
                                if (link) {
                                    var index = links.indexOf(link.id);
                                    if (index != -1) {
                                        links.splice(index, 1);
                                        if (link.visible != visible)
                                            link.visible = visible;
                                    }
                                }
                                if (links.length < 1)
                                    return -1;
                            });
                            if (links.length < 1)
                                return -1;
                        }
                    });
                }
                catch (error) {
                    alert("resources.js - showFile: " + TRC.getErrorMessage(error));
                    throw error;
                }
            };
            
            return self;
        };

        this.Catalog = _Catalog;

        this.Folder = function (id, name, links, overrides) {
            var self = this;
            this.id = id;
            this.name = name;
            this.links = [];

            Array.foreach(links, function (link) {
                if (link) {
                    link.folder = self;
                    self.links.push(link);
                }
            });

            this.visible = true;
            this.open = false;

            function _getState() {
                var flags = "", links = null;
                if (self.visible)
                    flags += "v";
                if (self.open)
                    flags += "o";

                var links = {}, ls;
                Array.foreach(self.links, function (link) {
                    if (link && Function.isFunction(link.getState)) {
                        ls = link.getState.call(link);
                        if (ls)
                            links[link.id] = ls;
                    }
                });

                return {
                    fs: flags,
                    ls: links
                };
            }

            function _setState(state) {
                if (state) {
                    if (state.fs) {
                        self.visible = state.fs.indexOf('v') == -1 ? false : true;
                        self.open = state.fs.indexOf('o') == -1 ? false : true;
                    }
                    if (state.ls) {
                        Array.foreach(self.links, function (link) {
                            if (link && Function.isFunction(link.setState)) {
                                link.setState.call(link, state.ls[link.id]);
                            }
                        });
                    }
                }
            }

            this.getState = _getState;
            this.setState = _setState;

            Object.merge(this, overrides);

            this.base = {
                getState: _getState,
                setState: _setState
            }
        };

        this.Link = function (id, name, link, overrides) {
            var self = this;
            this.id = id;
            this.name = name;
            this.link = link;
            this.target = "_blank";
            this.css = null;
            this.visible = true;
            this.disabled = false;
            this.clicked = false;

            function _getState() {
                var state = "";
                if (self.visible)
                    state += "v";
                if (self.disabled)
                    state += "d";
                if (self.clicked)
                    state += "c";
                return state ? state : null;
            };

            function _setState(state) {
                if (state) {
                    self.visible = (state.indexOf("v") == -1) ? false : true;
                    self.disabled = (state.indexOf("d") == -1) ? false : true;
                    self.clicked = (state.indexOf("c") == -1) ? false : true;
                }
            }

            this.getState = _getState;
            this.setState = _setState;

            this.linkType = function () {
                if (self.link) {
                    switch(typeof (self.link))
                    {
                        case "string":
                            var url = TRC.parseUrl(this.link);
                            if (url.pathname) {
                                var pos = url.pathname.lastIndexOf('.');
                                if (pos != -1)
                                    return url.pathname.substring(pos + 1).toLowerCase();
                            }
                            return url.protocol ? url.protocol.substring(0, url.protocol.length - 1).toLowerCase() : null;

                        case "object":
                            if (!Function.isFunction(self.link))
                                break;

                        case "function":
                            return "click";
                    }
                }
                return null;
            };

            Object.merge(this, overrides);

            this.base = {
                getState: _getState,
                setState: _setState
            }
        };

        this.ClientFile = function(name, title, folders) {
            var self = new _Catalog(name,
                {
                    title: title,

                    setCurrentRound: function (round) {
                        try {
                            if (self.app) {
                                round = Object.resolve(self.app.resolveRound(round), 'name');
                                if (round) {
                                    round = String.prototype.toLowerCase.call(round);
                                    Array.foreach(self.folders, function (folder) {
                                        Array.foreach(folder.links, function (link) {
                                            if (link && !link.visible && Array.indexOf(link.rounds, round) != -1) {
                                                link.visible = true;
                                                if (link.folder)
                                                    link.folder.visible = true;
                                            }
                                        });
                                    });
                                }
                            }
                        }
                        catch (error) {
                            alert("resourcelib.js - setCurrentRound: " + TRC.getErrorMessage(error));
                            throw error;
                        }
                    },

                    startup: function (app) {
                        this.app = app;
                        if (app) {
                            app.cfSetCurrentRound = this.setCurrentRound;
                            app.cfShowFile = this.showLink;
                        }
                        Array.foreach(this.folders, function (folder) {
                            if (folder) {
                                Array.foreach(folder.links, function (link) {
                                    if (link) {
                                        link.rounds = link.rounds || [];
                                        var rounds = Object.resolve(link, 'round');
                                        if (rounds) {
                                            if (typeof (rounds) == "string")
                                                link.rounds = link.round.split(",");
                                            else if (Array.isArray(rounds)) {
                                                link.rounds = rounds;
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                },
                folders
            );
            return self;
        };
    }
});
