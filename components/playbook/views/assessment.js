define(["knockout", "trc/trc.spa", "playbook/models/themes"],
    function (ko, SPA, Themes) {

        var _defaultTheme = Themes.resolveTheme("playbook.assessment");

        var multiSelect = "multiselect";
        var singleSelect = "singleselect";

        return function () {
            var self = SPA.CreateView(this),
                activateTheme = null;

            this.Themes = Themes;
            this.theme = ko.observable({});

            this.name = "Assessment";
            this.app = window.application;

            this.view = null;
            this.dialog = null;
            this.assessment = ko.observable();
            this.question = null;
            this.currentQuestion = ko.observable();
            this.questionText = ko.observable();
            this.feedback = ko.observable();
            this.questionType = ko.observable();
            this.possibleAnswers = ko.observableArray();
            this.isAnswered = null;
            this.answerText = null;
            this.questionCount = 0;
            this.questionTotal = null;
            this.viewingFeedback = false;
            this.submitText = ko.observable("");
            this.nextText = ko.observable("");
            this.assessmentCompleteText = ko.observable("");

            //component life cycle

            this.assessment.subscribe(function (doc) {
                self.theme(Themes.resolveTheme(activateTheme, Object.resolve(doc, "theme"), _defaultTheme));
                activateTheme = null;
            });

            this.activateView = function () {
                var parameters = self.getParameters(),
                    assessment = Object.resolve(parameters, "assessment");

                activateTheme = Object.resolve(parameters, "theme");
                self.theme(Themes.resolveTheme(activateTheme, _defaultTheme));

                self.submitText(Object.resolve(self.theme(), "submit"));
                self.nextText(Object.resolve(self.theme(), "next"));
                self.assessmentCompleteText(Object.resolve(self.theme(), "assessmentCompleteText"));

                if (self.app) {
                    self.assessment(assessment);
                    if (self.assessment()) {
                        self.questionTotal = (self.assessment().questionsToAsk ? self.assessment().questionsToAsk : null);
                        self.randomizeQuestions();
                        self.resolveCurrentQuestion();
                    }
                }

                Themes.call(self.theme(), ["activateView"], [self]);
            }

            this.bindView = function (view) {
                Themes.call(self.theme(), ["bindView"], [self, view]);
            };

            this.attachView = function (view) {
                Themes.call(self.theme(), ["attachView"], [self, view]);
            };

            this.completeView = function (view) {
                Themes.call(self.theme(), ["completeView"], [self, view]);
            };

            this.bindingComplete = function () {
                if (self.currentQuestion) {
                    self.setQuestionType(self.questionType());
                }
                self.clearFeedback();
            }

            this.resolveCurrentQuestion = function () {

                self.currentQuestion = ko.observable();

                if (self.questions && self.questions.length > 0) {
                    Array.foreach(self.questions, function (question) {
                        if (!self.currentQuestion()) {
                            if (!question.isAnswered && self.questionCount < self.questionTotal) {
                                self.currentQuestion(question);
                                self.questionText(self.currentQuestion().questionText);
                                self.feedback(self.currentQuestion().feedback);
                                self.questionType(self.currentQuestion().questionType);
                                self.possibleAnswers(self.currentQuestion().possibleAnswers);
                            }
                        }
                    })
                }
                else {
                    // Do something here to try and remedy the situation or alert the user
                }

                if (!self.currentQuestion()) {
                    // if we've gotten to this point, all questions have been answered and the exam is complete
                    self.assessment().isComplete = true;
                    if (Object.isFunction(self.assessment().onComplete)) {
                        self.assessment().onComplete(self.questions);
                    }
                    $(".submit-button").hide();
                    self.possibleAnswers([]);
                    self.questionText(self.assessmentCompleteText());
                }
            };

            this.setQuestionType = function (questionType) {
                // In here we will want to show/hide panes (divs) based on the question type

                //$("#single-select").hide();
                //$("#multi-select").hide();

                $(".select").removeClass('single multi');

                switch (questionType) {
                    case singleSelect:
                        $(".select").addClass('single');
                        break;
                    case multiSelect:
                        $(".select").addClass('multi');
                        break;
                }
            };

            this.setFeedback = function (correct) {
                $('.correct').hide();
                $('.incorrect').hide();

                if (correct) {
                    // Set styles for positive feedback
                    $('.correct').show();
                }
                else {
                    // Set styles for negative feedback
                    $('.incorrect').show();
                }

                $('.question-feedback').show();

            };

            this.clearFeedback = function () {
                // Clear all feedback styles and content
                $('.correct').hide();
                $('.incorrect').hide();
                $('.question-feedback').hide();
            };

            this.onSubmitButtonClick = function () {
                try {
                    if (!self.viewingFeedback) {
                        var correct = true;
                        var answerSelected = false;

                        Array.foreach(self.currentQuestion().possibleAnswers, function (answer) {
                            if (answer.isSelected)
                                answerSelected = true;
                            if (answer.isSelected != answer.isCorrect)
                                correct = false;
                        });

                        if (!answerSelected) {
                            alert("Please select at least one answer before continuing.");
                            return;
                        }

                        var question = Array.lookupBy(self.assessment().questions, "id", self.currentQuestion().id);
                        if (question) {
                            question.isAnswered = true;
                            question.correct = correct;
                            self.questionCount++;
                        }
                        $('.submit-text').text(self.nextText());
                        self.setFeedback(correct);
                        self.viewingFeedback = true;
                    }
                    else {
                        // Get the next question or determine that the exam is complete
                        if (self.currentQuestion.isAnswered = true) {
                            $('.submit-text').text(self.submitText());
                            self.resolveCurrentQuestion();
                            self.setQuestionType(self.questionType());
                            self.clearFeedback();
                        }
                        self.viewingFeedback = false;
                    }
                }
                catch (error) {
                    self.logMethodError("onSubmitButtonClick", error, true);
                }
            };

            this.answerSelect = function (data, evt) {
                var id = parseInt(evt.currentTarget.id),
                    possibleAnswers = self.possibleAnswers();

                for (var i = 0; i < possibleAnswers.length; i++) {
                    if (self.questionType() === singleSelect) {
                        if (id !== possibleAnswers[i].id) {
                            possibleAnswers[i].isSelected = false;
                        }
                        else {
                            possibleAnswers[i].isSelected = true;
                        }
                    }
                    else {
                        if (id === possibleAnswers[i].id) {
                            if (!possibleAnswers[i].isSelected) {
                                possibleAnswers[i].isSelected = true;
                            }
                            else {
                                possibleAnswers[i].isSelected = false;
                            }
                        }
                    }
                    $("#" + possibleAnswers[i].id).removeClass("selected idle").addClass((possibleAnswers[i].isSelected) ? "selected" : "idle");
                }
            };

            this.randomizeQuestions = function () {
                try {
                    if (self.assessment()) {
                        if (Object.isFunction(self.assessment().randomizeQuestions)) {
                            self.questions = self.assessment().randomizeQuestions.call(this);
                        }
                        else {
                            if (self.questionTotal) {
                                self.questions = Array.shuffle(self.assessment().questions).slice(0, self.questionTotal);
                            }
                            else {
                                self.questions = Array.shuffle(self.assessment().questions);
                            }
                        }
                    }
                }
                catch (error) {
                    self.logMethodError("randomizeQuestions", error, true);
                }
            }

            //close button in modal view

            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.assessment(), self.theme()], ["onButtonClick"], [self, button, evt || event],
                        function () {
                            self.close();
                        });
                } catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };

        };
    });