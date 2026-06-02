define([], function () {

    var ConversationLib = new function () {

        // internal methods
        function _addMsgs(obj, messages) {
            Array.foreach(messages, function (s, i) {
                if (s) {
                    if (!s.id)
                        throw new Error("Invalid statement found in '" + obj.id + "'.");
                    if (Array.indexBy(obj.messages, "id", s.id) != -1)
                        throw new Error("Duplicate statement id '" + s.id + "' found in '" + obj.id + "'.");
                    s.parent = obj;
                    obj.messages.push(s);
                }
            });
        }

        function _lookupMessage(root, path) {
            if (root && path) {
                path = Array.isArray(path) ? path : path.split("/");
                for (var i = 0, len = path.length, id; i < len; i++) {
                    id = path[i];
                    if (id == "..")
                        root = root.parent;
                    else
                        root = Array.lookupBy(root.messages, "id", path[i]);
                    if (root == null)
                        break;
                }
                return root;
            }
            return null;
        }

        function _path(m) {
            var path = [];
            while (isMessage(m)) {
                path.unshift(m.id);
                m = m.parent;
            }
            return (path.length > 0) ? path.join("/") : null;
        }


        function _findFunc(o, prop) {
            while (o) {
                if (typeof (o[prop]) === "function")
                    return o;
                if (typeof (o.parent) === "undefined")
                    break;
                o = o.parent;
            }
            return null;
        }


        //---------------------------
        function ConversationModel(
            id,            // unique conversation id | string
            config,        // { contact: interlocutor's contact id, contactHeader: 'Conversing With:', transcriptHeader: 'Conversation:', questionsHeader: 'Your Questions', contactStates: {}, openingStatement: .., closingStatement: ... }
            statements     // ordered list of statements (questions or responses) | array
        ) {
            var self = this,
                hooks = []; // future feature

            this.id = id;
            this.messages = [];
            this.contactStates = {};
            this.openingStatement = null;
            this.closingStatement = null;
            this.transcript = [];  // an array of visited statements where each entry is "file path" alike string indentifying final quesiton/response
            this.current = null;
            this.completed = false;

            function _add(msg, view) {
                var path = null, scope;
                if (msg && !Object.resolve(msg, "disabled")) {
                    if (Function.invoke(msg, "before", [self, view]) === false) // message level
                        return false;
                    scope = _findFunc(msg, "onMessage");
                    if (scope && scope.onMessage.apply(scope, [msg, view]) === false)
                        return false;
                    if (Function.invoke(self, "onMessage", [msg, view]) === false) // conversation level
                        return false;
                    Function.invoke(msg, "visit", [true]);
                    self.current = msg;
                    if (typeof(msg.path) == "function")
                        path = msg.path(msg);
                    if (path) {
                        self.transcript.push(path);
                        Function.invoke(msg, "after", [self, view]);
                        /*
                        for (var i = 0, func; i < hooks.length; i++) {
                            if (Function.isFunction(func))
                                func.apply(self, Array.prototype.concat([msg], view));
                        }
                        */
                    }
                }
                return path;
            }


            function _find(path) {
                if (self.openingStatement && self.openingStatement.id == path)
                    return self.openingStatement;
                if (self.closingStatement && self.closingStatement.id == path)
                    return self.closingStatement;
                return _lookupMessage(self, path);
            }

            function _isInTranscript(msg) {
                if (m) {
                    m = isMessage(m) ? m.path() : m.toString();
                    for(var i=self.transcript.length-1, t; i > -1; i++) {
                        if (t[i] == m)
                            return true;
                    }
                }
                return false;
            }

            function _resolveTranscript() {
                var result = [];
                Array.foreach(self.transcript, function (m) {
                    m = _find(m);
                    if (isMessage(m))
                        result.push(m);
                });
                return result;
            }

            function _getCurrentMessages() {
                var result = Array.prototype.concat([], isMessage(self.current) ? self.current.messages : self.messages);
                if (arguments.length < 1 || (arguments.length > 0 && !!arguments[0])) {
                    result = Array.filter(result, function (s) {
                        return (!Object.resolve(s, "visited") && !Object.resolve(s, "disabled"));
                    });
                }
                return result;
            }

            function _getLast() {
                return (self.transcript.length > 0) ? _find(self.transcript[self.transcript.length-1]) : null;
            }

            function _next() {
                var cur = self.current;
                if (cur) {
                    if (Array.isEmpty(cur.messages)) {
                        var n = cur.findProperty("next");
                        if (n) {
                            n = Object.resolve(n, "find", [Object.resolve(n, "next")]);
                            if (n && !Object.resolve(n, "visited")) {
                                n.disabled = false;
                                self.current = n;
                            }
                            else
                                n = null;
                        }
                        self.current = n ? n : null;
                    }
                    else {                        
                        var reset = null;
                        Array.foreach(self.current.messages, function (m) {
                            if (!Object.resolve(m, "visited") && !Object.resolve(m, "visited")) {
                                reset = self.current;
                                return -1;
                            }
                        });
                        self.current = reset;
                    }
                }
                return self.current;
            }

            function _getState() {
                return {
                    done: self.completed ? 1 : 0,
                    log: Array.append([], self.transcript)
                };
            }

            function _setState(state) {
                if (state) {
                    self.completed = Boolean.parseBoolean(state.done, false);
                    self.transcript = Array.isArray(state["log"]) ? state.log : [];
                }
            }

            var base = {
                addToTranscript: _add,
                find: _find,
                resolveTranscript: _resolveTranscript,
                isInTranscript: _isInTranscript,
                getCurrentMessages: _getCurrentMessages,
                getLast: _getLast,
                next: _next,
                getState: _getState,
                setState: _setState
            };

            Object.merge(this, base);
            Object.merge(this, config);

            this.base = base;

            if (this.openingStatement) {
                this.openingStatement.parent = this;
            }
            if (this.closingStatement) {
                this.closingStatement.parent = this;
            }

            _addMsgs(this, statements);
        }

        function IMessage(
            incoming,
            id,         // Response id unique at this level | string
            text,       // Response text | text/html string */
            config,     // optional message specific overrides | { enabled: false, photo  } */
            statements  // ordered list of substatements - questions/responses | array */
        ) {
            var self = this,
                _visited = false;
            this.id = id;
            this.text = text || "";
            this.status = null;
            this.messages = [];
            this.visited = false;

            if (config) {
                switch (typeof (config)) {
                    case "string":
                        this.next = config;
                        break;

                    case "function":
                        this.onStatement = config;
                        break;

                    case "object":
                        if (Array.isArray(config))
                            statements = config;
                        else {
                            Object.merge(this, config);
                            _visited = Object.resolve(this, "visited") ? true : false;
                        }
                        break;
                }
            }

            function conversation() {
                var c = self;
                while (c) {
                    if (isConversation(c))
                        return c;
                    if (!c.hasOwnProperty("parent"))
                        break;
                    c = c.parent;
                }
                return null;
            }

            function path() {
                return _path(self);
            }

            function visited() {
                if (arguments.length > 0)
                    _visited = !!arguments[0];
                return _visited;
            }

            function findProp(prop) {
                var o = self;
                while (o) {
                    if (typeof (o[prop]) !== "undefined")
                        return o;
                    if (typeof (o.parent) === "undefined")
                        break;
                    o = o.parent;
                }
                return null;
            }

            function resolveProp(prop) {
                var o = self;
                while (o) {
                    if (typeof (o[prop]) !== "undefined")
                        return Object.resolve(o, prop);
                    if (typeof (o.parent) === "undefined")
                        break;
                    o = o.parent;
                }
                return null;
            }

            function find(path) {
                if (path) {
                    if (String.startsWith(path, '/'))
                        path = path.substring(1);
                    else {
                        path = self.path() + "/" + path;
                    }
                    var c = conversation();
                    if (c)
                        return c.find(path);
                }
                return self;
            }

            function isChild(m) {
                while(isMessage(m)) {
                    if (m.parent == self)
                        return true;
                    m = m.parent;
                }
                return false;
            }

            function enable() {
                var m = self, e = true;
                if (arguments.length > 0) {
                    if (arguments.length == 1) {
                        if (typeof(arguments) === "boolean")
                            e = !!arguments[0];
                        else {
                            if (typeof(arguments[0]) === "string")
                                m = find(arguments[0]);
                            else
                                if (isMessage(arguments[0]))
                                    m = arguments[0];

                        }
                    }
                    else {
                        m = find(arguments[0]);
                        e = !!arguments[1];
                    }
                }
                if (m)
                    m.disabled = !e;
            }
            

            var base = {
                conversation: conversation,
                path: path,
                enable: enable,
                cancel: function () {
                    var args = (arguments.length == 1) ? [arguments[0], false] : (arguments.length > 1 ? [arguments[0], arguments[1]] : [self, false]);
                    enable.apply(this, args);
                },
                visit: function () {
                    if (Function.isFunction(self, "visited"))
                        self.visited(true);
                    else
                        self.visited = true;
                },
                visited: visited,
                findProperty: findProp,
                resolve: resolveProp,
                find: find,
                isIncoming: function () {
                    return incoming;
                },
                isOutgoing: function () {
                    return !incoming;
                },
                isChild: isChild
            };

            Object.merge(this, base);

            this.base = function () {
                return base;
            };

            _addMsgs(this, statements);

            return this;
        }

        function IncomingMessage(
            id,         // question id unique at this level | string
            text,       // question text | text/html string */
            config,     // optional question specific overrides | { enabled: false, photo  } */
            responses   // ordered list (array) of reponses
        ) {
            var self = IMessage.call(this, true, id, text, config, responses);
            return self;
        }

        function OutgoingMessage(
            id,         // question id unique at this level | string
            text,       // question text | text/html string */
            config,     // optional question specific overrides | { enabled: false, photo  } */
            messages    // ordered list (array) of follow up messages
        ) {
            var self = IMessage.call(this, false, id, text, config, messages);
            return self;
        }

        function isConversation(c) {
            return (c && (c instanceof ConversationModel)) ? true : false;
        }

        function isIncoming(m) {
            return (m && (m instanceof IncomingMessage)) ? true : false;
        }

        function isOutgoing(m) {
            return (m && (m instanceof OutgoingMessage)) ? true : false;
        }

        function isMessage(m) {
            return (isIncoming(m) || isOutgoing(m));
        }

        this.Conversation = ConversationModel;
        this.isConversation = isConversation;
        this.Incoming = IncomingMessage;
        this.isIncoming = isIncoming;
        this.Outgoing = OutgoingMessage;
        this.isOutgoing = isOutgoing;
        this.isMessage = isMessage;

        /* obsolete */
        this.Question = IncomingMessage
        this.Response =  OutgoingMessage;
        this.isQuestion = isIncoming;
        this.isResponse = isOutgoing;
        this.isStatement = isMessage;
    }

    return ConversationLib;
});
