define([], function () {
    var ItemsAndDecisions = new function () {
        this.Decision = function (id, text, config) {
            var self = this;

            this.id = id;
            this.text = text;

            this.getCSS = function (selected) {
                return (selected == self.id ? "selected" : "");
            }

            Object.merge(this, config);
        };

        this.Item = function (id, text, answers, config) {
            var self = this;
            this.id = id;                               // ID of this Item
            this.text = text;                           // Text of the item
            this.Identified = answers.identified;       // Stores whether item should be identified
            this.Decision = answers.decision || [];     // Stores array of Decision ID's, if any
            this.Include = answers.include || false;    // Stores true/false of include, if any


            this.userIdentified = false;
            this.userDecision = -1;
            this.userIncluded = false;

            Object.merge(this, config);
        };

        this.Module = function (id, items, decisions, config) {
            var self = this;
            this.id = id;                               // ID of this Item
            this.items = items || [];                   // Items associated with this module
            this.decisions = decisions || [];           // Decisions associated with this module

            // string object for localization
            this.strings = {};

            // Header text
            this.strings.identified = "Identified";
            this.strings.item = "Item";
            this.strings.decision = "Decision";
            this.strings.include = "Include with Document";

            // Dropdown text
            this.strings.selectOne = "Select One";
            this.strings.selectToEdit = "Select to Edit";

            function _getState() {
                var itemSelections = []
                Array.foreach(items, function (item) {
                    itemSelections.push({
                        id: item.id,
                        ie: item.userIdentified ? 1 : 0,
                        de: item.userDecision,
                        ic: item.userIncluded ? 1 : 0
                    });
                });
                return itemSelections;
            }

            function _setState(state) {
                if (isArray(state)) {
                    var itemSelections = [];
                    Array.foreach(state, function (stateItem) {
                        Array.foreach(items, function (item, itemIndex) {
                            if (item.id == stateItem.id) {
                                item.userIdentified = Boolean.parse(stateItem.ie);
                                item.userDecision = stateItem.de;
                                item.userIncluded = Boolean.parse(stateItem.ic);
                                itemIndex = -1;
                            }
                        });
                    });
                }
            }

            var base = {
                getState: _getState,
                setState: _setState
            };

            Object.merge(this, base);
            Object.merge(this, config);
        };
    }
    return ItemsAndDecisions;
});