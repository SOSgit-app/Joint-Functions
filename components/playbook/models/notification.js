define([], function() {
    function Notification(id, override) {
        var self = this;
        this.id = id;
        this.text = "";
        this.isPosted = false;
        this.isDismissed = false;

        this.onDismiss = function (app, shell) {
        };

        Object.merge(this, override);
    };
    return Notification;
});
