define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/conversationlib"],
function (ko, SPA, Themes, CL) {

    var _defaultTheme = Themes.resolveTheme("playbook.conversation");

    function _isVisited(o) {
        return (o && Boolean.eval(o.visited, o)) ? true : false;
    }

    function _isEnabled(o) {
        return (o && !Boolean.eval(o.disabled, o)) ? true : false;
    }

    return function () {
        var self = SPA.CreateView(this),
            _activateTheme = null,
            _transcriptTimer = 0;

        this.conversation = ko.observable({});
        this.contact = ko.observable({});
        this.contactPhoto = ko.observable("");
        this.theme = ko.observable();
        this.skin = ko.observable();
        this.transcript = ko.observableArray([]);
        this.questions = ko.observableArray([]);
            
        //#region private members
        this.conversation.subscribe(function (val) {
            var conversation = val,
                theme = Themes.resolveTheme(_activateTheme, Object.resolve(val, "theme"), _defaultTheme),
                skin = String.ifEmpty(self.resolve([conversation, theme], "skin"), "") + (Object.resolve(conversation, "completed") ? " completed" : ""),
                contact = null,
                questions = [],
                log = [];

            self.theme(theme);
            self.skin(skin);

            if (val) {
                contact = Object.resolve(val, "contact");
                if ((!contact || typeof (contact) != "object") && Function.isFunction(val.resolveContact))
                    contact = val.resolveContact.call(val, contact);
            }
            self.contact(contact || {});
            _setContactStatus.call(self, "init");

            if (conversation) {
                if (conversation.transcript.length < 1 && CL.isStatement(conversation.openingStatement))
                    conversation.addToTranscript(conversation.openingStatement);

                log = conversation.resolveTranscript();

                questions = Array.filter(conversation.messages, function (q) {
                    return _isEnabled(q);
                });

                var keepOrder = [], si;
                Array.foreach(questions, function (q) {
                    if (q && q.keepOrder) {
                        keepOrder.push(q);
                    }
                });

                Array.shuffle(questions);

                Array.foreach(keepOrder, function (q, index) {
                    si = questions.indexOf(q);
                    if (si != -1) {
                        questions.splice(si, 1);
                        questions.splice(index, 0, q);
                    }
                });
            }

            self.transcript(log);
            self.questions(questions);
        });

        function _setContactStatus(status) {
            var conversation = self.conversation();
            status = conversation ? ((status && Object.hasProperty(conversation.contactStatus, status)) ? conversation.contactStatus[status] : Object.resolve(self.contact(), "id", "")) : "";
            self.contactPhoto(status);
        };

        function _cancelScroll() {
            clearInterval(_transcriptTimer);
            _transcriptTimer = 0;
        }

        function _scrollTranscript(cb) {
            var e = self.elements;
            if (e.transcript) {
                if (_transcriptTimer)
                    _cancelScroll();
                if (e.transcript.offsetHeight < e.transcript.scrollHeight && e.transcript.scrollTop < e.transcript.scrollHeight) {
                    _transcriptTimer = setInterval(function () {
                        var vscroll = e.transcript.scrollHeight - (e.transcript.offsetHeight + e.transcript.scrollTop);
                        if (vscroll > 4) {
                            e.transcript.scrollTop += 4;
                        }
                        else {
                            _cancelScroll();
                            e.transcript.scrollTop = e.transcript.scrollHeight;
                            if (Object.isFunction(cb))
                                cb.call(self);
                        }
                    }, 20);
                }
                else {
                    if (Object.isFunction(cb))
                        cb.call(self);
                }
            }
        };

        function _isQuestion(statement) {
            return (statement instanceof CL.QuestionModel);
        };

        function _forQuestions(func) {
            if (self.elements.questions)
                Array.foreach(TRC.selectAll(".trc-pbce.question", self.elements.questions), func);
        };
        //#endregion

        //#region view engine pipeline
        this.activateView = function () {
            var parameters = self.getParameters(),
                conversation = Object.resolve(parameters, "content");

            _activateTheme = Themes.resolve(parameters, "theme");

            if (!CL.isConversation(conversation))
                conversation = null;
            self.conversation(conversation);

            _activateTheme = null;

            Themes.call(self.theme(), ["activateView"], [self, null, self.conversation(), self.contact()]);
        };

        this.mapView = function (view) {
            self.base.mapView(view);
            var e = self.elements || {};
            if (self.view) {
                e.dialog = TRC.selectAll("div.trc-pbce.dialog", self.view)[0];
                if (e.dialog) {
                    e.contactGroup = TRC.selectAll("div.trc-pbce.contact-group", e.dialog)[0];

                    e.transcriptGroup = TRC.selectAll("div.trc-pbce.transcript-group", e.dialog)[0];
                    e.transcript = TRC.selectAll("div.trc-pbce.transcript", e.transcriptGroup)[0];

                    e.questionGroup = TRC.selectAll("div.trc-pbce.questions-group", e.dialog)[0];
                    e.questions = TRC.selectAll("div.trc-pbce.questions", e.questionGroup)[0];
                }
            }
            self.elements = e;
        }

        this.bindView = function (view) {
            Themes.call(self.theme(), ["bindView"], [self, view, self.conversation(), self.contact()]);
        };

        this.attachView = function (view) {
            if (self.view != view)
                self.view = view;

            Themes.call(self.theme(), ["attachView"], [self, view, self.conversation(), self.contact()]);

            var conversation = self.conversation();
            if (CL.isConversation(conversation) && !Array.isNullOrEmpty(conversation.transcript) && self.elements.transcript)
                self.elements.transcript.scrollTop = self.elements.transcript.scrollHeight;
        };

        this.completeView = function (view) {
            Themes.call(self.theme(), ["completeView"], [self, view, self.conversation(), self.contact()]);
        };
        //#endregion

        //#region conversation code
        this.getTranscriptCSS = function (statement) {
            return CL.isQuestion(statement) ? "you" : "contact";
        };

        this.getTranscriptText = function (statement) {
            if (!statement)
                return "";
            var from = "";
            if (CL.isQuestion(statement)) {
                from = String.ifEmpty(Object.resolve(self.theme(), "transcriptYou"), "You:");
            }
            else {
                from = Object.resolve(self.theme(), "transcriptContact")
                if (String.isEmpty(from))
                    from = "Interlocutor:";
                else
                    from = from.replace(/\{0\}/gi, Object.resolve(self.contact(), "name"));
            }
            return "<span class='trc-pbce from'>" + from + "</span> " + statement.text;
        };

        this.appendToTranscript = function (statement, cb) {
            if (statement) {
                if (statement.status)
                    _setContactStatus.call(self, statement.status);
                self.transcript.push(statement);
                _scrollTranscript(cb);
            }
        };

        this.onTranscriptMouseDown = function (evt) {
            _cancelScroll();
        };

        this.getQuestionCSS = function (q) {
            return q ? (String.ifEmpty(Object.resolve(q,"css"), "") + (_isVisited(q) ? " visited" : "")) : "";
        };

        this.formatQuestionText = function (q) {
            var t = self.theme();
            return Function.isFunction(t, "formatQuestionText") ? t.formatQuestionText.call(t, q) : Object.resolve(q, "text");
        };

        this.onQuestionClick = function (statement, evt) {
            try {
                var conversation = self.conversation();
                if (!conversation)
                    throw new Error("Invalid conversation instance");

                if (!conversation.completed && statement && _isEnabled(statement) && !_isVisited(statement)) {
                    var result = true, updateAll = false;
                    if (Function.isFunction(statement, "onVisit")) {
                        result = Function.invoke(statement, "onVisit");
                        updateAll = true; // since onVisit could change status on any statement
                    }

                    if (result != false) {
                        statement.visited = true;

                        function _onStatement(s) {
                            var retVal = Function.invoke(conversation, "onStatement", [self, s]);
                            if (retVal == false)
                                return false;
                            updateAll = true; // onStatement handler could change status on any statement
                            return true;
                        }

                        function _onComplete(s) {
                            var retValue = Function.invoke(conversation, "onComplete", [self, s]);
                            if (retValue != false) {
                                updateAll = true; // onComplete handler could change status on any statement
                                TRC.Utils.addClass(self.view, "completed");
                                _forQuestions(function (node) {
                                    TRC.Utils.enable(node, false);
                                });
                            }
                            return retValue;
                        }

                        function _complete(s) {
                            var cs = conversation.closingStatement;
                            if (cs && _isEnabled(cs) && !_isVisited(cs)) {
                                cs.visited = true;
                                conversation.addToTranscript(cs);
                                _onStatement(cs);
                                self.appendToTranscript(cs, function () {
                                    _onComplete(cs);
                                    TRC.Utils.enable(self.elements.questions, true);
                                });
                                return false;
                            }
                            _onComplete(s);
                            return true;
                        }

                        result = _onStatement(statement);
                        if (result != false) {

                            TRC.Utils.enable(self.elements.questions, false);

                            conversation.addToTranscript(statement);

                            if (updateAll) {
                                _forQuestions(function (node) {
                                    var stmt = conversation.find(node.getAttribute("statementId"));
                                    if (CL.isStatement(stmt)) {
                                        node.className = "trc-pbce question " + self.getQuestionCSS(stmt);
                                        TRC.Utils.enable(node, _isEnabled(stmt));
                                    }
                                });
                            }
                            else {
                                evt = evt || event;
                                if (evt && evt.target)
                                    evt.target.className = "trc-pbce question " + self.getQuestionCSS(statement);
                            }

                            self.appendToTranscript(statement, function () {
                                var next = Array.pick(statement.messages, 0, null);
                                if (next && CL.isResponse(next) && _isEnabled(next) && !_isVisited(next)) {
                                    function addResponse() {
                                        next.visited = true;
                                        conversation.addToTranscript(next);
                                        _setContactStatus.call(self, next.status);
                                        _onStatement(next);
                                        self.appendToTranscript(next,
                                            function () {
                                                if (conversation.completed) {
                                                    if (!_complete(next))
                                                        return;
                                                }
                                                TRC.Utils.enable(self.elements.questions, true);
                                            });
                                    }
                                    delay = (Object.hasProperty(next, "delay") ? Number.parse(next.delay, 0) : (Object.hasProperty(self.conversation(), "delay") ? Number.parse(self.conversation().delay) : 0));
                                    if (delay)
                                        setTimeout(addResponse, delay * 1000);
                                    else
                                        addResponse();
                                }
                                else {
                                    if (conversation.completed)
                                        _complete(statement);
                                }
                            });
                        }
                    }
                }
            }
            catch (err) {
                self.logMethodError("onQuestionClick", err, true);
            }
        };

        this.onButtonClick = function (a, evt) {
            try {
                Themes.call([self.conversation(), self.theme()], ["onButtonClick"], [self, a, evt || event],
                    function () {
                        self.close();
                    });
            }
            catch (err) {
                self.logMethodError("onButtonClick", err, true);
            }
        };
        //#endregion
    };
});