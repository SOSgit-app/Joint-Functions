define([], function () {

    var MeetingLib = new function () {

        this.MeetingModel = function (
            id,
            speaker,
            conversations,
            config) {

            var self = this;
            this.id = id;
            this.speaker = speaker;
            this.conversations = conversations;
            this.activeConversation = null;
            this.completed = false;

            function _getState() {
                return {
                    done: self.completed ? 1 : 0,
                    aC: this.activeConversation
                };
            };

            function _setState(state) {
                if (state) {
                    self.completed = Boolean.parseBoolean(state.done, false);
                    if (state.hasOwnProperty("aC"))
                        this.activeConversation = state.aC;
                }
            };

            var base = {
                getState: _getState,
                setState: _setState
            };

            Object.merge(this, base);
            Object.merge(this, config);
        };

        this.SpeakerModel = function (
            id,
            gender,
            config) {

            var self = this;
            this.id = id;
            this.gender = gender;

            Object.merge(this, config);
        };

        this.ConversationModel = function (
            id,
            questions,
            config
            ) {

            var self = this;

            this.id = id;
            this.questions = questions;
            this.visited = false;

            function _getState() {
                return {
                    done: self.visited ? 1 : 0
                };
            };

            function _setState(state) {
                if (state)
                    self.visited = Boolean.parseBoolean(state.done, false);
            };

            var base = {
                getState: _getState,
                setState: _setState
            };

            Object.merge(this, base);
            Object.merge(this, config);
        };


        this.QuestionModel = function (
            id,
            text,
            answers,
            config) {

            var self = this;

            this.id = id;
            this.text = text;
            this.answers = answers
            this.completed = false;
            this.attempts = 0;

            Object.merge(this, config);
        };

        this.AnswerModel = function (
            id,
            text,
            feedback,
            config) {

            var self = this;

            this.id = id;
            this.text = text;
            this.feedback = feedback;
            this.enable = true;
            this.correct = false;

            Object.merge(this, config);
        };
    }

    return MeetingLib;

});