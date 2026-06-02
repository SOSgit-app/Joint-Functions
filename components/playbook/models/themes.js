define(["durandal/system"],
function (System) {
    return new function() {
        var self = this;

        var _themes = {};

        this.addTheme = function (path, theme) {
            if (!path)
                throw new Error("Invalid team path");
            if (!Array.isArray(path))
                path = path.toString().split(".");
            var current = _themes;
            for (var i = 0, last = path.length - 1, p; i < last; i++) {
                p = path[i];
                if (Object.isNull(current[p]))
                    current[p] = {};
                current = current[p];
            }
            current[path[last]] = theme;
            return theme;
        };

        this.findTheme = function (path) {
            return path ? Object.eval(_themes, path) : null;
        };

        this.resolveTheme = function () {
            for (var i = 0, theme; i < arguments.length; i++) {
                theme = arguments[i];
                if (theme) {
                    if (typeof (theme) === "string")
                        theme = Object.eval(_themes, theme);
                    if (!Object.isNull(theme))
                        return theme;
                }
            }
            return null;
        };

        this.attr = function (source, attr) {
            var a = arguments.length > 2 ? arguments[2] : null;
            if (Array.isArray(source)) {
                Array.foreach(source, function (o) {
                    if (Object.hasProperty(o, attr)) {
                        a = o[attr];
                        return -1;
                    }
                })
            }
            else {
                if (Object.hasProperty(source, attr))
                    a = source[attr];
            }
            return a;
        };

        this.has = function (source, prop) {
            if (source) {
                for (var i = 0, o; i < source.length; i++) {
                    o = source[i];
                    if (o && typeof (o[prop]) !== "undefined")
                        return true;
                }
            }
            return false;
        };

        this.resolve = function (source, prop) {
            if (source) {
                for (var i = 0, o; i < source.length; i++) {
                    o = source[i];
                    if (o && typeof (o[prop]) !== "undefined")
                        return Object.resolve(o, prop);
                }
            }
            return null;
        };

        this.ifEmptyAttr = function (obj, attr) {
            return (obj && !String.isEmpty(obj[attr])) ? obj[attr] : (arguments.length > 2 ? arguments[2] : null);
        };
        
        this.call = function (obj, methods, args, def) {
            obj = Array.isArray(obj) ? obj : [obj];
            var methods = Array.toArray(methods);
            for (var i = 0, o, f; i < obj.length; i++) {
                o = obj[i];
                func = Function.find(methods, o);
                if (func)
                    return func.apply(o, args);
            }
            return (typeof(def) === "function") ? def() : def;
        };

        this.themeCall = function (theme, methods, args, def) {
            theme = self.resolveTheme(theme);
            return theme ? self.call(theme, methods, args, def) : def;
        }

        this.callEventHandler = function (obj, methods, args) {
            return Boolean.parseBoolean(self.call(obj, methods, args, true), true);
        };

        this.playbook = {
        };
    };
});
