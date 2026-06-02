define([], function () {
    return new function () {
        this.Assessment = function (
            id,
            questions,
            config
            ) {
            var self = this;
            self.id = id;
            self.questions = questions || [];

            self.isComplete = false;

            function _getState() {
                var questions = [];
                Array.foreach(questions, function (question) {
                    var answers = [];
                    Array.foreach(question.possibleAnswers, function (answer) {
                        answers.push({
                            id: answer.id,
                            s: (answer.isSelected ? 1 : 0)
                        });
                    });
                    questions.push({
                        id: question.id,
                        a: answers
                    });
                });
                return {
                    iC: (self.isComplete ? 1 : 0),
                    q: questions
                };
            }

            function _setState(state) {
                if (state.hasOwnProperty('ic')) {
                    self.isComplete = Boolean.parse(state.ic);
                }
                if (state.hasOwnProperty('q') && isArray(state.q)) {
                    var questions = [];
                    Array.foreach(state, function (stateItem) {
                        Array.foreach(questions, function (question, itemIndex) {
                            if (question.id == stateItem.id) {
                                Array.foreach(stateItem.a, function (answer) {
                                    Array.foreach(question.possibleAnswers, function (possibleAnswer, answerIndex) {
                                        if (answer.id == possibleAnswer.id) {
                                            possibleAnswer.isSelected = oolean.parse(answer.s);
                                            answerIndex = -1;
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            }

            var base = {
                getState: _getState,
                setState: _setState
            };

            if (config)
                Object.merge(this, config);
        }

        this.Question = function (
            id,
            questionType,
            title,
            questionText,
            feedback,
            possibleAnswers,
            config
            ) {
            var self = this;
            self.id = id;
            self.questionType = questionType;
            self.title = title;
            self.questionText = questionText;
            self.feedback = feedback;
            self.possibleAnswers = Array.shuffle(possibleAnswers) || [];

            self.isAnswered = false;
            self.correct = false;

            if (config)
                Object.merge(this, config);
        };

        this.PossibleAnswer = function (
            id,
            answerText,
            isCorrect,
            config
            ) {
            var self = this;
            self.id = id;
            self.answerText = answerText;
            self.isCorrect = isCorrect;

            self.isSelected = false;

            if (config)
                Object.merge(this, config);
        };
    };
});