define(["durandal/system"], function (System) {
    var DocumentBuilder = new function () {

        this.DocumentModel = function (url, groups, config) {
            this.url = url;
            this.groups = groups;

            Object.merge(this, config);
        }

        this.Selectable = function (id, correct, text, result) {
            this.id = id;                           // The ID of this Document Builder Selectable
            this.correct = correct;                 // True/False if this is a correct answer
            this.text = text;                       // The text of the selectable
            this.result = result;                   // The test results of the selectable
        }

        this.SelectableGroup = function (id, selectables, config) {
            var self = this;

            this.id = id;
            this.limit = 0;
            this.selectables = selectables;
            this.selected = [];

            this.getState = function () {
                return {
                    s: Array.append([], self.selected)
                };
            };

            this.setState = function (state) {
                if (state.hasOwnProperty("s"))
                    self.selected = Array.append([], state.s);
            };

            Object.merge(this, config);
        }

    }

    return DocumentBuilder;
});