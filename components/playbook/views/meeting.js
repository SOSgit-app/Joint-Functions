define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/meetinglib"],
function (ko, SPA, Themes, ML) {

    var _defaultTheme = Themes.resolveTheme("playbook.meeting");

    return function () {
        var self = SPA.CreateView(this),
            activateTheme = null;

        this.meeting = ko.observable({});
        this.theme = ko.observable();
        this.skin = ko.observable();
        this.conversations = ko.observableArray([]);
        this.activeConversation = ko.observable({});
        this.contact = ko.observable({});
        this.contactPhoto = ko.observable();
        this.questions = ko.observableArray([]);
        this.currentQuestion = ko.observable({});
        this.answers = ko.observableArray([]);
        this.currentAnswer = ko.observable({});
        this.responseText = ko.observable();
        this.responseState = ko.observable(false);
        this.speaker = ko.observable({});
        this.attempts = ko.observable(0);


        this.meeting.subscribe(function (val) {
            var meeting = val,
                theme = Themes.resolveTheme(activateTheme, Object.resolve(val, "theme"), _defaultTheme),
                skin = String.ifEmpty(self.resolve([meeting, theme], "skin"), "") + (Object.resolve(meeting, "completed") ? " completed" : ""),
                contact = null;

            self.theme(theme);
            self.skin(skin);

            if (val) {
                contact = Object.resolve(val, "contact");
                if ((!contact || typeof (contact) != "object") && Function.isFunction(val.resolveContact))
                    contact = val.resolveContact.call(val, contact);
            }

            self.contact(contact || {});
            self.activeConversation(null);
        });

        this.activateView = function () {
            var parameters = self.getParameters(),
                meeting = Object.resolve(parameters, "content"),
                activateTheme = Object.resolve(parameters, "theme");

            self.meeting(meeting);
            if (!meeting.completed) {
                Array.foreach(meeting.conversations, function (conversation) {
                    self.conversations.push(conversation);
                });
            }

            Themes.call(self.theme(), ["activateView"], [self, null, self.meeting()]);
        };

        this.mapView = function (view) {
            self.base.mapView(view);
            var e = self.elements || {};
            if (self.view) {
                e.dialog = TRC.selectAll("div.trc-pbce.dialog", self.view)[0];
                if (e.dialog) {
                    e.responseContent = TRC.selectAll("div.trc-pbce.response-content", e.dialog)[0];
                    e.responseContact = TRC.selectAll("div.trc-pbce.response-contact", e.responseContent)[0];
                    e.response = TRC.selectAll("div.trc-pbce.response", e.responseContent)[0];
                    e.responseAnswer = TRC.selectAll("div.trc-pbce.response-answer", e.responseContent)[0];
                    e.conversationList = TRC.selectAll("div.trc-pbce.conversation-list", e.dialog)[0];
                    e.answerContent = TRC.selectAll("div.trc-pbce.answer-content", e.dialog)[0];
                    e.answerListTitle = TRC.selectAll("div.trc-pbce.answers-title", e.answerContent)[0];
                    e.answerList = TRC.selectAll("div.trc-pbce.answer-list", e.answerContent)[0];
                }
            }
            self.elements = e;
        };

        this.bindView = function (view) {
            Themes.call(self.theme(), ["bindView"], [self, view, self.meeting()]);
        };

        this.attachView = function (view) {
            Themes.call(self.theme(), ["attachView"], [self, view, self.meeting()]);
        };

        this.completeView = function (view) {
            Themes.call(self.theme(), ["completeView"], [self, view, self.meeting()]);
        };

        this.renderConversation = function (elements, conversation) {
            var container = Array.pick(Array.filter(elements, function (e) {
                return TRC.Utils.hasClass(e, "conversation");
            }), 0, null);

            if (container && conversation) {
                var parts = TRC.$$("div", container),
                    icon = TRC.filterFirst(parts, "div.conversation-icon"),
                    card = TRC.filterFirst(parts, "div.contact-card");

                var position = "";
                if (parts && icon && card) {

                    if (conversation.hasOwnProperty("left")) {
                        container.style.left = conversation.left;
                        position = "left";
                    }

                    else if (conversation.hasOwnProperty("right")) {
                        container.style.right = conversation.right;
                        position = "right";
                    }

                    if (conversation.hasOwnProperty("top"))
                        container.style.top = conversation.top;

                    else if (conversation.hasOwnProperty("bottom"))
                        container.style.bottom = conversation.bottom;

                    TRC.Utils.addClass(icon, position);
                    TRC.Utils.addClass(card, position);

                    setTimeout(function () {
                        TRC.Style.render(container);
                    }, 250);
                }
            }
        };

        this.getContact = function (contact) {
            var meeting = self.meeting();
            if ((!contact || typeof (contact) != "object") && Function.isFunction(meeting.resolveContact))
                contact = meeting.resolveContact.call(meeting, contact);
            return contact;
        }

        this.getContactPhoto = function (contact) {
            var meeting = self.meeting();
            if ((!contact || typeof (contact) != "object") && Function.isFunction(meeting.resolveContact))
                contact = meeting.resolveContact.call(meeting, contact);
            return contact.photo;
        }

        this.showCard = function (conversation, event) {
            var conversationIcon = event.target;
            var conversationDiv = conversationIcon.parentElement;
            if (conversationIcon && conversationDiv) {
                TRC.Utils.addClass(conversationIcon, "hover");
                var currentContact = Object.resolve(conversation, "currentContact");
                if (currentContact) {
                    var parts = TRC.$$("div", conversationDiv),
                        card = TRC.filterFirst(parts, "div.contact-card");
                    var position = "";
                    if (card) {
                        if (conversation.hasOwnProperty("right"))
                            position = "rightShow";
                        else if (conversation.hasOwnProperty("left")) {
                            position = "leftShow";
                        }
                        TRC.Utils.addClass(card, position);
                    }
                }
            }
        };

        this.hideCard = function () {
            var list = TRC.$$("div", self.elements.conversationList);
            Array.foreach(list, function (item) {
                var conversationDiv = TRC.$$("div", item),
                    icon = TRC.filterFirst(conversationDiv, "div.hover");
                card = TRC.filterFirst(conversationDiv, "div.contact-card");
                
                    if (icon)
                        TRC.Utils.removeClass(icon, "hover");
                   
                var position = "";
                if (TRC.Utils.hasClass(card, "rightShow"))
                    position = "rightShow";
                else if (TRC.Utils.hasClass(card, "leftShow"))
                    position = "leftShow";

                TRC.Utils.removeClass(card, position);
            });
        };

        this.onConversationClick = function (conversation, evt) {
            var element = evt.target;
            var parent = element.parentElement;
            if (conversation) {
                conversation.visited = true;
                TRC.Utils.addClass(element, "visited");

                var conversationDiv = TRC.$$("div", parent),
                    contactdiv = TRC.filterFirst(conversationDiv, "div.contact-card");

                contactdiv.style.display = "none";

                self.activeConversation(conversation);
                self.responseState(true);
                var contact = self.getContact(conversation.currentContact);
                if (contact) {
                    self.contact(contact);
                    self.contactPhoto(contact.photo);
                }
                self.questions(conversation.questions);
                var currentQuestion = Array.pick(conversation.questions, 0);
                self.currentQuestion(currentQuestion);
                self.answers(currentQuestion.answers);
            }
        };

        this.onAnswerClick = function (answer, evt) {
            self.responseState(false);
            var element = evt.target;
            if (answer) {
                var answerCount = self.currentQuestion().answers.length;
                answer.enable = false;
                self.responseText(answer.feedback);
                TRC.Utils.addClass(element, "disabled");
                element.disabled = true;
                TRC.Utils.addClass(self.elements.responseAnswer, "show");
                TRC.Utils.addClass(self.elements.response, "hide");
                TRC.Utils.addClass(self.elements.answerContent, "hide");
                TRC.Utils.addClass(self.elements.responseContent, "attract");
                self.currentAnswer(answer);
            }
        };

        this.onResponseClick = function () {
            self.responseState(true);
            var answer = self.currentAnswer();
            if (answer.correct) {
                var questions = self.questions();
                var currentQuestion = self.currentQuestion();
                var currentIndex = Array.indexBy(questions, "id", currentQuestion.id);
                var nextQuestion = Array.pick(questions, currentIndex + 1, null);
                if (nextQuestion) {
                    self.currentQuestion(nextQuestion);
                    self.answers(nextQuestion.answers);
                }
                else {
                    self.responseState(false);
                    var activeConversation = self.activeConversation();
                    if (activeConversation) {
                        var conversations = self.conversations();
                        var value = true;
                        Array.foreach(conversations, function (con) {
                            if (!con.visited)
                                value = false;
                        });

                        if (!value)
                            self.conversations(conversations);
                        else
                            self.meeting().completed = true;

                        self.activeConversation(null);
                    }
                }
            }

            TRC.Utils.removeClass(self.elements.responseAnswer, "show");
            TRC.Utils.removeClass(self.elements.responseContent, "attract");
            TRC.Utils.removeClass(self.elements.response, "hide");
            TRC.Utils.removeClass(self.elements.answerContent, "hide");
        };
    };
});