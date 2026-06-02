define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/conversationlib"],
function (ko, SPA, Themes, CL) {

    var _defaultTheme = Themes.resolveTheme("playbook.instantmessager");

    function Chat(view, conversation, contact) {
        if (arguments.length < 3)
            contact = Function.invoke(conversation, "resolveContact", Object.resolve(conversation, "contact"));
        if (!contact)
            return null;

        var self = this,
            cid = Object.resolve(contact, "id"),
            activity = view,
            timer = 0,
            time0 = 0;

        this.contact = contact;
        this.listPhoto = cid + " " + String.ifEmpty(Object.resolve(contact, "imListPhoto"), "small-photo");
        this.chatPhoto = cid + " " + String.ifEmpty(Object.resolve(contact, "imChatPhoto"), "");
        this.conversation = conversation;

        if (!Function.isFunction(conversation, "status"))
            conversation.status = ko.observable(conversation.status);
        this.status = conversation.status;

        function resetTime() {
            time0 = (new Date()).getTime();
        }

        function resume() {
            if (!timer)
                timer = setTimeout(worker, 1000);
        }

        function timeLeft(delay) {
            return delay ? (time0 + (delay * 1000) - (new Date()).getTime()) : 0;
        }

        function canPost(m) {
            return (m && !Object.resolve(m, "disabled") && !Object.resolve(m, "visited"));
        }

        function worker() {
            self.stop();
            var c = self.conversation;
            if (c && !c.completed && String.toLowerCase(self.status()) === "online") {
                var last = c.getLast(),
                    lastIncoming = CL.isIncoming(last);
                if (!lastIncoming || (lastIncoming && last.messages.length < 1)) {
                    var messages = c.getCurrentMessages(), delay, outgoing = [];
                    if (messages.length < 1 && c.current) {
                        if (Object.resolve(c.current, "disabled"))
                            c.current = null;
                        else {
                            last = c.next();
                            if (last) {
                                addMessage(last, resume);
                                return;
                            }
                        }
                    }
                    else {
                        for (var i = 0, len = messages.length, m; i < len; i++) {
                            m = messages[i];
                            if (CL.isIncoming(m)) {
                                addMessage(m, resume);
                                return;
                            }
                            if (canPost(m))
                                outgoing.push(m);
                        }
                        if (!c.current && outgoing.length > 0 && self.isCurrent()) {
                            activity.responses(outgoing);
                        }
                    }
                }
            }
            resume();
        }

        function postMessage(msg, cb) {
            var c = self.conversation;
            result = c.base.addToTranscript(msg, activity);
            if (result !== false) {
                if (self.isCurrent()) {
                    activity.transcript.push(msg);
                    if (typeof (cb) != "function")
                        cb = null;
                    activity.scrollTranscript(function () {
                        resetTime();
                        if (cb)
                            cb.call(this, msg, c);
                    });
                }
                else
                    resetTime();
            }
        }

        function addMessage(msg, cb) {
            var result = false;
            if (canPost(msg)) {
                var delay = parseFloat(msg.resolve("delay")),
                    tl = timeLeft(delay);
                if (!delay || tl < 1) // <= 0 to be exact
                    return postMessage(msg, cb);

                setTimeout(function () {
                    if (canPost(msg))
                        postMessage(msg, cb);
                }, tl);
                result = true;
            }
            return result;
        }

        if (this.conversation)
            this.conversation.addToTranscript = addMessage;

        this.start = function () {
            resetTime();
            if (!timer)
                resume();
        }

        this.stop = function () {
            if (timer) {
                clearTimeout(timer);
                timer = 0;
            }
        }

        this.isCurrent = function () {
            return (self == activity.chat());
        }

        this.postMessage = postMessage;

        this.next = function() {
            var c = self.conversation;
            if (c) {
                c.next();
                if (c.current && !Object.resolve(c.current, "visited"))
                    addMessage(c.current, self.start);
                else
                    self.start();
            }
        };

        this.completed = function() {
            var r;
            if (arguments.length < 1) {
                r = Object.resolve(self.conversation, "completed");
            }
            else {
                r = !!arguments[0];
                if (self.conversation.completed != r) {
                    self.conversation.completed = r;
                    if (r)
                        Function.invoke(self.conversation, "onComplete", [activity]);
                }                
            }
            return r;
        };

        this.dispose = function () {
            self.stop();
            if (self.conversation)
                self.conversation.addToTranscript = self.conversation.base.addToTranscript;
        }

    }

    return function () {
        var self = SPA.CreateView(this),
            _content = null,
            _chat = null,
            _contact = null,
            _chatPhotoCSS = null,
            _scrollTimer = 0;

        this.content = ko.observable();
        this.theme = ko.observable();
        this.contactList = ko.observableArray();
        this.chat = ko.observable();
        this.transcript = ko.observableArray([]);
        this.responses = ko.observableArray([]);

        this.content.subscribe(function (val) {
            if (_content != val) {
                _content = val;
                var cl = [], chat;
                if (_content instanceof TRC.List) {                    
                    Array.foreach(_content.items, function (conv) {
                        if (CL.isConversation(conv)) {
                            chat = new Chat(self, conv);
                            if (chat)
                                cl.push(chat);
                        }
                    });
                }
                self.contactList(cl);
            }
        });

        this.chat.subscribe(function (val) {
            if (_chat != val) {
                _chat = val;
                _contact = _chat.contact;
                try {
                    self.updateContact();
                    
                    var len = self.responses().length,
                        conv = _chat.conversation;

                    if (len > 0)
                        self.responses.splice(0, len);
                    
                    self.transcript(conv.resolveTranscript());
                }
                finally {

                }
            }
        });

        this.transcript.subscribe(function (val) {
            var conv = Object.resolve(_chat, "conversation"),
                responses = [];
            if (conv) {
                responses = Array.filter(conv.getCurrentMessages(false), function (s) {
                    return CL.isOutgoing(s);
                });
            }
            self.responses(responses);
        });

        function _cancelScroll() {
            if (_scrollTimer) {
                clearInterval(_scrollTimer);
                _scrollTimer = 0;
            }
        }

        this.scrollTranscript = function (cb) {
            try {
                var transcript = self.elements.transcript;
                if (transcript) {
                    _cancelScroll();

                    TRC.Utils.enable(self.elements.responseList, false);

                    if (transcript.offsetHeight < transcript.scrollHeight && transcript.scrollTop < transcript.scrollHeight) {
                        _scrollTimer = setInterval(function () {
                            var vscroll = transcript.scrollHeight - (transcript.offsetHeight + transcript.scrollTop);
                            if (vscroll > 4) {
                                transcript.scrollTop += 4;
                            }
                            else {
                                _cancelScroll();
                                transcript.scrollTop = transcript.scrollHeight;
                                TRC.Utils.enable(self.elements.responseList);
                                if (Function.isFunction(cb))
                                    cb.call(self);
                            }
                        }, 20);
                    }
                    else {
                        if (Function.isFunction(cb))
                            cb.call(self);
                    }
                }
            }
            catch (error) {
                _cancelScroll();
                TRC.Utils.enable(self.elements.responseList);
            }
        };

        this.updateContact = function(contact) {
            if (arguments.length < 1)
                contact = _contact;
            var t = self.theme();
            if (Function.isFunction(t, "updateContact"))
                t.updateContact.call(t, self, contact);
            else {
                var u = TRC.Utils, e = self.elements;
                if (e.contactPhoto)
                    e.contactPhoto.className = _chatPhotoCSS + " " + Object.resolve(_chat, "chatPhoto");
                u.setInnerHTML(e.contactName, Object.resolve(contact, "name"));
                u.setInnerHTML(e.contactTitle, Object.resolve(contact, "title"));
                u.setInnerHTML(e.contactCompany, Object.resolve(contact, "company"));
            }
        };

        this.$formatStatusText = function (status) {
            var t = self.theme();
            return Function.isFunction(t, "formatStatusText") ? t.formatStatusText.call(t, self, status) : String.capitalize(String.ifEmpty(status, 'offline'));
        };

        this.activateView = function () {
            var params = self.getParameters(),
                content = Object.resolve(params, "content"),
                theme = Object.resolve(params, "theme");
            
            if (content instanceof TRC.List) {
                self.content(content);
            }
            self.theme(Themes.resolveTheme(theme, _defaultTheme));
        };

        this.mapView = function (view) {
            if (self.elements.content) {

                self.elements.contactList = TRC.selectFirst("div.trc-pbce.contacts > div.trc-pbce.list", self.elements.content);
                self.elements.chat = TRC.selectFirst("div.trc-pbce.chat", self.elements.content);
                if (self.elements.chat) {
                    self.elements.currentContact = TRC.selectFirst("div.trc-pbce.chat > div.trc-pbce.contact", self.elements.chat);
                    if (self.elements.currentContact) {
                        self.elements.contactPhoto = TRC.selectFirst("div.trc-pbce.photo", self.elements.currentContact);
                        _chatPhotoCSS = self.elements.contactPhoto ? self.elements.contactPhoto.className : "";
                        self.elements.contactName = TRC.selectFirst("div.trc-pbce.name", self.elements.currentContact);
                        self.elements.contactTitle = TRC.selectFirst("div.trc-pbce.title", self.elements.currentContact);
                        self.elements.contactCompany = TRC.selectFirst("div.trc-pbce.company", self.elements.currentContact);
                        self.elements.contactStatus = TRC.selectFirst("div.trc-pbce.status", self.elements.currentContact);
                    }
                    self.elements.transcript = TRC.selectFirst("div.trc-pbce.transcript", self.elements.chat);
                }
                self.elements.responseList = TRC.selectFirst("div.trc-pbce.responses > div.trc-pbce.list", self.elements.content);
            }
        };

        this.renderContactList = function (nodes, data) {
            try {
                var div = TRC.filterFirst(nodes, "div.trc-pbce.contact");
                if (div) {
                    var conversation = data;
                    TRC.addEventListener(div, "click", function (evt) {
                        self.chat(conversation);
                    });
                }
            }
            finally {

            }
        };

        this.attachView = function (view) {
            Array.foreach(self.contactList(), function (chat) {
                chat.start();
            });

            if (self.elements.transcript) {
                setTimeout(function () {
                    if (self.transcript().length > 0)
                        self.elements.transcript.scrollTop = self.elements.transcript.scrollHeight;
                }, 400);
            }
        };

        this.canCloseView = function () {
            try {
                Array.foreach(self.contactList(), function (chat) {
                    chat.dispose();
                });
            }
            finally {

            }
        };

        this.renderTranscript = function (nodes, message) {
            try {
                var elem = TRC.filterFirst(nodes, "div.trc-pbce.message"),
                    t = self.theme(),
                    html = null, format = null;

                if (CL.isIncoming(message))
                    format = "formatIncoming";
                else
                    if (CL.isOutgoing(message))
                        format = "formatOutgoing";
                if (format && Function.isFunction(t, format)) {
                    html = t[format].call(t, message, self.chat(), self);
                }
                else {                    
                    html = Object.resolve(message, "text");
                    t = message.resolve("date");
                    if (t)
                        html = t + "<br/>" + html;
                }

                TRC.Utils.setInnerHTML(elem, html);
            }
            finally {

            }
        };

        this.renderResponse = function (nodes, data) {
            try {
                var elem = TRC.filterFirst(nodes, "a.trc-pbce.response"),
                    t = self.theme(),
                    formatter = Function.find(["formatResponse"], t),
                    response = data,
                    html = formatter ? formatter.call(t, response, Object.resolve(self.chat(), "contact"), self) : Object.resolve(response, "text");
                TRC.Utils.setInnerHTML(elem, html);
                TRC.addEventListener(elem, "click", function () {
                    if (_chat && _chat.conversation) {
                        _chat.stop();
                        self.responses.splice(0, self.responses().length);
                        setTimeout(function () {
                            _chat.postMessage(response, function () {
                                if (_chat.completed())
                                    Function.invoke(_chat.conversation, "onComplete", [self]);
                                else
                                    _chat.next();
                            });
                        }, 350); // to let ko clear the response area first
                    }
                });
            }
            catch (err) {
                TRC.Utils.enable(self.elements.responseList);
            }
            finally {
            }
        };

        this.onReplyClick = function (oReply, evt) {
            try {
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
        };

        this.onButtonClick = function (button, evt) {
            try {
                Themes.call([self.content(), self.theme()], ["onButtonClick"], [self, button, evt || event],
                    function () {
                        self.close();
                    });
            }
            catch (err) {
                self.logMethodError("onButtonClick", err, true);
            }
        };
    };
});