define(["knockout", "trc/trc.spa", "playbook/models/themes"],
function (ko, SPA, Themes) {

    var _defaultTheme = Themes.resolveTheme("playbook.addressbook");

    return function () {
        var self = SPA.CreateView(this),
            contactRenderer = null,
            renderingIndex = 0,
            selected = [],
            multiple = true,
            onOK = null;

        this.theme = ko.observable();
        this.contacts = ko.observableArray();

        this.activateView = function () {
            var parameters = self.getParameters(),
                contacts = Object.resolve(parameters, "contacts"),
                theme = Object.resolve(parameters, "theme");

            selected = Object.resolve(parameters, "selected");
            multiple = Object.resolve(parameters, "multiple");
            multiple = (multiple == null) ? true : !!multiple;
            
            theme = Themes.resolveTheme(theme, _defaultTheme);
            selected = Array.isArray(selected) ? selected : [];
            onOK = (parameters && Function.isFunction(parameters.onOK)) ? parameters.onOK : null;
            contactRenderer = (theme && Function.isFunction(theme.renderContact)) ? theme.renderContact : null;

            self.theme(theme);

            contacts = Object.filter(contacts, function (c) {
                return (c.id && !c.exclude);
            }, true);

            self.contacts(contacts);

            Themes.call(self.theme(), ["activateView"], [self]);
        };

        this.mapView = function (view) {
            self.base.mapView(view);
        };

        this.bindView = function (view) {
            Themes.call(self.theme(), ["bindView"], [self, view]);
        };

        this.attachView = function (view) {
            Themes.call(self.theme(), ["attachView"], [self, view]);
        };

        this.completeView = function (view) {
            Themes.call(self.theme(), ["completeView"], [self, view]);
        };

        this.getFromPhoto = function (email) {
            var contact = email ? self.resolveContact(email.from) : null;
            return contact ? (contact.photo ? contact.photo : contac.id) : "";
        }

        this.getFromName = function (email) {
            var contact = email ? self.resolveContact(email.from) : null;
            return contact ? contact.name : ((email && email.from) ? email.from.toString() : "");
        }

        //#region Address Book
        
        this.isSelected = function (contact) {
            return (contact && selected.indexOf(contact.id) > -1);
        };

        this.getSelected = function () {
            return Array.filter(self.contacts(), function (c) {
                return (c && selected.indexOf(c.id) > -1);
            });
        };

        this.renderContact = function (elements, contact) {
            var item = Array.pick(Array.filter(elements, function (e) {
                return TRC.hasClass(e, "contact");
            }), 0, null);

            if (item) {
                if (contactRenderer)
                    contactRenderer.call(self, item, contact);
                var row = Math.floor(renderingIndex / 2);
                var col = renderingIndex % 2;
                item.style.top = (5 + (85 * row)).toString() + "px";
                TRC.addClass(item, (col ? " column2" : " column1"));
                renderingIndex++;
                setTimeout(function () {
                    TRC.Style.render(item);
                }, 250);
            }
        }

        this.contactCheck = function (checkbox, contact) {
            if (contact) {
                var index = selected.indexOf(contact.id);
                if (index == -1) {
                    if (!multiple && selected.length > 0)
                        return false;
                    selected.push(contact.id);
                    TRC.setAttr(checkbox, "checked");
                }
                else {
                    selected.splice(index, 1);
                    TRC.removeAttr(checkbox, "checked");
                }
                return true;
            }
            return false;
        };

        this.cancelClick = function () {
            try {
                self.close();
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
        };

        this.buttonClick = function () {
            try {
                var result = onOK ? onOK.call(self) : true;
                if (Boolean.parseBoolean(result, true))
                    self.close();
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
            }
        };
        //#endregion
    };
});