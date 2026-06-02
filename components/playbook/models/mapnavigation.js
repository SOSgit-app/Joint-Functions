define([], function () {
    var MapNavigation = new function () {
        this.Map = function (id, name, image, size, nodes, config) {
            var self = this;

            this.id = id;                               // ID of this Map | String
            this.name = name;                           // Name of Map (displayed on map selection and viewing) | String
            this.image = image;                         // Name of image file for map graphic | String
            this.size = size;                           // An object with width and height properties defining the size of the map | Object
                                                        // e.g. { width: 2, height: 34 }
            this.nodes = nodes;                         // Array of Node objects used on this map | Array(Node)

            this.wrap = "none"                          // Sets the infinite scrolling for this map. Valid values are:
                                                        // "none" or null: Map does not wrap around at all
                                                        // "horizontal: Map scrolls horizontally infinitely
                                                        // "vertical": Map scrolls vertically infinitely
                                                        // "both": Map scrolls both horizontally and vertically, infinitely

            // Movement
            this.scrolling = "velocity";                // Set scrolling type: "velocity" or "dragging" | String
            this.velocity = {                           // Velocity object to control velocity scrolling
                maxVelocity: 50,                        // This is the maximum number of pixels that can be scrolled at any time | Number
                stepLength: 50,                         // This is how many pixels from the origin the user must move the move to increase the velocity by the next magnitude
                stepIncrease: 10                        // This is how many pixels to speed up the scrolling by at each velocity step
            };

            this.showCoordinates = false;               // Show (x, y) coordinates on the map?
            this.x = 0;                                 // Starting point on the map | Number
            this.y = 0;                                 // Starting point on the map | Number

            this.css = "";                              // Special CSS class to use for this map | String
            this.clicked = false;                      // Has this link been clicked from the Map Nav? | Boolean
            this.enabled = true;                       // Is this map enabled? | Boolean
            this.visible = true;                       // Is this map visible? | Boolean

            this.onClick = function (map) {
                return true;
            };

            this.findNode = function (nodeId) {
                var foundNode = null;
                Array.foreach(self.nodes, function (node, index) {
                    if (node.id == nodeId) {
                        foundNode = node;
                        index = -1;
                    }
                });
                return foundNode;
            }

            Array.foreach(this.nodes, function (node) {
                node.map = self;
            });

            Object.merge(this, config);
        };

        this.Node = function (id, name, position, items, config) {
            var self = this;
            this.id = id;                               // ID of this Node | String
            this.name = name;                           // Name of this node (to be displayed) | String
            this.x = position.x;                        // X, y coordinates of the node | Number
            this.y = position.y;                        // Coordinates are passed in as the position object. e.g. { x: 2, y: 34 }
            this.items = items;                         // Array of Nav objects used for navigation | Array(Nav)
            
            this.css = "";                              // CSS class to use for this Node | String
            this.clicked = false;                      // Has this link been clicked from the Map Nav? | Boolean
            this.enabled = true;                       // Is this node enabled? | Boolean
            this.visible = true;                       // Is this node visible? | Boolean
            this.map = null;                            // Links to the parent map. Filled in by the map | Object

            this.onClick = function (node) {
                return true;
            };

            this.findItem = function (itemId) {
                var foundItem = null;
                Array.foreach(self.items, function (item, index) {
                    if (item.id == itemId) {
                        foundItem = item;
                        index = -1;
                    }
                });
                return foundItem;
            }

            Array.foreach(this.items, function (item) {
                item.node = self;
            });

            Object.merge(this, config);
        };

        this.Item = function (id, name, component, parameters, config) {
            var self = this;
            this.id = id;                               // ID of this Nav | String
            this.name = name;                           // Name of this Nac (to be displayed) | String
            this.component = component;                 // Name of component to load from content/components.js | string
            this.parameters = parameters;               // Parameters to pass into component | Object
            

            this.css = "";                              // CSS class to use for this Nav | String
            this.clicked = false;                      // Has this link been clicked from the Map Nav? | Boolean
            this.enabled = true;                       // Is this nav item enabled? | Boolean
            this.visible = true;                       // Is this nav item visible? | Boolean
            this.node = null;                           // Links to the parent Node. Filled in by the node | Object

            this.onClick = function (item, node) {
                return true;
            };
            
            Object.merge(this, config);
        }
    }
    return MapNavigation;
});