define(["knockout", "trc/trc.spa"],
    function (ko, SPA) {

    return function () {
        var self = SPA.CreateView(this);

        this.text = ko.observable();
        this.sugnature = ko.observable();

        this.activateView = function () {
            var parameters = self.getParameters(),
                email = Object.resolve(parameters, "content");
            if (email) {
                if (typeof (email.body) == "string")
                    self.text(String.replace(email.body, /\[signature\]/gi, ""));
                if (self.parent && Function.isFunction(self.parent.getFromSignature))
                    self.signature(self.parent.getFromSignature(email));
            }
        };

        this.mapView = function (view) {
            self.base.mapView(view);
            self.elements.text = TRC.selectFirst("textarea.text", self.view);
        };

        this.sendEmail = function (email) {
            if (email) {
                if (self.elements.text)
                    email.body = self.elements.text.value;
                return true;
            }
            return false;
        };
    };
});