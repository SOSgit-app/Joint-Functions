define([], function () {

    var TutorialLib = new function () {

        this.TutorialModel = function (
            id,
            scenes,
            config) {

            var self = this;
            this.id = id;
            this.scenes = scenes;
            this.completed = false;

            function _getState() {
                return {
                    done: self.completed ? 1 : 0
                };
            };

            function _setState(state) {
                if (state) 
                    self.completed = Boolean.parseBoolean(state.done, false);
            };

            var base = {
                getState: _getState,
                setState: _setState
            };

            Object.merge(this, base);
            Object.merge(this, config);
        };

        this.Scene = function (
            id,
            bubbles,
            config) {

            var self = this;
            this.id = id;
            this.bubbles = bubbles;
            this.visited = false;

            Object.merge(this, config);
        };

        this.Bubble = function (
            id,
            title,
            text,
            config) {

            var self = this;
            this.id = id;
            this.title = title;
            this.text = text;
            this.visited = false;
            
            Object.merge(this, config);
        };

    };

    return TutorialLib;
});