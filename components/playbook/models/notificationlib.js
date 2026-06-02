define([], function () {

    var lib = new function () {

        this.Notification = function (id, text, override) {
            var self = this;
            this.id = id;
            this.text = text || {};
            this.isPosted = false;
            this.isDismissed = false;

            Object.merge(this, override);
        };
    };

    lib.isNotification = function (obj) {
        return (obj instanceof lib.Notification) ? true : false;
    };

    return lib;
});
