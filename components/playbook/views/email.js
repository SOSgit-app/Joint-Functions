define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/messaginglib"],
function (ko, SPA, Themes, MessagingLib) {

    var _defaultTheme = Themes.resolveTheme("playbook.email");

    return function () {
        var self = SPA.CreateView(this),
            _currentComposeEmail = null,
            _currentComposeViewModel = null,
            _panes = ["inbox", "read", "sent", "compose"];

        this.emails = new TRC.Dictionary({ name: "Emails" });
        this.contacts = new TRC.Dictionary({ name: "Contacts" });

        this.theme = ko.observable();
        this.skin = ko.observable();
        this.title = ko.observable("");
        this.inboxMessages = ko.observableArray([]);
        this.sentMessages = ko.observableArray([]);
        this.allowReply = ko.observable(true);

        this.inboxPane = null;
        this.sentPane = null;
        this.composePane = null;
        this.currentPaneName = null;
        this.currentRead = ko.observable();
        this.currentComposeEmail = ko.observable();
        this.currentComposeView = ko.observable(null);

        this.currentComposeEmail.subscribe(function (email) {
            if (_currentComposeEmail != email) {
                _currentComposeEmail = email;
                var composeView = "playbook/views/email.text";
                if (email) {
                    var view = Object.resolve(window.application.shell.resolveViewMap(String.ifEmpty(Object.resolve(email, "composeView"), Object.resolve(email, "format"))), "moduleId");
                    if (view)
                        composeView = view;
                }
                setTimeout(function () {
                    if (!(email instanceof MessagingLib.EmailMessage))
                        email = null;

                    TRC.Utils.enable(self.elements.composeToButton, !!(email && (!Object.hasProperty(email, "canChangeRecipient") || !!Object.resolve(email, "canChangeRecipient"))));

                    if ((email && (!Object.hasProperty(email, "canChangeSubject") || !!!Object.resolve(email, "canChangeSubject"))))
                        TRC.Utils.setAttr(self.elements.composeSubject, "readonly");
                    else
                        TRC.Utils.removeAttr(self.elements.composeSubject, "readonly");

                    self.composeAllowSend((email && email.to().length > 0));

                    self.currentComposeView(composeView);
                }, 50);
            }
        });

        function _resolve(collection, value, args) {
            switch (typeof (value)) {
                case "string":
                case "number":
                case "boolean":
                    if (value && collection && collection.items) {
                        value = collection.items[value.toString()];
                        if (!Object.isNull(value))
                            return value;
                    }
                    break;

                case "object":
                    if (value) {
                        if (Array.isArray(value)) {
                            if (value.length > 0) {
                                return _resolve(collection, value[0], args);
                            }
                        }
                        else {
                            if (value.id)
                                return value;
                        }
                    }
                    break;

                case "function":
                    args = Array.toArray(args);
                    return (args.length > 0) ? value.apply(self, args) : value.call(self);
            }
            return null;
        }

        function _resolveContact(contact, args) {
            return _resolve(self.contacts, contact, args);
        }

        function _resolveEmail(email, args) {
            return _resolve(self.emails, email, args);
        }


        function _sortEmails(emails, box) {
            if (Array.isArray(emails)) {
                emails.sort(function (a, b) {
                    a = (a && a.receivedDate) ? new Date(a.receivedDate.replace(/XX/gi, "01")) : NaN;
                    b = (b && b.receivedDate) ? new Date(b.receivedDate.replace(/XX/gi, "01")) : NaN;
                    return (a && b && a.getTime() > b.getTime()) ? -1 : 1;
                });
            }
            return emails;
        }

        function _resolveBrief(email, panel) {
            var text = "";
            if (email && !Object.isNull(email.body)) {
                switch (typeof (email.body)) {
                    case "string":
                        text = email.body.replace(/\<br\s*\/*\>/gi, " ").replace(/\[signature\]/gi, self.getFromName(email) + " ");
                        break;

                    case "object":
                        if (Function.isFunction(email.resolveBrief))
                            text = email.resolveBrief.call(email, self).replace(/\[signature\]/gi, self.getFromName(email) + " ");
                        else
                            text = "&lt;No preview available at this time&gt;";
                        break;
                }
                if (text.length >= 300)
                    text = text.substring(0, 300) + " ...";
            }
            return text;
        }

        function _show(element, show) {
            if (element) {
                if (show || arguments.length < 2)
                    $(element).show();
                else
                    $(element).hide();
            }
        }


        this.resolveContact = _resolveContact;
        this.resolveEmail = _resolveEmail;
        this.sortEmails = _sortEmails;
        this.resolveBrief = _resolveBrief;

        this.activateView = function () {
            var parameters = self.getParameters(),
                theme = Themes.resolveTheme(Object.resolve(parameters, "theme"), _defaultTheme),
                pane = Object.resolve(parameters, "pane");

            self.currentPaneName = (_panes.indexOf(pane) == -1) ? pane : "inbox";

            if (!Object.isNull(theme)) {

                self.theme(theme);
                self.skin(Object.resolve(theme, "skin"));

                if (theme.contacts)
                    self.contacts = theme.contacts;

                if (Function.isFunction(theme.resolveContact))
                    self.resolveContact = theme.resolveContact;

                if (theme.emails)
                    self.emails = theme.emails;

                if (Function.isFunction(theme.resolveEmail))
                    self.resolveEmail = theme.resolveEmail;

                if (Function.isFunction(theme.sortEmails))
                    self.sortEmails = theme.sortEmails;
            }

            Themes.call(theme, ["activateView"], [self]);
        };

        this.mapView = function (view) {
            self.base.mapView(view);

            self.dialog = TRC.selectFirst("div.dialog", self.view);
            if (self.dialog) {
                for (var i = 0; i < _panes.length; i++) {
                    self[_panes[i] + "Pane"] = TRC.selectFirst("div.pane." + _panes[i], self.dialog);
                }
                self.elements.saveAttachmentsButton = TRC.selectFirst("div.attachments > a.save", self.readPane);
                self.elements.composeToButton = TRC.selectFirst("div.email-header a.to", self.composePane);
                self.elements.composeToInput = TRC.selectFirst("div.email-header input.to", self.composePane);
                self.elements.composeSubject = TRC.selectFirst("div.email-header input.subject", self.composePane);
                self.elements.sendButton = TRC.selectFirst("a.send", self.composePane);
            }
        };

        this.bindView = function (view) {
            Themes.call(self.theme(), ["bindView"], [self, view]);
        };

        this.attachView = function (view) {
            Themes.call(self.theme(), ["attachView"], [self, view]);
            self.setPane();
        };

        this.completeView = function (view) {
            Themes.call(self.theme(), ["completeView"], [self, view]);
        };

        this.setPane = function (pane) {
            if (arguments.length < 1)
                pane = self.currentPaneName;

            if (_panes.indexOf(pane) == -1)
                pane = "inbox";

            // self.currentPaneName != pane && 
            if (self && self[pane + "Pane"]) {

                var cp = null;
                if (self.currentPaneName) {
                    cp = self[self.currentPaneName + "Pane"];
                    if (cp)
                        $(cp).hide();
                }

                self.currentPaneName = pane;
                switch (pane) {
                    case "inbox":
                        self.title("");
                        self.updateInbox();
                        break;

                    case "read":
                        TRC.Style.renderView(self["readPane"], 50);
                        break;

                    case "sent":
                        self.title("");
                        self.updateSent();
                        break;

                    case "compose":
                        self.title("");
                        var email = self.currentComposeEmail(),
                            send = null;
                        if (!(email instanceof MessagingLib.EmailMessage) || (email && email.isSent)) {
                            var t = self.theme();
                            if (t) {
                                email = Function.invoke(t, "newEmail", [self]);
                                if (!email && Function.isFunction(t, "send"))
                                    send = t.send;
                            }
                        }
                        if (!email || (email && email.isSent)) {
                            email = new MessagingLib.EmailMessage((new Date()).getTime(), null, null, null, null, null, {
                                isSent: false,
                                canChangeRecipient: true,
                                multiple: true,
                                canChangeSubject: true,
                                send: send
                            });
                        }
                        self.currentComposeEmail(email);
                        break;

                    default:
                        return false;
                }
                cp = self[pane + "Pane"];
                if (cp) {
                    $(cp).show();
                    _updateMainMenu();
                }
                return true;
            }
            return false;
        };


        this.composeAllowSend = function (allow) {
            return (arguments.length > 0) ? TRC.Utils.enable(self.elements.sendButton, !!allow) : (TRC.Utils.getAttr(self.elements.sendButton, "disabled") != "disabled");
        }

        this.resolveSubjectText = function (email) {
            return (email && email.subject) ? email.subject : "";
        }

        this.resolveEmailHtml = function (email, html) {
            if (email) {
                if (typeof (html) === "undefined")
                    html = email.body;
                if (html)
                    return html.replace(/\[signature\]/gi, self.getFromSignature(email));
            }
            return html;
        };

        this.resolveEmailHtmlBody = function (email) {
            return (email && email.body) ? self.resolveEmailHtml(email, email.body) : "";
        };

        this.resolveBodyText = function (email) {
            return (email && email.id && (!email.format || email.format == "free-text")) ? email.body : "";
        }

        this.getFromPhoto = function (email) {
            var contact = email ? self.resolveContact(email.from) : null;
            return contact ? (contact.photo ? contact.photo : contac.id) : "";
        }

        this.getFromName = function (email) {
            var contact = email ? self.resolveContact(email.from) : null;
            return contact ? contact.name : ((email && email.from) ? email.from.toString() : "");
        }

        this.getToPhoto = function (email) {
            var contact = null;
            if (email) {
                contact = self.resolveContact(email.to());
                if (contact)
                    return contact.photo ? contact.photo : contac.id;
            }
            return "";
        };

        this.getToNames = function (email) {
            var names = [];
            if (email && Object.isFunction(email.to)) {
                var recepients = email.to(), contact;
                Array.foreach(recepients, function (r) {
                    contact = self.resolveContact(r);
                    if (contact)
                        names.push(contact.name);
                });
            }
            self.composeAllowSend(names.length > 0);
            return names.join(", ");
        };

        this.getFromSignature = function (email) {
            var contact = email ? self.resolveContact(email.from) : null;
            return (contact && contact.hasOwnProperty("signature")) ? contact.signature : "";
        }

        //#region Main menu
        function _updateMainMenu() {
            for (var i = 0; i < _panes.length; i++) {
                var menuItem = $("div.menu > a." + _panes[i], self.view)[0];
                if (menuItem)
                    menuItem.className = self.getMenuItemStyle(_panes[i]);
            }
        };

        this.getMenuItemStyle = function (menu) {
            var cm = self.currentPaneName;
            if (!cm || cm == "read")
                cm = "inbox";
            return menu + (cm == menu ? " selected" : "");
        };

        this.onInboxMenuClick = function () {
            self.setPane("inbox")
        };

        this.onSentMenuClick = function () {
            self.setPane("sent");
        };

        this.onComposeMenuClick = function () {
            self.setPane("compose");
        };
        //#endregion

        //#region Inbox
        this.updateInbox = function () {
            var emails = [];
            if (self.emails) {
                Object.filter(self.emails.items, function (e) {
                    return (e && !!e.isReceived);
                }, emails);
                if (Function.isFunction(self.sortEmails))
                    emails = self.sortEmails.call(self, emails, "inbox");
            }
            self.inboxMessages(emails);
        };

        this.renderInboxItem = function (elements, email) {
            var item = Array.pick(Array.filter(elements, function (e) {
                return TRC.Utils.hasClass(e, "message");
            }), 0, null);
            TRC.Style.renderView(item, 50);
            Themes.call(self.theme(), ["skinInboxItem"], [self, self.view, item, email]);
        };

        this.onInboxEmailClick = function (email, evt) {
            var canSaveAttachments = false;
            if (email && email.id) {
                email.open.call(email);
                var elem = TRC.selectParentNode(evt.target, "DIV.message");
                if (elem)
                    elem.setAttribute("read", email.isRead);
                canSaveAttachments = (!email.isSaved && Array.isArray(email.attachments) && email.attachments.length > 0);
            }
            _show(self.elements.saveAttachmentsButton, canSaveAttachments);
            self.currentRead(email);
            self.title(self.getFromName(email));
            self.setPane("read");
        };

        this.onSaveAttachmentClick = function () {
            try {
                var email = self.currentRead();
                if (email && email.id && email.hasAttachments && !email.isSaved && Object.isFunction(email.onSaveAttachments)) {
                    var da = Object.ifNull(email.onSaveAttachments.call(email, self), true);
                    if (da) {
                        email.isSaved = true;
                        _show(self.elements.saveAttachmentsButton, false);
                    }
                }
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
        };

        this.canReply = function (email) {
            if (email) {
                if (Object.isFunction(email.canReply))
                    return Boolean.parseBoolean(email.canReply.call(email, self), false);
                if (email.replyAs)
                    return true;
            }
            return false;
        };

        this.onReplyClick = function () {
            try {
                var email = self.currentRead();
                if (self.canReply(email)) {
                    email = self.resolveEmail(email.replyAs);
                    if (!email)
                        throw new Error("Invalidf replayAs email " + email.replyAs);
                    self.currentComposeEmail(email);
                    self.setPane("compose");
                }
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
        };
        //#endregion

        //#region Sentbox
        this.updateSent = function () {
            var emails = [];
            if (self.emails) {
                Object.filter(self.emails.items, function (e) {
                    return (e && !!e.isSent);
                }, emails);
                if (Function.isFunction(self.sortEmails))
                    emails = self.sortEmails.call(self, emails, "sent");
            }
            self.sentMessages(emails);
        };

        this.renderSentboxItem = function (elements, email) {
            var item = Array.pick(Array.filter(elements, function (e) {
                return TRC.Utils.hasClass(e, "message");
            }), 0, null);
            TRC.Style.renderView(item, 50);
            Themes.call(self.theme(), ["skinSentboxItem"], [self, self.view, item, email]);
        };

        this.onSentEmailClick = function (email, evt) {
            if (email) {
            }
        };
        //#endregion

        //#region Compose
        this.composeBinging = function (view, parent, context) {
            try {
                _currentComposeViewModel = Object.resolve(context, "model");
            }
            catch (error) {
            }
        }

        this.composeToClick = function () {
            try {
                var email = self.currentComposeEmail();

                if (!(email instanceof MessagingLib.EmailMessage))
                    return;
                if (email.isSent || !Boolean.parseBoolean(email.canChangeRecepients, true))
                    return;

                var dialog = window.openModalView("playbook/views/addressbook", {
                    contacts: self.contacts.items,
                    multiple: (Object.hasProperty(email, 'singleRecipient') ? !Object.resolve(email, "singleRecipient") : true),
                    selected: Array.prototype.concat(email.to()),
                    onOK: function () {
                        //this = addressbook
                        var recipients = [],
                            names = [],
                            composeAs = null;

                        contacts = self.contacts;
                        Array.foreach(this.getSelected(), function(contact) {
                            if (contact && contact.id) {
                                recipients.push(contact.id);
                                names.push(contact.name);
                                if (!composeAs)
                                    composeAs = self.resolveEmail(Object.resolve(contact, "composeAs", [self]));                                
                            }
                        });
                        
                        if (composeAs && email != composeAs) {
                            email = composeAs;
                            self.currentComposeEmail(email);
                        }

                        var allowSend = false;
                        if ((email instanceof MessagingLib.EmailMessage)) {
                            email.to(recipients);

                            if (self.elements.composeToInput)
                                self.elements.composeToInput.value = names.join(", ");

                            allowSend = (names.length > 0);
                        }

                        self.composeAllowSend(allowSend);
                    }
                });
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
        }

        this.composeSendClick = function () {
            var canSend = false;
            try {
                canSend = self.composeAllowSend();
                if (!canSend)
                    return;

                self.composeAllowSend(false);

                var email = self.currentComposeEmail(), result = true;
                if (email) {
                    email.subject = self.elements.composeSubject.value;

                    Function.invoke(email.body, "syncState", [self]);

                    result = Function.invoke(_currentComposeViewModel, "sendEmail", [email, self]);

                    if (result != false)
                        result = Function.invoke(email, "send", [_currentComposeViewModel]);

                    if (result != false) {
                        email.isSent = true;
                        if (self.emails && self.emails.find) {
                            var e = self.emails.find(email.id);
                            if (e == null)
                                self.emails.add(email);
                        }
                        self.setPane("sent");
                        self.currentComposeEmail(null);
                        canSend = false;
                    }
                }
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
            finally {
                self.composeAllowSend(canSend);
            }
        };
        //#endregion
    };
});