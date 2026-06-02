define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/mapnavigation", "jqueryui"],
    function (ko, SPA, Themes, MapNavigation) {

        var _defaultTheme = Themes.resolveTheme("playbook.mapnavigation");
        var scrolling = {
            Full: 0,
            XOnly: 1,
            YOnly: 2,
            None: 3
        };
        var timer = null;

        return function () {
            var self = SPA.CreateView(this), activateTheme = null;

            this.maps = ko.observable(null);
            this.currentMap = ko.observable();
            this.currentNode = ko.observable();
            this.theme = ko.observable();
            this.showMapSelection = ko.observable(false);
            this.allowMapSelection = ko.observable(false);
            this.mouseDown = { x: 0, y: 0 };
            this.currentPosition = { x: 0, y: 0 };
            this.containerElement = {
                size: {
                    width: 0,
                    height: 0
                }
            };

            this.maps.subscribe(function (doc) {
                self.theme(Themes.resolveTheme(activateTheme, Object.resolve(doc, "theme"), _defaultTheme));
                activateTheme = null;
            });

            this.currentMap.subscribe(function (doc) {
            });

            this.activateView = function () {
                var parameters = self.getParameters(),
                    maps = Object.resolve(parameters, "maps");

                activateTheme = Object.resolve(parameters, "theme");
                self.maps(maps);
            };

            this.bindingComplete = function (view) {
                var containerElement = $("div.trc-pbce.container");

                self.containerElement.size.width = containerElement.width();
                self.containerElement.size.height = containerElement.height();

                if (!Array.isArray(self.maps())) {
                    self.onMapSelect(self.maps());
                }
                else {
                    self.showMapSelection(true);
                }
            };

            // Position nodes
            this.onNodeRender = function (element, data) {
                var node = $(element);
                node.css({ left: data.x, top: data.y })
                if (self.currentMap()) {
                    self.updateMap(self.currentMap(), $("div.trc-pbce.map"));
                }
            };

            // Text display for coordinates
            this.setCoordinateText = function (map, event) {
                $("div.coordinates").text("X: " + map.x + ", Y: " + map.y +
                                    ", MouseX: " + self.currentPosition.x + ", MouseY: " + self.currentPosition.y);
            };

            // Controls velocity movement
            this.setVelocityPosition = function (map, mapElement) {
                var distance = {
                    x: self.currentPosition.x - self.mouseDown.x,
                    y: self.currentPosition.y - self.mouseDown.y
                };
                var stepLengthX = (map.velocity.x ? map.velocity.x.stepLength : map.velocity.stepLength);
                var stepIncreaseX = (map.velocity.x ? map.velocity.x.stepIncrease : map.velocity.stepIncrease);
                var maxVelocityX = (map.velocity.x ? map.velocity.x.maxVelocity : map.velocity.maxVelocity);

                var stepLengthY = (map.velocity.y ? map.velocity.y.stepLength : map.velocity.stepLength);
                var stepIncreaseY = (map.velocity.y ? map.velocity.y.stepIncrease : map.velocity.stepIncrease);
                var maxVelocityY = (map.velocity.y ? map.velocity.y.maxVelocity : map.velocity.maxVelocity);

                // Get the speed and ensure it is less than the maxVelocity, whether positive or negative directional movement
                var speed = {
                    x: Math.max(Math.min((Math.round((distance.x / stepLengthX)) * stepIncreaseX), maxVelocityX), (maxVelocityX * -1)),
                    y: Math.max(Math.min((Math.round((distance.y / stepLengthY)) * stepIncreaseY), maxVelocityY), (maxVelocityY * -1))
                };

                // Adjust the distance
                map.x += speed.x;
                map.y += speed.y;

                if (map.wrap == null || map.wrap == "both" || map.wrap == "vertical") {
                    map.x = Math.min(Math.max(map.x, 0), (map.size.width - self.containerElement.size.width));
                }
                if (map.wrap == null || map.wrap == "both" || map.wrap == "horizontal") {
                    map.y = Math.min(Math.max(map.y, 0), (map.size.height - self.containerElement.size.height));
                }

                self.updateMap(map, mapElement);
            };

            // Controls dragging movement
            this.setDraggingPosition = function (map, mapElement, event) {

                map.x += self.mouseDown.x - self.currentPosition.x;
                map.y += self.mouseDown.y - self.currentPosition.y;
                self.setMouseDown(event);

                if (map.wrap == null || map.wrap == "both" || map.wrap == "vertical") {
                    map.x = Math.min(Math.max(map.x, 0), (map.size.width - self.containerElement.size.width));
                }
                if (map.wrap == null || map.wrap == "both" || map.wrap == "horizontal") {
                    map.y = Math.min(Math.max(map.y, 0), (map.size.height - self.containerElement.size.height));
                }

                self.updateMap(map, mapElement);
            };

            // Saves mousedown coordinates
            this.setMouseDown = function (event) {
                self.mouseDown.x = (event.offsetX).toFixed(0);
                self.mouseDown.y = (event.offsetY).toFixed(0);
            };

            // Updates the map on the screen
            this.updateMap = function (map, mapElement) {
                position = (map.x * -1) + "px -" + map.y + "px";
                if (position) {
                    mapElement.css({ 'background-position': position });
                    Array.foreach(map.nodes, function (node) {
                        var left = node.x - map.x;
                        var top = node.y - map.y;
                        $("div.node[nodeID='" + node.id + "']")
                            .css({ 'left': (left > 1 ? left + 'px' : left + ((map.x / map.size.width).toFixed(0) * map.size.width)) })
                            .css({ 'top': (top > 1 ? top + 'px' : top + ((map.y / map.size.height).toFixed(0) * map.size.height)) });
                    });
                }
            };

            // Displays the image on the map
            this.showMap = function (map) {
                var mapElement = $("div.trc-pbce.map");
                if (map) {
                    var repeat = "no-repeat";

                    repeat = (map.wrap == "both" ? "repeat" :
                            (map.wrap == "vertical" ? "repeat-y" :
                            (map.wrap == "horizontal" ? "repeat-x" : "no-repeat")));
                    var position = null;

                    // Set as current map
                    self.currentMap(map);

                    // Set the map image
                    mapElement.css({
                        'background-repeat': repeat,
                        width: map.size.width,
                        height: map.size.height
                    });

                    position = (map.x * -1) + "px -" + map.y + "px";

                    if (position) {
                        mapElement.css({ 'background-position': position });
                    }
                }
                else {
                    if (self.currentMap() == null) {
                        mapElement.css({
                            'background-image': 'none'
                        });
                    }
                }
            };

            // Select map
            this.onMapSelect = function (map) {
                // Set map's clicked to true
                map.clicked = true;

                // Check for onClick event and as long as it returns true (or rather, not null),
                // assume the user can select the map
                if (Object.isFunction(map.onClick)) {
                    if (map.onClick(map)) {

                        // Get map's element
                        var mapElement = $("div.trc-pbce.map");
                        var containerElement = $("div.trc-pbce.container");

                        self.showMap(map);

                        if (map.showCoordinates) {
                            mapElement.on("mousemove", function (event) {
                                self.setCoordinateText(map, event);
                                self.currentPosition.x = event.offsetX.toFixed(0);
                                self.currentPosition.y = event.offsetY.toFixed(0);
                            });
                        }

                        mapElement.on("mousedown", function (event) {
                            $('div.trc-pbce.map div.node-details').hide();

                            self.setMouseDown(event);
                            self.currentPosition.x = self.mouseDown.x;
                            self.currentPosition.y = self.mouseDown.y;

                            // Set up scrolling
                            if (map.scrolling == "velocity") {
                                // Set up check for mousedown
                                timer = setInterval(function () {
                                    self.setVelocityPosition(map, mapElement, event);
                                }, 100);
                            }
                            else if (map.scrolling == "dragging") {
                                mapElement.on("mousemove", function (event) {
                                    self.setCoordinateText(map, event);
                                    self.setDraggingPosition(map, mapElement, event);
                                });
                            }

                            // Restore mousemove on mouseup
                            $(document).bind("mouseup", function () {
                                mapElement.off("mousemove");

                                if (timer) {
                                    clearInterval(timer);
                                }

                                mapElement.on("mousemove", function (event) {
                                    self.setCoordinateText(map, event);
                                    self.currentPosition.x = event.offsetX.toFixed(0);
                                    self.currentPosition.y = event.offsetY.toFixed(0);
                                });
                            });
                        });

                        if (self.showMapSelection()) {
                            self.showMapSelection(false);
                        }

                        if (self.maps().allowMapSelection || self.currentMap().allowMapSelection) {
                            self.allowMapSelection(true);
                        }
                    }
                }
            };

            this.onNodeClick = function (node) {
                // Set node and having been clicked.
                // Do it here so onClick can override if present
                node.clicked = true;

                // Check for onClick event and as long as it returns true (or rather, not null),
                // assume the user can select the node
                if (Object.isFunction(node.onClick)) {
                    if (node.onClick(node)) {
                        var details = $('div.trc-pbce.map div.node-details');
                        var map = self.currentMap();
                        var left = node.x - map.x + 20;
                        var top = node.y - map.y + 20;

                        self.currentNode(node);

                        if (left > (self.containerElement.size.width - details.width())) {
                            left -= (details.width() + 40);
                        }
                        if (top > (self.containerElement.size.height - details.height())) {
                            top -= (details.height() + 10);
                        }

                        details.on("mousedown", function (event) {
                            event.stopPropagation();
                        });
                        details.css({ 'left': left, 'top': top });
                        details.show();
                    }
                }

            };

            this.onNodeItemClick = function (item, node) {
                var paremeters = {};

                // Set item and having been clicked.
                // Do it here so onClick can override if present
                item.clicked = true;

                if (Themes.resolve([self.maps(), self.theme()], 'button')) {
                    self.onButtonClick(document.getElementsByClassName("a.trc-pbce.button"), null);
                }
                // Call parameters if it is a function
                if (Object.isFunction(item.parameters)) {
                    parameters = item.parameters(item);
                }
                else {
                    parameters = item.parameters;
                }
                // Check for onClick event and, (if it exists) as long as it returns true
                // (or rather, not null), open the activity associated with this node
                if (Object.isFunction(item.onClick)) {
                    if (item.onClick(item)) {
                        window.closeActivity();
                        window.openActivity(item.component, parameters);
                    }
                }
                else {
                    window.closeActivity();
                    window.openActivity(item.component, item.parameters);
                }
            };

            //close button in modal view

            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.maps(), self.theme()], ["onButtonClick"], [self, button, evt || event], function () { self.close(); });
                } catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };
        };
    });
