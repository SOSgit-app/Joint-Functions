define(["durandal/system", "knockout"], function (System, ko) {

    var MessagingLib = new function () {

        this.ContactInfo = function (
            id,         /* unique contact id */
            name,       /* contact full name */
            photo,      /* photo */
            title,      /* contact title */
            company,    /* company name */
            address,    /* contact email address */
            settings)   /* optional contact settings */
        {
            var self = this;
            this.id = id;
            this.name = name;
            this.photo = photo;
            this.title = title;
            this.company = company;
            this.address = address;

            Object.merge(this, settings);
        };

        this.VideoMessage = function (
            id,         /* unique video message id | string */
            title,      /* title of the video message */
            from,       /* sender contact id | string */
            day,        /* day message received | 'today', 'yesterday', etc */
            date,       /* date message received | string */
            time,       /* time message received | string */
            video,      /* message video uri | string */
            transcript, /* message transcript | text/html string */
            settings)  /* optional message specific settings */
        {
            var self = this;
            this.id = id;
            this.title = title || "Video Message from [from_name]";
            this.from = from || null;
            this.day = day || "";
            this.date = date;
            this.time = time || "";
            this.video = video || null;
            this.transcript = transcript || "";
            this.isRecieved = false;

            Object.merge(this, settings);
        };

        this.InfoMessage = function (
            id,         /* unique info message id | string */
            title,      /* message header | text/html string */
            text,       /* message text | text/html string */
            overrides)  /* optional message specific overrides | { logo: "logo uri", images: ["image1 url", "iomage 2 url", ...], button: 'Begin', onClose: function(App) {}  } */
        {
            var self = this;
            this.id = id;
            this.title = title || "";
            this.text = text || "";
            this.isVisited = false;

            Object.merge(this, overrides);
        };

        this.EmailMessage = function (
            id,             /* unique email message id | string */
            from,           /* senders contact id | string */
            to,             /* list of recipients, a list of contact ids | [] */
            receivedDate,   /* date message 'received'| string */
            subject,        /* subject line | text/html string */
            body,           /* message body | text/html string */
            overrides)      /* optional overrides */
        {
            var self = this;
            this.id = id;
            this.from = from;
            this.to = ko.observableArray(to || []);
            this.receivedDate = receivedDate;
            this.subject = subject;
            this.body = body;
            this.attachments = [];

            this.isReceived = false;
            this.isSent = false;
            this.isRead = null;
            this.replyAs = null;        /* reply email template id */

            this.hasAttachments = function () {
                return (self.attachments && self.attachments.length) ? true : null;
            };

            this.open = function () {
                var da = true;
                if (!self.isRead && Function.isFunction(self.onOpen))
                    da = Object.ifNull(self.onOpen.call(self), true);
                if (da)
                    self.isRead = true;
                return self.isRead;
            }

            this.send = function (view) {
                var da = true;
                if (!self.isSent) {
                    if (Function.isFunction(self.onSend))
                        da = Object.ifNull(self.onSend.call(self, view), true);
                    if (da)
                        self.isSent = true;
                }
                return da;
            }

            this.canReply = function (emailCatalog) {
                return (self.replyAs && emailCatalog && emailCatalog.items[self.replyAs] && emailCatalog.items[self.replyAs].isSent == false) ? true : false;
            }

            this.getState = function () {
                var state = "";
                if (self.isReceived)
                    state += "r";
                if (self.isRead)
                    state += "o";
                if (self.isSent)
                    state += "s";
                return state.length > 0 ? state : null;
            }

            this.setState = function (state) {
                if (state && typeof(state) === "string") {
                    self.isReceived = (state.indexOf("r") != -1);
                    self.isRead = (state.indexOf("o") != -1);
                    self.isSent = (state.indexOf("s") != -1);
                }
            };

            this.base = {
                hasAttachments: this.hasAttachments,
                open: this.open,
                send: this.send,
                getState: this.getState,
                setState: this.setState
            }

            Object.merge(this, overrides);
        };
    }

    return MessagingLib;
});
