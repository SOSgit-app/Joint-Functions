// v1.7 | 03/26/2014 | Copyright (c) 2013,2014 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
var TRC = TRC || {};
(function () {
    var _FILE_ = "trc.simportpage.js",
        _VERSION_ = 1.7;

    if ((function () {
        function wrongTRC() {
            throw new Error("" + document.location + ": script '" + _FILE_ + "' requires 'trc.js' v1.7 or higher.");
        }
        if (typeof (window.TRC) == "undefined" || !window.TRC)
            wrongTRC();
        var ver = (typeof (TRC.version) != "undefined") ? parseFloat(TRC.version) : 0;
        if (!ver || ver < 1.7)
            wrongTRC();

        if (typeof (TRC.SimportPage) != "undefined" && typeof (TRC.SimportPage.version) != "undefined") {
            ver = parseFloat(TRC.SimportPage.version);
            if (ver && ver >= _VERSION_)
                return false;
        }
    }) == false)
        return;

    TRC.SimportPage = new function () {
        var self = this,
            dirtyForm = false, // used to be __form_is_dirty
            dirtyFormMessage = "There are unsaved changes. Click OK to navigate away from task without saving. Click Cancel to return to task.";

        this.version = _VERSION_;
        this.lastPopup = null; // openwin;


        this.setDirtyForm = function () {
            dirtyForm = (arguments.length > 0) ? Boolean.parseBoolean(arguments[0], true) : true;
        };

        this.isFormDirty = function () { // CheckDirty
            return !!dirtyForm;
        };

        this.checkDirty = function () { // CheckDirty
            if (!dirtyForm)
                return true;
            if (!confirm(dirtyFormMessage))
                return false;
            return true;
        };

        function hijackLinks() {
            for (var i = -1, len = document.links.length, link, noconfirm; ++i < len;) {
                link = document.links[i];
                noconfirm = TRC.isTrue(TRC.Utils.getAttr(link, "noconfirm") || false);
                if (!noconfirm && (link.target == "_self" || link.target == "" || link.target == window.name)) {
                    if (link.onclick != null) {
                        (function (a) {
                            var _this = this;
                            var oldClick = a.onclick;
                            a.onclick = function (x) {
                                return self.checkDirty() ? (oldClick ? oldClick.call(_this, x) : false) : false; // or even better oldClick(x);
                            };
                        })(link);
                    }
                    else {
                        link.onclick = self.checkDirty;
                    }
                }
            }
        }

        this.openPopupWindow = function (url, name, width, height, scrollbars) { // used to be as a global "popupwin" function
            try {
                var settings = "toolbar=no,location=no,status=yes,menubar=no,resizable=no,dependent=no";
                if (arguments.length < 2)
                    name = "_blank";
                else {
                    if (arguments.length > 2) {
                        settings += ",width=" + width;
                        if (arguments.length > 3) {
                            settings += ",height=" + height;
                            if (arguments.length > 4) {
                                settings += ",scrollbars=" + scrollbars;
                            }
                        }
                    }
                }
                self.lastPopup = window.open(url, name, settings);
            }
            catch (error) {
                alert("Can't open popup window url '" + url + "'.");
                return null;
            }
            return self.lastPopup;
        };

        this.clearMessage = function (message) {
            try {
                message = document.getElementById(message);
                if (message)
                    message.style.visibility = "hidden";
            }
            catch (e) {
            }
        };

        //-->
        TRC.onReady(hijackLinks);
    };

    window.TrySetDirtyForm = function () {
        TRC.SimportPage.setDirtyForm();
    }
})();
