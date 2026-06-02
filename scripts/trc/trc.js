// v1.9 | 08/13/2015 | Copyright (c) 2013-2015 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
var TRC = TRC || {};
(function (trc) {
    var _VERSION_ = 1.9,
        _ver = parseFloat(trc.version);

    if (_ver && _ver >= _VERSION_)
        return;

    trc.version = _VERSION_;

    var _FILE_ = "trc.js",
        _FILELOGO_ = _FILE_ + ": ",
        _rePlatform = /(?:\s)+\(((?:[^\)])*)\)/gi,
        _browserTest = [
                {
                    name: "IE",
                    vendor: "Microsoft",
                    test: {
                        agent: [
                            /MSIE\s+(\d+\.\d+);/i,
                            /Trident\/(?:\d+\.\d+);.*\s+rv:(\d+\.\d+)/i
                        ]
                    },
                    isHTML5: function () { return (this.version < 9) ? false : true; },
                    isDesktopMode: function () {
                        try {
                            return (!!new window.ActiveXObject("htmlfile"));
                        }
                        catch (e) {
                            return false;
                        }
                    },
                    touch: function () {
                        return typeof (window.navigator.maxTouchPoints) ? parseInt(window.navigator.maxTouchPoints) : NaN;
                    }
                },
                {
                    name: "OPERA",
                    vendor: "Opera",
                    test: {
                        agent: [/\s+OPR\/(\d+\.\d+)/i]
                    },
                    isHTML5: function () { return (this.version > 13); }
                },
                {
                    name: "CHROME",
                    vendor: "Google",
                    test: {
                        agent: [
                            /Mozilla\/\d+\.\d+.*\s+Chrome\/(\d+\.\d+)/i,
                            /Mozilla\/\d+\.\d+.*\s+CriOS\/(\d+\.\d+)/i
                        ]
                    },
                    isHTML5: function () { return (this.version > 22); }
                },
                {
                    name: "FIREFOX",
                    vendor: "Mozilla",
                    test: {
                        agent: [/Firefox\/(\d+\.\d+)/i]
                    },
                    isHTML5: function () { return (this.version > 4); }
                },
                {
                    name: "SAFARI",
                    vendor: "Apple",
                    test: {
                        agent: [
                            /Version\/(\d+.\d+\.*\d*)\s+Safari\//i,
                            /Mac\s+OS\s+.*\s+Version\/(\d+\.\d+)/i,
                            /\s+OS\s+(\d+).*\s+like\s+Mac\s+OS\s/i
                        ]
                    },
                    isHTML5: function () { return (this.version > 4); }
                }
        ],
        _isDebug = null,
        _browser = { name: null, vendor: null, version: NaN, ie: NaN, chrome: NaN, firefox: NaN, safari: NaN, opera: NaN, isHTML5: false },
        _trclog = function () { },
        _reSpaceSplit_ = /(?:[\s\t])+/gi,
        _reTrim_ = /^\s+|\s+$/g,
        _reFunc_ = /\s*function/g,
        _reComma_ = /\s*,\*s/gi,
        _reSelectorSplit_ = /[\.\s]/gi,
	    _reCommaSplit_ = /(?:\s*,\s*)/gi,
	    _reTrcBgTest_ = /(?:%20|\s)+(scale9|title)+(?:%20|\s)*(?:\[|%5B)/i,
	    _reScale9Split_ = /\s+scale9\s*\[\s*([\d\s]+)*\]/gi,
        _reVersion_ = /(?:\s*)([\d_\.]+)/i,
        _reAndroid_ = /android/gi,
        _objWnd_ = "[object window]",
        _resAsIs_ = ["string", "object", "boolean", "number", "date"],
        _keycodes_ = {
            Backspace: 8,
            Tab: 9, Enter: 13, Shift: 16, Ctrl: 17, Alt: 18, Pause: 19, Break: 19, CapsLock: 20, Escape: 27, Esc: 27,
            PageUp: 33, PageDown: 34, End: 35, Home: 36, Left: 37, Up: 38, Right: 39, Down: 40,
            Insert: 45, Delete: 46,
            Windows: 91, LeftCommand: 91, RightCommand: 92, Properties: 93, RightClick: 93,
            NumMultiply: 106, NumAdd: 107, NumSubtract: 109, NumDecimal: 110, NumDivide: 110,
            F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123, F13: 124, F14: 125, F15: 126, F16: 127, F17: 128, F18: 129, F19: 130,
            NumLock: 144, Clear: 144, ScrollLock: 145
        },
	    _imageCache_ = {},
        _customStyles_ = new function () {
            var self = this,
                _customSelectors = null;

            this.rules = {};
            this.addRule = function (rule) {
                if (!self.rules.hasOwnProperty(rule.selectorText))
                    self.rules[rule.selectorText] = rule;
            };
            this.reset = function () {
                _customSelectors = null;
            };
            this.getCustomSelectors = function () {
                if (_customSelectors == null) {
                    _customSelectors = [];
                    Object.foreach(self.rules, function (s, p) {
                        if (p)
                            _customSelectors.push(p);
                    });
                }
                return _customSelectors;
            };
        },
	    _s9MouseEvents_ = ["mouseover", "mouseout", "mousedown", "mouseup"],
        _s9AnchorName_ = "-trc-scale9",
        _renderCount_ = 0,
        _docReady_ = false;

    //#region Internal methods
    function _log() {
        var l = [_FILELOGO_];
        _trclog.apply(trc, (arguments.length > 0 ? Array.prototype.concat.apply(l, arguments) : l));
    }

    function _trace() {
        if (_isDebug)
            _log.apply(null, Array.toArray(arguments));
    }

    function _time() {
        return (new Date()).getTime();
    }

    function _parseVersion(ver) {
        ver = ver.match(_reVersion_);
        if (ver && ver.length > 1) {
            ver = ver[1];
            if (ver)
                ver = ver.replace(/_/gi, '.').replace(/\s/gi, "");
            return ver;
        }
        return undefined;
    }

    function _Windows(ver, info) {
        this.family = "ms windows";
        this.os = "windows";
        this.device = undefined;
        this.cpu = undefined;

        if (ver) {
            ver = ver.match(_reVersion_);
            if (ver && ver.length > 0) {
                switch (parseFloat(ver[0])) {
                    case 6.3:
                        ver = "8.1";
                        break;
                    case 6.2:
                        ver = "8.0";
                        break;
                    case 6.1:
                        ver = "7.0";
                        break;
                    case 6.0:
                        ver = "vista";
                        break;
                    case 5.2:
                    case 5.1:
                        ver = "xp";
                        break;
                    case 5.0:
                        ver = "2000";
                        break;
                    case 4.0:
                        ver = "nt4";
                        break;
                }
                this.version = ver;
            }
            this.cpu = 32;
            for (var i = 0, len = info.length; i < len; i++) {
                if (info[i] && /wow64/gi.test(info[i])) {
                    this.cpu = 64;
                    break;
                }
            }
        }
    }
    
    function _Linux(info) {
        this.family = "linux";
        this.os = "linux";
        this.version = undefined;
        var reBuild = /(:?\s*)([\w\-\.\+]+)\s+.*(?:build)/i;
        for(var i=0, len=info.length, s, m; i < len; i++) {
            s = info[i];
            if (s) {
                if (_reAndroid_.test(s)) {
                    this.os = "android";
                    if (!this.version)
                        this.version = _parseVersion(s);
                    continue;
                }
                m = reBuild.exec(s);
                if (m && m.length > 2) {
                    this.device = m[2];
                    continue;
                }
                if (!this.version)
                    this.version = _parseVersion(s);
            }
        }
    }

    function _Apple(os, ver, device) {
        this.family = "mac os";
        this.os = os;
        this.version = _parseVersion(ver) || ver;
        this.device = device;
    }

    function _detectPlatform(agentString) {
        var pl = {
                device: undefined,
                os: undefined,
                version: undefined,
                cpu: undefined
            },
            info = _rePlatform.exec(agentString);
        if (info && info.length > 1) {
            pl.os = info[1];
            info = info[1].split(/\s*;\s*/);
            var match = info[0].match(/(\w)*/gi);
            if (match) {
                match = match[0].toLowerCase();
                switch (match) {
                    case "compatible":
                        for(var i=1, win = /windows/gi; i < info.length; i++) {
                            if (info[i] && win.test(info[i])) {
                                return new _Windows(info[i], info);
                            }
                        }
                        break;

                    case "windows":
                        return new _Windows(info[0], info);

                    case "linux":
                        return new _Linux(info);

                    case "android":
                        return new _Linux(info);

                    case "macintosh":
                        return new _Apple("osx", info[1], match);

                    case "ipad":
                    case "ipod":
                    case "iphone":
                        return new _Apple("ios", info[1], match);
                }
            }
        }
        return pl;
    }

    function _trim(str) {
        return str ? str.replace(_reTrim_, "") : str;
    }

    function _o2str(node) {
        return node.toString ? node.toString().toLowerCase() : null;
    }

    function _c2str(node) {
        return node.constructor ? node.constructor.toString().toLowerCase() : null;
    }

    function _isWindow(node) {
        if (node) {
            var s = _o2str(node);
            if (s == _objWnd_ || s == "[object domwindow]")
                return true;
            s = _c2str(node)
            if (s == _objWnd_ || s == "[object windowconstructor]")
                return true;
        }
        return false;
    }

    function _isFrame(node) {
        return (node && node.tagName && ["IFRAME", "FRAME"].indexOf(String.prototype.toUpperCase.call(node.tagName)) != -1);
    }

    function _commaSplit(value) {
        return value ? value.split(_reCommaSplit_) : [];
    }

    function _revSplit(value) {
        return value ? value.split(_reCommaSplit_).reverse() : [];
    }

    function _isNull(v) {
        return (v == null || typeof (v) === "undefined" || typeof (v) === "unknown") ? true : false;
    }

    function _isTrue(value) {
        return (value && ["on", "yes", "true", "1"].indexOf(value.toString().toLowerCase()) != -1);
    }

    function _errMsg(error) {
        if (error != null) {
            var et = typeof (error);
            if (et !== "undefined") {
                return (et === "string") ? error : (error.description || error.message || error.toString());
            }
        }
        return "";
    }
	
    function _showErrMsg(error) {
        if (arguments.length > 0) {
            var msg = "";
            for (var i = -1; ++i < arguments.length;) {
                msg += _errMsg(arguments[i]);
            }
            if (msg)
                alert(msg);
        }
    }	

    function _typeo(t) {
        return t === "object";
    }
    function _types(t) {
        return t === "string";
    }
    function _typen(t) {
        return t === "number";
    }
    function _typed(t) {
        return t === "date";
    }
    function _typeb(t) {
        return t === "boolean";
    }
    function _typef(t) {
        return t === "function";
    }

    function _isFunction(fn) {
        if (arguments.length > 1) {
            if (fn && typeof (fn) === "object" && typeof (arguments[1]) === "string" && arguments[1])
                fn = fn[arguments[1]];
            else
                return false;
        }
        var t = typeof (fn);
        if (_typef(t))
            return true;
        if (fn && _typeo(t)) {
            if (fn.toString) {
                if (fn.toString().match(_reFunc_) != null)
                    return true;
            }
            else {
                if (Object.prototype.toString.call(fn).match(/\s*Function\]/i) != null)
                    return true;
            }
        }
        return false;
    }

    function _invoke(o, fn) {
        return _isFunction(o, fn) ? (arguments.length < 3 ? o[fn].call(o) : o[fn].apply(o, Array.toArray(arguments[2]))) : undefined;
    }

    function _call(o, f) {
        if (o) {
            var ot = typeof (o), a = arguments, al = arguments.length;
            if (_typef(ot)) {
                if (al.length < 2)
                    return o();
                if (al < 3)
                    return o.call(this, a[1]);
                if (al < 4)
                    return o.call(this, a[1], a[2]);
                return o.apply(this, Array.prototype.slice.call(a, 3));
            }
            if (_typeo(ot) && f && _types(typeof(f))) {
                f = o[f];
                if (_isFunction(f)) {
                    if (al == 3)
                        return f.call(o, a[2]);
                    if (al == 5)
                        return f.call(o, a[2], a[3], a[4]);
                    if (al == 2)
                        return f.call(o);
                    if (al == 4)
                        return f.call(o, a[2], a[3]);
                    return f.apply(o, Array.prototype.slice.call(a, 2));
                }
            }
        }
        return undefined;
    }

    function _indexOf(arr, value) {
        if (arr && arr.length > 0) {
            for (var i = -1, len = arr.length; ++i < len;) {
                if (arr[i] == value)
                    return i;
            }
        }
        return -1;
    }

    function _resolve(o, p, args) {
        if (o) {
            var v = o[p], t = typeof (v);
            if (_indexOf(_resAsIs_, t) != -1)
                return v;
            if (t === "function")
                return v.apply(o, (!_isArray(args) ? [] : args));
        }
        return null;
    }

    function _put(o, p) {
        if (o) {
            var al = arguments.length, v = o[p], t = typeof (v);
            if (_indexOf(_resAsIs_, t) != -1 || t === "undefined") {
                o[p] = al > 2 ? arguments[2] : undefined;
                return o[p];
            }
            else {
                if (t === "function") {
                    if (al == 3)
                        return v.call(o, arguments[2]);
                    if (al == 2)
                        return v.call(o);
                    return v.call(o, Array.ptototype.slice(arguments, 2));
                }
            }
        }
        return null;
    }

    function _limit(value, min, max) {
        if (typeof (value) !== "number")
            value = parseFloat(value);
        if (isNaN(value))
            return min;
        if (typeof (min) !== "number")
            min = parseFloat(min);
        if (isNaN(min))
            throw new Error("Invalid min value");
        if (typeof (max) !== "number")
            max = parseFloat(max);
        if (isNaN(max))
            throw new Error("Invalid max value");
        return (value <= min) ? min : (value > max ? max : value);
    }

    function _toArray(a, expand) {
        switch (typeof (a)) {
            case "object":
                if (a instanceof Array)
                    return a;
                if (!a) // != null
                    break;                
                if (typeof (a.length) !== "undefined") {
                    var len = parseInt(a.length);
                    return (len < 1) ? [] : Array.prototype.slice.call(a, 0, len);
                }
                if (expand) {
                    expand = [];
                    for (var i in a) {
                        expand.push(a[i]);
                    }
                    return expand;
                }
            case "string":
            case "number":
            case "boolean":
            case "date":
            case "function":
                return [a];
        }
        return [];
    }

    function _pick(a, i, alt) {
        return (_isArray(a) && i >= 0 && i < a.length) ? a[i] : alt;
    }

    function _indexBy(array, prop, value) {
        if (array && array.length > 0) {
            for (var i = -1, len = array.length, a; ++i < len;) {
                a = array[i];
                if (a != null && typeof (a) === "object" && a[prop] == value)
                    return i;
            }
        }
        return -1;
    }

    function _lookupBy(array, prop, value) {
        var index = _indexBy(array, prop, value);
        return (index == -1) ? null : array[index];
    }

    function _append() {
        if (arguments.length < 1)
            return null;
        var dest = arguments[0];
        for (var a = 0, len = arguments.length; ++a < len;) {
            var src = arguments[a];
            if (src && src.length > 0) {
                for (var i = -1, slen = src.length; ++i < slen;) {
                    dest.push(src[i]);
                }
            }
        }
        return dest;
    }

    function _shuffle(array) {
        // While there are elements in the array
        if (_isArray(array) && array.length > 2) {
            for (var c = array.length - 1, index, temp; c != 0; c--) {
                // Pick a random index
                index = (Math.random() * c) | 0;
                if (index < 0 || index >= array.length)
                    break;
                // swap random pick with the last element
                temp = array[c];
                array[c] = array[index];
                array[index] = temp;
            }
        }
        return array;
    }

    function _arrayRTrim(a) {
        if (_isEmptyArray(a))
            return a;

        for (var i = a.length - 1; i > -1; i--) {
            if (a[i] || a[i] === 0)
                break;
        }
        return a.slice(0, i + 1);
    };

    (function () {
        try {
            //browser test
            for (var i = -1, l = _browserTest.length, b, na = navigator.userAgent, ai, al; ++i < l;) {
                b = _browserTest[i].test;
                if (b.vendor && !b.vendor.test(window.navigator.vendor))
                    continue;
                for (ai = -1, al = b.agent.length; ++ai < al;) {
                    if (b.agent[ai].test(na)) {
                        b = _browserTest[i];
                        _browser.name = b.name;
                        _browser.version = _isFunction(_browser.version) ? b.version.call(b) : parseFloat(RegExp.$1);
                        _browser.vendor = _resolve(b, "vendor");
                        _browser[b.name.toLowerCase()] = _browser.version;
                        if (b.isHTML5)
                            _browser.isHTML5 = b.isHTML5.call(_browser);
                        if (b.isDesktopMode)
                            _browser.isDesktopMode = b.isDesktopMode.call(_browser);
                        if (b.touch)
                            _browser.touch = b.touch.call(_browser);                        
                        break;
                    }
                }
                if (_browser.name)
                    break;
            }

            //Galaxy Tab3 10.1 - "Mozilla/5.0 (Linux; Android 4.2.2; GT-P5210 Build/JDQ39) AppleWebKit/537.36 (KHTML, Like Gecko) Chrome/34.0.187.114 Safari/537.36" 
            //Safari 6: "Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_4 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B350 Safari/8536.25"
            //Safari 7: "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53"
            _browser.platform = _detectPlatform(window.navigator.userAgent.toString());

            trc.Browser = _browser;

            var ct = typeof (console);
            if (ct !== "undefined" && ct != "unknown" && console != null) {
                ct = typeof (console.log);
                if (ct == "function" || ct == "object") {
                    // see http://patik.com/blog/complete-cross-browser-console-log
                    if (_browser.ie || _browser.opera) {
                        _trclog = function () {
                            try {
                                var str = "";
                                _foreach(_toArray(arguments), function (a) {
                                    if (a && typeof (a) === "object" && a.toString)
                                        str += a.toString();
                                    else
                                        str += (a == null || a === undefined) ? "" : a;
                                })
                                console.log(str);
                            }
                            catch (le) {
                            }
                        }
                    }
                    else {
                        _trclog = function () {
                            try {
                                if (arguments.length == 1 && typeof (arguments[0]) == "string")
                                    console.log.call(console, arguments[0]);
                                else
                                    console.log.apply(console, _toArray(arguments));
                            }
                            catch (le) {
                                le = null;
                            }
                        }
                    }
                }
            }
        }
        catch (err) {
            _showErrMsg(_FILELOGO_, err);
        }
        if (!trc.log)
            trc.log = _trclog;
    })();

    function _ifNull() {
        if (arguments.length > 0) {
            for (var i = 0, l = arguments.length - 1, v; i != l; i++) {
                v = arguments[i];
                if (!_isNull(v))
                    return v;
            }
            return arguments[i];
        }
        return null;
    }

    function _ensureJSON() {
        if (!JSON || !JSON.stringify)
            throw new Error(_FILELOGO_ + "requires 'JSON.stringify'.");
    }

    function _hasProperty(obj, prop) {
        return (obj) ? Object.prototype.hasOwnProperty.call(obj, prop) : false;
    }

    function _isArray(value) {
        return (typeof (value) === "object" && value && (value.constructor == Array || typeof (value.length) === "number")) ? true : false;
    }

    function _number(v, def) {
        if (typeof (v) !== "number")
            v = parseFloat(v);
        return isNaN(v) ? (arguments.length > 1 ? def : NaN) : v;
    }

    function _round(value, precision) {
        if (value) {
            var p = precision ? Math.pow(10, precision) : 1;
            return Math.round(value * p) / p;
        }
        return value;
    }

    function _evalString(v, o, args) {
        switch (typeof (v)) {
            case "string":
                return v;
            case "number":
            case "boolean":
                break;
            case "function":
                if (!o)
                    o = null;
                if (!args)
                    args = [];
                v = v.apply(o, args);
                break;
            case "undefined":
                return null;
            case "date":
                return v.toLocaleString();
        }
        return v.toString();
    }

    function _evalBoolean(v, o, args) {
        switch (typeof (v)) {
            case "undefined":
                return false;
            case "boolean":
                return v;
            case "function":
                if (!o)
                    o = null;
                if (!args)
                    args = [];
                return v.apply(o, args);
            case "date":
                return v.getTime() ? true : false;
            case "number":
                return v ? true : false;
            case "string":
                if (v)
                    return Boolean(v.toLowerCase());
                break;
        }
        return Boolean(v.toString());
    }

    function _parseBoolean(v, def) {
        var t = typeof (v);
        if (t === "boolean")
            return v;
        if (t === "string") {
            if (v)
                return (["true", "1", "yes", "on"].indexOf(v.toLowerCase()) == -1) ? false : true;
        }
        else {
            if (t === "number")
                return v ? true : false;
            else {
                if (t === "object" && v)
                    return Boolean(v.toString());
            }
        }
        if (arguments.length < 2)
            def = false;
        return def;
    }


    function _eval(root, expr, te) {
        var r = null;
        try {
            if (expr) {
                var c = expr.charAt(0);
                if (!(c == '.' || c == '[' || c == '('))
                    expr = "." + expr;
                eval("r = root" + expr);
            }
        }
        catch (err) {
            _trclog(_FILELOGO_ + "[eval] - ", expr, " >> ", _errMsg(err));
            if (te)
                throw err;
            r = null;
        }
        return r;
    }

    function _clone(value) {
        if (value != null) {
            switch (typeof (value)) {
                case "undefined":
                    return undefined;

                case "number":
                    break;

                case "string":
                    return value.substring(0);

                case "date":
                    return (new Date()).setTime(value.getTime());

                case "object":
                    if (value.clone)
                        return value.clone.call(value);
                    if (_isArray(value)) {
                        var array = [];
                        for (var i = -1, len = value.length; ++i < len;) {
                            array.push(_clone(value[i]));
                        }
                        return array;
                    }
                    else {
                        var obj = {}, p;
                        for (p in value) {
                            obj[p] = _clone(value[p]);
                        }
                        return obj;
                    }
                    break;
            }
        }
        return value;
    }

    function _merge(dest, src) {
        if (src) {

            if (dest == null || typeof (dest) === "undefined") {
                dest = src;
                return dest;
            }

            var value = null;
            for (var prop in src) {
                value = src[prop];
                if (value != null && typeof (value) === "object") {
                    if (value.prototype == Date) {
                        var time = value.getTime();
                        value = new Date();
                        time.setTime(value);
                    }
                    else {
                        dest[prop] = _merge(dest[prop], value);
                        continue;
                    }
                }
                dest[prop] = value;
            }
        }
        return dest;
    }

    function _drill(obj, path, te) {
        if (obj && path) {
            var props = path.split('.'), prop;
            for (var i = -1, len = props.length; obj && ++i < len;) {
                prop = props[i];
                if (!prop) {
                    if (te)
                        throw new Error("Invalid path '" + path + "'");
                    return null;
                }
                if (_isNull(obj[prop]))
                    break;
                obj = obj[prop];
            }
            if (i == props.length)
                return { value: obj };
        }
        return null;
    }

    function _foreach(o, f, n) {
        if (_isArray(o))
            _arrayForeach(o, f, 0);
        else {
            if (_isFunction(f)) {
                if (n) {
                    for (var i in o) {
                        if (!_isNull(o[i]))
                            if (f(o[i], i) === false)
                                break;
                    }
                }
                else {
                    for (var i in o) {
                        if (f(o[i], i) === false)
                            break;
                    }
                }
            }
        }
    }

    function _arrayForeach(a, f, i) {
        if (_isArray(a) && _isFunction(f)) {
            for (i = _number(i, 0) ; i > -1 && i < a.length;) {
                i = _ifNull(f(a[i], i), i + 1);
            }
        }
    }

    function _filter(o, f, d) {
        d = _isArray(d) ? d : [];
        if (!_isNull(o)) {
            _foreach(o, (_isFunction(f) ?
                function (v, i) {
                    if (f.call(o, v, i))
                        d.push(v);
                }
                :
                function (v, i) {
                    d.push(v);
                })
            );
        }
        return d;
    }

    function _isEmptyObject(o) {
        if (typeof (o) !== "undefined" && o != null) {
            for (var p in o) {
                if (!_isNull(o[p]))
                    return false;
            }
        }
        return true;
    }

    function _isString(s) {
        return (typeof (s) === "string");
    }

    function _isEmptyString(str) {
        return (typeof (str) === "undefined" || str == null || "" == str) ? true : false;
    }

    function _isEmptyArray(array) {
        return (!_isArray(array) || array.length == 0) ? true : false;
    }

    function _fName(func) {
        if (typeof (func) != "undefined" && typeof (func.toString) != "undefined") {
            var text = func.toString();
            var re = /\s*function\s*([\w_]+)?\s*\(/g;
            var match = re.exec(text);
            if (match)
                return String.trim(match[1]);
        }
        return null;
    }

    function _setStyle(e, p, v) {
        if (e && e.style)
            e.style[p] = _isNull(v) ? "" : v;
    }

    function _ensurePositive(val) {
        val = (typeof (val) === "number") ? val : parseInt(val);
        if (isNaN(val) || val < 0)
            throw new Error("Invalid argument");
        return val;
    }

    function _addKeyValue(bag, key, val) {
        if (_hasProperty(bag, val))
            throw new Error("Duplicate key '" + key + "'.");
        bag[key] = val;
        return val;
    }

    function _addKeyObject(bag, keyName, obj) {
        if (!_hasProperty(obj, keyName))
            throw new Error("Item " + (obj ? obj.toString() : "<null>") + " is missing key property '" + keyName + "'.");
        keyName = _resolve(obj, keyName);
        if (_isNull(keyName))
            throw new Error("Invalid key value.");
        if (_hasProperty(bag, keyName))
            throw new Error("Duplicate key '" + keyName + "'.");
        bag[keyName] = obj;
        return obj;
    }

    if (typeof (document.querySelectorAll) === "undefined") {
        (function (d, s) { d = document, s = d.createStyleSheet(); d.querySelectorAll = function (r, c, i, j, a) { a = d.all, c = [], r = r.replace(/\[for\b/gi, '[htmlFor').split(','); for (i = r.length; i--;) { s.addRule(r[i], 'k:v'); for (j = a.length; j--;) a[j].currentStyle.k && c.push(a[j]); s.removeRule(0) } return c } })();
    }

    function _setHtml(element, html) {
        if (element && typeof (element.tagName) !== "undefined" && element.tagName) {
            if (!_browser.ie)
                element.innerHTML = html;
            else {
                switch (String.toUpperCase(element.tagName)) {
                    case "SELECT":
                        var b = html.search(/<options>/i);
                        var e = html.search(/<\/options>/i);
                        if (b != -1 || e != -1) {
                            html = html.substring((b == -1 ? 0 : b + 9), e);
                        }
                        var options = html.split(/\<option\s*/gi);
                        var regExp = new RegExp();
                        regExp.compile("\\s*(selected)*\\s*(value\\s*=\\s*['\"]{1}(.[^<>'\"]*)?['\"]{1})*\\s*(selected)*\\s*>(.[^<]*)<*", "i");
                        for (var o = 0, len = options.length; ++o < len;) {
                            var option = options[o];
                            if (option) {
                                var match = regExp.exec(option);
                                if (match && match.length > 1) {
                                    var selected = match[1] ? true : false;
                                    var value = match[3];
                                    if (match[4])
                                        selected = true;
                                    var text = match[5] ? match[5] : "";
                                    option = (value == undefined) ? new Option(text) : new Option(text, value);
                                    option.selected = selected;
                                    element.options.add(option);
                                }
                            }
                        }
                        break;

                    case "TABLE":
                    case "THEAD":
                    case "TBODY":
                    case "TFOOT":
                        var div = document.createElement("DIV"), node;
                        div.innerHTML = "<table><tbody>" + html + "</tbody></table>";
                        node = div.firstChild.firstChild.firstChild;
                        while (node) {
                            element.appendChild(node.cloneNode(true));
                            node = node.nextSibling;
                        }
                        break;

                    case "TR":
                        var div = document.createElement("DIV"), cell;
                        div.innerHTML = "<table><tbody><tr>" + html + "</tr></tbody></table>";
                        cell = div.firstChild.firstChild.firstChild.firstChild;
                        while (cell) {
                            element.appendChild(cell.cloneNode(true));
                            cell = cell.nextSibling;
                        }
                        break;

                    default:
                        element.innerHTML = html;
                }
            }
        }
    }

    function _addEvent(element, evt, listener, capture) {
        if (!element || !evt || !listener)
            return false;
        if (element.addEventListener) // modern browser
            element.addEventListener(evt, listener, capture);
        else {
            if (!element.attachEvent)
                return false;
            // older IE
            evt = (evt.charAt(0) == '@') ? evt.substring(1) : "on" + evt;
            element.attachEvent(evt, listener, capture);
        }
        return true;
    }

    function _removeEvent(element, evt, listener) {
        if (!element || !evt || !listener)
            return false;
        if (element.removeEventListener)  // modern browser
            element.removeEventListener(evt, listener);
        else {
            if (!element.detachEvent)
                return false;
            // older IE
            evt = (evt.charAt(0) == '@') ? evt.substring(1) : "on" + evt;
            element.detachEvent(evt, listener);
        }
        return true;
    }

    function postMessage(target, message, origin, transfer) {
        if (target) {
            if (arguments.length < 4)
                target.postMessage(message, origin);
            else
                target.postMessage(message, origin, transfer);
        }
    }

    function acceptMessage(evt) {
        return (evt && evt.type === "message") ?
            {
                type: evt.type,
                source: evt.source,
                origin: evt.origin,
                data: (_isNull(evt.data) ? {} : evt.data)
            } : null;
    }

    function postJSONMessage(target, message, origin, transfer) {
        if (target) {
            if (typeof (message) === "object" && message) {
                _ensureJSON();
                message = JSON.stringify(message);
            }
            postMessage(target, message, origin);
        }
    }

    function acceptJSONMessage(evt) {
        if (evt && evt.type === "message") {
            var data = evt.data;
            if (data) {
                if (typeof (data) === "string") {
                    _ensureJSON();
                    try {
                        data = JSON.parse(data);
                    }
                    catch (err) {
                    }
                }
            }
            return {
                type: evt.type,
                source: evt.source,
                origin: evt.origin,
                data: data
            };
        }
        return null;
    }

    function _splitSelector(selector) {
        if (selector) {
            if (_typeo(typeof (selector)))
                return selector;
            selector = selector.split(_reSelectorSplit_);
            if (selector.length > 0) {
                var q = { tagName: null, className: null };
                if (selector[0] && selector[0] != "*")
                    q.tagName = String.toUpperCase(selector[0]);
                if (selector.length > 1)
                    q.className = selector.slice(1);
                return q;
            }
        }
        return null;
    }

    function _matchNode(node, rs) {
        if (rs.tagName && (!node.tagName || rs.tagName !== String.toUpperCase(node.tagName)))
            return null;
        if (rs.className && node.className) {
            var rc = rs.className,
                cl = _classList(node.className);
            if (rc.length > cl.length)
                return null;
            for (var i = 0, len = rc.length; i < len; i++) {
                if (_indexOf(cl, rc[i]) == -1)
                    return null;
            }
        }
        return node;
    }

    function _getChildElement(n) {
        while (n && !n.tagName) {
            n = n.nextSibling;
        }
        return n;
    }

    function _getXDPIZoom() {
        var screen = document.frames.screen;
        return screen ? (100.0 * (screen.deviceXDPI / screen.systemXDPI)).toFixed() : undefined;
    }

    function _getWindowZoom(border) {
        var screen = window;
        return (screen && screen.outerWidth && screen.innerWidth) ? _round(100.0 * ((screen.outerWidth - (border ? border : 0)) / screen.innerWidth), 0) : undefined;
    }

    function _getSVGZoom() {
        var z, svg = null, ns = "http://www.w3.org/2000/svg";
        try {
            svg = document.createElementNS(ns, "svg");
            svg.setAttribute("xmlns", ns);
            svg.setAttribute("version", "1.1");
            document.body.appendChild(svg);
            z = (100.00 * svg.currentScale).toFixed();
            document.body.removeChild(svg);
        }
        catch (e) {
            _log(e);
        }
        return z;
    }

    function _getMatchMediaZoom(precision) {
        if (!precision)
            precision = 5;
        function _searchDPPX(level, min, divisor) {
            var wmq = window.matchMedia;
            while (level >= min && !wmq("(min-resolution: " + (level / divisor) + "dppx)").matches) {
                level--;
            }
            return level;
        };
        var maxDPPX = 5.0; // Firefox 22 has 3.0 as maximum, but testing a bit greater values does not cost much
        var minDPPX = 0.1; // Firefox 22 has 0.3 as minimum, but testing a bit smaller values does not cost anything
        var divisor = 1;
        var result;
        for (var i = 0; i < precision; i++) {
            result = 10 * _searchDPPX(maxDPPX, minDPPX, divisor);
            maxDPPX = result + 9;
            minDPPX = result;
            divisor *= 10;
        }
        return (100.0 * _round(result / divisor, 1)).toFixed();
    }

    function _parseUrl(url) {
        var a, urlInfo = {};
        try {
            a = document.createElement("A");
            a.href = url;
            urlInfo = {
                protocol: a.protocol,
                host: a.host,
                hostname: a.hostname,
                port: a.port,
                pathname: a.pathname,
                queryString: a.search.substring(1),
                query: {},
                hash: a.hash
            };

            if (urlInfo.queryString) {
                var query = urlInfo.queryString.split('&'), pair, pos, name, value = null;
                for (var i = -1, len = query.length; ++i < len;) {
                    pair = query[i];
                    pos = pair.indexOf('=');
                    if (pos == -1)
                        urlInfo.query[pair] = null;
                    else
                        urlInfo.query[pair.substring(0, pos)] = unescape(pair.substring(pos + 1));
                }
            }
        }
        finally {
        }
        return urlInfo;
    };

    function _setUrlValues(url, values) {
        if (values) {
            var v, t, p, end;
            for (var n in values) {
                if (!String.isEmpty(n)) {
                    v = _resolve(values, n);
                    if (v == null) {
                        v = "";
                    }
                    else {
                        switch (typeof (v)) {
                            case "object":
                            case "date":
                                _ensureJSON();
                                v = JSON.stringify(v);
                                break;
                        }
                        v = escape(v);
                    }
                    if (url) {
                        p = url.indexOf("?" + n + "=");
                        if (p == -1)
                            p = url.indexOf("&" + n + "=");
                        if (p == -1) {
                            url += ((url.indexOf("?") == -1 ? "?" : "&") + n + "=" + v);
                        }
                        else {
                            p += (n.length + 2);
                            end = url.indexOf("&", p);
                            url = url.substring(0, p) + escape(v) + (end == -1 ? "" : url.substr(end));
                        }
                    }
                    else
                        url = ("?" + n + "=" + v);
                }
            }
        }
        return url;
    }

    function _setFormValues(form, values) {
        if (form && values) {
            var n, v, input, t;
            for (n in values) {
                if (!String.isEmpty(n)) {
                    v = _resolve(values, n);
                    if (v == null) {
                        v = "";
                    }
                    else {
                        switch (typeof (v)) {
                            case "object":
                            case "date":
                                _ensureJSON();
                                v = JSON.stringify(v);
                                break;
                        }
                    }
                    input = trc.selectFirst("#" + n, form);
                    if (!input) {
                        input = trc.selectFirst("[name=\"" + n + "\"]", form);
                        if (!input) {
                            input = document.createElement("INPUT");
                            input.id = input.name = n;
                            input.type = "hidden";
                            form.appendChild(input);
                        }
                    }
                    input.value = v;
                }
            }
        }
    }

    var _PostingForms_ = [];
    function _postForm(urlValues, formValues, form) {
        var fi = -1;
        try {
            form = form || document.forms[0];
            if (!form || form.tagName.toUpperCase() != "FORM")
                throw new Error("Invalid form element");

            fi = _PostingForms_.indexOf(form);
            if (fi == -1) {
                _PostingForms_.push(form);
                fi = (_PostingForms_.length - 1);
                if (urlValues)
                    form.action = _setUrlValues(form.action, urlValues);
                if (formValues)
                    _setFormValues(form, formValues);
                form.submit();
            }
        }
        finally {
            if (fi != -1)
                _PostingForms_.splice(fi, 1);
        }
    }

    function _newOption(value) {
        var text = "";
        if (value != null) {
            switch (typeof (value)) {
                case "string":
                    text = value;
                    break;

                case "object":
                    text = value.hasOwnProperty("text") ? value.text : (value.hasOwnProperty("title") ? value.title : value.toString());
                    value = value.hasOwnProperty("value") ? value.value : (value.hasOwnProperty("id") ? value.id : value);
                    break;

                default:
                    text = value.toString();
                    break;
            }
        }
        return new Option(text, value);
    }

    function _selectFirst(selector, start) {
        if (!start)
            start = document;
        return (start.querySelector) ? start.querySelector(selector) : Array.pick(($ ? $(selector.replace(/\:\s*(hover|active|after)+/ig, ""), start) : document.querySelectorAll(selector)), 0, null);
    }

    function _selectAll(selector, start) {
        if (start) {
            if (start.querySelectorAll)
                return start.querySelectorAll(selector);

            if (start != document && $)
                return $(selector.replace(/\:\s*(hover|active|after)+/ig, ""), start);
        }
        return document.querySelectorAll(selector);
    }

    function _formatCookie(name, value, date, days, hours, mins, noEscape) {
        if (name) {
            var expires = "";
            if (date || days || hours || mins) {
                var exDate = date ? ((typeof (date) == "string") ? new Date(date) : date) : new Date();
                if (days)
                    exDate.setTime(exDate.getTime() + (days * 86400000));
                if (hours)
                    exDate.setTime(exDate.getTime() + (hours * 3600000));
                if (mins)
                    exDate.setTime(exDate.getTime() + (mins * 60000));
                expires = "; expires=" + exDate.toUTCString();
            }
            return name + "=" + (noEscape ? value : escape("" + value)) + expires;
        }
        return null;
    }

    function _getAttr(e, attr, value) {
        return (e && attr) ? (e.getAttribute ? e.getAttribute(attr, value) : e[attr]) : null;
    }

    function _setAttr(e, attr, value) {
        if (e && attr) {
            if (arguments.length < 3)
                value = attr;
            if (e.setAttribute)
                e.setAttribute(attr, value);
            else
                e[attr] = value;
        }
    }

    function _removeAttr(e, attr) {
        if (e) {
            if (e.removeAttribute)
                e.removeAttribute(attr);
            else
                delete e[attr];
        }
    }

    function _wrapAttr(attr, value) {
        return value ? (attr + "=\"" + (value ? value : "") + "\"") : "";
    }

    function _classList(classNames) {
        return (classNames && _types(typeof (classNames))) ? classNames.split(_reSpaceSplit_) : [];
    }

    function _hasClass(e, cn) {
        return (e && cn) ? (_classList(e.className).indexOf(cn) != -1) : false;
    }

    function _addClassName(className, newClass) {
        if (newClass) {
            if (!className)
                return newClass;

            var cnList = _isArray(className) ? className : _classList(className),
                cnLen = cnList.length;

            if (!_isArray(newClass))
                newClass = _classList(newClass);
            for (var i = -1, len = newClass.length, c; ++i < len;) {
                c = newClass[i];
                if (cnList.indexOf(c) == -1)
                    cnList.push(c);
            }
            if (cnList.length != cnLen)
                className = cnList.join(" ");
        }
        return className;
    }

    function _addClass(element, addClass) {
        if (!element)
            return null;
        if (!_isEmptyString(addClass)) {
            addClass = _addClassName(element.className, addClass);
            if (element.className != addClass)
                element.className = addClass;
        }
        return element.className;
    }

    function _removeClassName(className, removeClass) {
        if (className && removeClass) {
            var cnList = _isArray(className) ? className : _classList(className),
                cnLen = cnList.length;
            if (!_isArray(removeClass))
                removeClass = _classList(removeClass);
            for (var i = 0, len = removeClass.length, ci; i < len; i++) {
                ci = cnList.indexOf(removeClass[i]);
                if (ci != -1)
                    cnList.splice(ci, 1);
            }
            if (cnList.length != cnLen) {
                className = (cnList.length < 1) ? "" : cnList.join(" ");
            }
        }
        return className;
    }

    function _removeClass(element, removeClass) {
        if (!element)
            return null;
        removeClass = _removeClassName(element.className, removeClass);
        if (element.className != removeClass)
            element.className = removeClass;
        return element.className;
    }

    function _toHtml(text) {
        if (text != null) {
            switch (typeof (text)) {
                case "string":
                    break;

                case "number":
                case "date":
                case "object":
                case "boolean":
                    text = text.toString();
                    break;
            }
            return text.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;").replace(/\r\n\r\n/gi, "<p/>").replace(/\n\n/gi, "<p/>").replace(/\r\n/gi, "<br/>").replace(/\n/gi, "<br/>").replace(/\t/gi, "&nbsp;&nbsp;&nbsp;&nbsp;");
        }
        return "";
    }

    function _tag(tag, html, cn, force) {
        if (html || force) {
            return "<" + tag + (cn ? " class=\"" + cn + "\"" : "") + ">" + (html ? html : "") + "</" + tag + ">";
        }
        return "";
    }

    function _tagStyle(tag, html, style, force) {
        if (html || style || force) {
            return "<" + tag + (style ? " style=\"" + style + "\"" : "") + ">" + (html ? html : "") + "</" + tag + ">";
        }
        return "";
    }

    function _attrOn(element, attr, on) {
        on = _parseBoolean(on, true);
        if (on)
            _setAttr(element, attr);
        else
            _removeAttr(element, attr);
        return on;
    }

    function _attrOff(element, attr, off) {
        off = _parseBoolean(off, true)
        if (off)
            _removeAttr(element, attr);
        else
            _setAttr(element, attr);
        return off;
    }

    function _enable(element, enable) {
        return _attrOff(element, "disabled", enable);
    }

    function _disable(element, disable) {
        return _attrOn(element, "disabled", disable);
    }

    function _readonly(element, readonly) {
        return _attrOn(element, "readonly", readonly);
    }

    function _isReadonly(element) {
        var ro = _getAttr(element, "readonly");
        return (_isTrue(ro) || String.toLowerCase(ro) == "readonly");
    }

    function _display(element, display) {
        if (element) {
            if (arguments.length > 1)
                display = (typeof (arguments[1]) === "string") ? arguments[1] : (arguments[1] ? "" : "none");
            else
                display = "";
            _setStyle(element, "display", display);
        }
    }

    function _getValue(element, value, reset) {
        if (element && element.tagName) {
            switch (String.toUpperCase(element.tagName)) {
                case "INPUT":
                case "TEXTAREA":
                case "SELECT":
                case "OPTION":
                case "BUTTON":
                    return _resolve(element, "value");

                case "A":
                    return element.href ? element.href : element.onclick;

                case "SPAN":
                    return _resolve(element, "textContent");

                case "IMG":
                    return _resolve(element, "src");
            }
            return _resolve(element, "innerHTML");
        }
        return null;
    }

    function _property(element, prop, value, reset) {

        if (!element || !prop)
            return (arguments.length < 3) ? null : false;

        switch (prop) {
            case "options":

                if (arguments.length < 3)
                    return _resolve(element, prop);

                if (value != null) {
                    if (typeof (value) === "object") {
                        if (reset) {
                            element.options.length = 0;
                        }
                        if (Object.isArray(value)) {
                            for (var i = -1, len = value.length; ++i < len;) {
                                element.options.add(_newOption(value[i]));
                            }
                        }
                        else {
                            for (var p in value)
                                element.options.add(_newOption(value[p]));
                        }
                    }
                    else
                        element.options.add(_newOption(value));
                }
                break;

            case "value":
                switch (String.toUpperCase(element.tagName)) {
                    case "SELECT":
                        if (arguments.length < 3)
                            return _resolve(element, prop);
                        for (var i = -1, len = element.options.length; ++i < len;) {
                            if (element.options[i].value == value) {
                                element.selectedIndex = i;
                                break;
                            }
                        }
                        return;

                    case "INPUT":
                    case "TEXTAREA":
                    case "OPTION":
                        if (arguments.length < 3)
                            return _resolve(element, prop);
                        if (value == null)
                            value = "";
                        break;

                    default:
                        if (value == null)
                            value = "";
                        prop = "innerHTML";
                        if (arguments.length < 3)
                            return _resolve(element, prop);
                        break;
                }

            default:
                var path = prop.split('.');
                if (path.length > 1) {
                    for (var i = 0; element && i < path.length - 1; i++) {
                        if (!path[i]) {
                            element = null;
                            break;
                        }
                        element = element[path[i]];
                    }
                    if (!element)
                        return (arguments.length < 3) ? null : false;
                    prop = path[path.length - 1];
                }
                if (arguments.length < 3)
                    return _resolve(element, prop);
                if (prop == "innerHTML")
                    _setHtml(element, value);
                else {
                    if (prop.charAt(0) == '@')
                        _setAttr(prop.substring(1), value);
                    else
                        element[prop] = value;
                }
                return true;
        }
    }

    function _evaluate(scope, expression) {
        return (function (model, __$e$__) {
            var __$s$__ = "";
            if (typeof (model) === "object") {
                for (var __$p$__ in model) {
                    if (__$p$__.indexOf('.') == -1 && __$p$__ != "model")
                        __$s$__ += "var " + __$p$__.replace(/\s/gi, '_') + " = model[\"" + __$p$__ + "\"];\n";
                }
            }
            __$s$__ += " __$e$__ = " + __$e$__ + ";";
            eval(__$s$__);
            return __$e$__;
        })(scope, expression);
    }
    //#endregion

    //#region Public

    //#region Data type extensions
    var _canDefine = (typeof (Object.defineProperty) !== "undefined" && (!_browser.ie || (_browser.ie && document.documentMode > 8))),
        _addMethod = (_canDefine) ?
		    function (obj, name, method) {
		        if (obj && typeof (obj[name]) === "undefined") {
		            Object.defineProperty(obj, name, {
		                enumerable: false,
		                configurable: true,
		                writable: true,
		                value: method
		            });
		        }
		    } :
		    function (obj, name, method) {
		        if (obj && typeof (obj[name]) === "undefined")
		            obj[name] = method;
		    };

    //#region "Function"
    (function (T) {
        function _find(methods, obj) {
            var f = null;
            Array.foreach(methods, function (m) {
                if (m) {
                    switch (typeof (m)) {
                        case "string":
                            if (obj && _isFunction(obj, m)) {
                                f = obj[m];
                                return -1;
                            }
                            break;

                        case "function":
                            f = m;
                            return -1;

                        case "object":
                            if (_isFunction(m)) {
                                f = m;
                                return -1;
                            }
                            break;
                    }
                }
            });
            return f;
        }
        _addMethod(T, "isFunction", _isFunction);
        _addMethod(T, "find", _find);
        _addMethod(T, "invoke", _invoke);
    })(Function);
    //#endregion

    //#region "Object"
    (function (T) {
        _addMethod(T, "isNull", _isNull);
        _addMethod(T, "ifNull", _ifNull);
        _addMethod(T, "isEmpty", _isEmptyObject);
        _addMethod(T, "isArray", _isArray);
        _addMethod(T, "isCollection", _isArray);
        // _addMethod(T.prototype, "isArray", function () { return _isArray(this); });

        _addMethod(T, "isFunction", _isFunction);
        // _addMethod(T.prototype, "isFunction", function () { return _isFunction(this); });

        _addMethod(T, "hasProperty", _hasProperty);

        _addMethod(T, "clone", _clone);
        //_addMethod(T.prototype, "clone", function () { return _clone(this); });

        _addMethod(T, "merge", _merge);

        _addMethod(T, "drill", _drill);
        //_addMethod(T.prototype, "drill", function (path, throwException) { return _drill(this, path, throwException); });

        _addMethod(T, "eval", _eval);
        _addMethod(T, "resolve", _resolve);
        _addMethod(T, "put", _put);

        _addMethod(T, "foreach", _foreach);
        _addMethod(T, "filter", _filter);

        if (!_canDefine)
            return;

        // object.watch
        if (!T.prototype.watch) {
            Object.defineProperty(T.prototype, "watch", {
                enumerable: false,
                configurable: true,
                writable: false,
                value: function (prop, handler) {
                    var oldval = this[prop], newval = oldval;
                    var getter = function () {
                        return newval;
                    };
                    var setter = function (val) {
                        oldval = newval;
                        return newval = handler.call(this, prop, oldval, val);
                    };
                    if (delete this[prop]) { // can't watch constants
                        Object.defineProperty(this, prop, {
                            get: getter,
                            set: setter,
                            enumerable: true,
                            configurable: true
                        });
                    }
                }
            });
        }

        // object.unwatch
        if (!T.prototype.unwatch) {
            Object.defineProperty(T.prototype, "unwatch", {
                enumerable: false,
                configurable: true,
                writable: false,
                value: function (prop) {
                    var val = this[prop];
                    delete this[prop]; // remove accessors
                    this[prop] = val;
                }
            });
        }
    })(Object);
    //#endregion

    //#region "String"
    (function (T) {
        function ifEmptyStr() {
            if (arguments.length > 0) {
                for (var i = 0, l = arguments.length - 1; i != l; i++) {
                    if (!_isEmptyString(arguments[i]))
                        return arguments[i];
                }
                return arguments[i];
            }
            return null;
        }
        function replace(str, f, r) {
            return str ? String.prototype.replace.call(str, f, r) : str;
        }
        function toUpper(str) {
            return str ? String.prototype.toUpperCase.call(str) : str;
        }
        function toLower(str) {
            return str ? String.prototype.toLowerCase.call(str) : str;
        }
        function starts(str, start) {
            return (str && start && str.length >= start.length && str.substring(0, start.length) == start) ? true : false;
        }
        function ends(str, end) {
            return (str && end && str.length >= end.length && str.substring(str.length - end.length) == end) ? true : false;
        }
        function capitalize(str) {
            if (str) {
                str = str.toString();
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            }
            return str;
        }
        _addMethod(T, "isString", _isString);
        _addMethod(T, "isNullOrEmpty", _isEmptyString);
        _addMethod(T, "isEmpty", _isEmptyString);

        _addMethod(T, "ifNullOrEmpty", ifEmptyStr);
        _addMethod(T, "ifEmpty", ifEmptyStr);

        _addMethod(T, "replace", replace);
        _addMethod(T, "toUpperCase", toUpper);
        _addMethod(T, "toLowerCase", toLower);

        _addMethod(T, "trim", _trim);
        _addMethod(T.prototype, "trim", function () {
            return this ? _trim(this) : null;
        });
        _addMethod(T, "startsWith", starts);
        _addMethod(T.prototype, "startsWith", function (begin) {
            return starts(this, begin);
        });
        _addMethod(T, "endsWith", ends);
        _addMethod(T.prototype, "endsWith", function (end) {
            return ends(this, end);
        });
        _addMethod(T, "capitalize", capitalize);
        _addMethod(T.prototype, "capitalize", function () {
            return capitalize(this);
        });
        _addMethod(T, "join", function (s, a) {
            return _isArray(a) ? a.join(s) : null;
        });

        _addMethod(T, "eval", _evalString);
    })(String);
    // #endregion

    //#region "Number"
    (function (T) {
        _addMethod(T, "parse", _number);
        _addMethod(T, "limit", _limit);
        _addMethod(T.prototype, "limit", function (min, max) {
            return _limit(this, min, max);
        });
        _addMethod(T, "round", _round);
        _addMethod(T.prototype, "round", function (precision) {
            return _round(this, precision);
        });
    })(Number);
    //#endregion

    //#region "Array"
    (function (T) {
        _addMethod(T, "isArray", _isArray);
        _addMethod(T, "toArray", _toArray);
        _addMethod(T, "isCollection", _isArray);
        _addMethod(T, "isNullOrEmpty", _isEmptyArray);
        _addMethod(T, "isEmpty", _isEmptyArray);
        _addMethod(T, "pick", _pick);
        _addMethod(T, "indexOf", _indexOf);
        _addMethod(T.prototype, "indexOf", function (value) {
            return _indexOf(this, value);
        });
        _addMethod(T, "indexBy", _indexBy);
        _addMethod(T, "lookupIndexBy", _indexBy);
        _addMethod(T, "lookupBy", _lookupBy);
        _addMethod(T, "append", _append);
        _addMethod(T, "filter", _filter);
        _addMethod(T, "shuffle", _shuffle);
        _addMethod(T, "foreach", _arrayForeach);
        _addMethod(T, "rtrim", _arrayRTrim);

        if (!_canDefine)
            return;

        var _overrides = ["push", "pop", "shift", "unshift", "splice", "concat", "sort", "reverse"];

        function _unwatch(array) {
            for (var i = -1, len = _overrides.length; ++i < last;) {
                (function (array, method) {
                    Object.defineProperty(array, method, {
                        enumerable: false,
                        configurable: true,
                        writable: true,
                        value: function () {
                            return Array.prototype[method].apply(this, arguments);
                        }
                    });
                })(array, _overrides[i]);
            }
            delete array["set"];
            delete array["onchange"];
            delete array["suspendOnChange"];
            delete array["resumeOnChange"];
            /*
			Object.defineProperty(array, "set", {
				enumerable: false,
				configurable: true,
				writable: false,
				value: undefined
			});
            */
        }

        function _watch(array, onchange) {
            var _onchange = onchange, _changing = false;

            function _hook(array, method, args, value) {
                if (typeof (array.onchange) === "function" && !_changing) {
                    try {
                        _changing = true;
                        array.onchange(method, args, value);
                    }
                    finally {
                        _changing = false;
                    }
                }
                return value;
            }

            Object.defineProperty(array, "onchange", {
                enumerable: false,
                configurable: true,
                get: function () {
                    return _onchange;
                },
                set: function (value) {
                    if (value)
                        _watch(this, value);
                    else {
                        _onchange = null;
                        _unwatch(this);
                    }
                }
            });

            Object.defineProperty(array, "set", {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (index, value) {
                    this[index] = value;
                    return _hook(this, this.set, arguments, value);
                }
            });

            Object.defineProperty(array, "suspendOnChange", {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function () {
                    _changing = true;
                }
            });

            Object.defineProperty(array, "resumeOnChange", {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (update) {
                    _changing = false;
                    if (update)
                        return this.splice(0, 0);
                }
            });

            for (var i = -1, len = _overrides.length; ++i < len;) {
                (function (array, method) {
                    Object.defineProperty(array, method, {
                        enumerable: false,
                        configurable: true,
                        writable: true,
                        value: function () {
                            return _hook(this, Array.prototype[method], arguments, T.prototype[method].apply(this, arguments));
                        }
                    });
                })(array, _overrides[i]);
            }
        };

        if (typeof (T.prototype.onchange) === "undefined") {
            Object.defineProperty(T.prototype, "onchange", {
                enumerable: false,
                configurable: true,
                get: function () {
                    return this.hasOwnProperty("onchange") ? this.onchange : null;
                },
                set: function (value) {
                    if (!this.hasOwnProperty("onchange")) {
                        if (value)
                            _watch(this, value);
                    }
                    else {
                        if (callback)
                            this.onchange = value;
                        else
                            _unwatch(this);
                    }
                }
            });
        }

        if (typeof (T.prototype.suspend) === "undefined") {
            Object.defineProperty(T.prototype, "suspend", {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (value) {
                    _invoke(value, "suspendOnChange");
                }
            });

            Object.defineProperty(T.prototype, "resume", {
                enumerable: false,
                configurable: true,
                writable: true,
                value: function (value, update) {
                    _invoke(value, "resumeOnChange", [update]);
                }
            });
        }
    })(Array);
    // #endregion

    //#region "Boolean"
    (function (T) {
        _addMethod(T, "parseBoolean", _parseBoolean);
        _addMethod(T, "eval", _evalBoolean);
    })(Boolean);
    //#endregion

    //#region "Date"
    (function (T) {
        function _addTime(date, ms) {
            if (ms)
                date.setTime(date.getTime() + ms);
            return date;
        }

        _addMethod(T, "addSeconds", function (date, sec) {
            return _addTime(date, (sec * 1000));
        });

        _addMethod(T, "addMinutes", function (date, mins) {
            return _addTime(date, (mins * 60000));
        });

        _addMethod(T, "addHours", function (date, hours) {
            return _addTime(date, (hours * 3600000));
        });

        _addMethod(T, "addDays", function (date, days) {
            return _addTime(date, (days * 86400000));
        });

        _addMethod(T, "now", function () {
            return new Date();
        });

        _addMethod(T, "today", function () {
            var now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        });

        _addMethod(T, "time", _time);
    })(Date);
    //#endregion
    //#endregion

    //#region TRC.xxx functions
    trc.config = new function () {
        var _this = this,
            _ss = false,
            _dd = false,
            _ed = undefined,
            _vd = 150;

        this.minify = [];

        this.debug = function () {
            if (arguments.length > 0)
                _isDebug = Boolean.parseBoolean(arguments[0], false);
            return _isDebug;
        };

        this.styleStartup = function () {
            if (arguments.length > 0)
                _ss = Boolean.parseBoolean(arguments[0], false);
            return _ss;
        };

        this.dropdowns = function () {
            if (arguments.length > 0) {
                _dd = Boolean.parseBoolean(arguments[0], false);
                if (_dd && (arguments.length < 2 || (arguments.length > 1 && arguments[1])))
                    _renderDropdowns();
            }
            return _dd;
        };

        this.eventDelay = function () {
            if (arguments.length > 0)
                _ed = _ensurePositive(arguments[0]);
            return (typeof (_ed) === "undefined") ? (_browser.firefox ? 50 : 0) : _ed;
        };
		
        this.s9Delay = function () {
            if (arguments.length > 0)
                _ed = _ensurePositive(arguments[0]);
            return (typeof (_ed) === "undefined") ? (_browser.firefox ? 50 : 0) : _ed;
        };

        this.renderViewDelay = function () {
            if (arguments.length > 0)
                _vd = _ensurePositive(arguments[0]);
            return _vd;
        };

        this.translate = function (path) {
            if (path && _this.minify.length > 0) {
                for (var min = _this.minify, i = min.length, p; --i > -1;) {
                    if (path.search(min[i]) != -1) {
                        p = path.search(/(?:\.s*html)$/i);
                        if (p == -1)
                            path += ".min";
                        else
                            path = path.substring(0, p) + ".min" + path.substring(p);
                    }
                }
            }
            return path;
        };
    };

    trc.typeb = _typeb;
    trc.typed = _typed;
    trc.typef = _typef;
    trc.typen = _typen;
    trc.typeo = _typeo;
    trc.types = _types;

    trc.call = _call;

    trc.isTrue = _isTrue;

    trc.getErrorMessage = _errMsg;
	
	trc.alertBox = _showErrMsg;

    trc.getFunctionName = _fName;

    trc.evaluate = _evaluate;

    trc.isWindow = _isWindow;

    trc.isFrame = _isFrame;

    trc.selectAll = _selectAll;
    trc.$ = _selectFirst;

    trc.selectFirst = _selectFirst;
    trc.$$ = _selectAll;

    trc.postMessage = postMessage;

    trc.acceptMessage = acceptMessage;

    trc.parseUrl = _parseUrl;

    trc.setUrlValues = _setUrlValues;

    trc.setFormValue = _setFormValues;

    trc.postForm = _postForm;

    trc.addEventListener = _addEvent;

    trc.removeEventListener = _removeEvent;

    trc.cancelEvent = function (evt) {
        if (evt) {
            evt.cancelBubble = true;
            if (evt.preventDefault)
                evt.preventDefault();
            if (evt.stopImmediatePropagation)
                evt.stopImmediatePropagation();
        }
    };

    trc.onReady = function (callback, target, eventType) {
        var _cb = callback;
        var _target = target || window;
        var _et = eventType || "load";
        var _listener = function (evt) {
            if (_cb) {
                if (this == window) {
                    if (document.readyState != "loaded" && document.readyState != "complete")
                        return;
                }
                else {
                    if (typeof (this.readyState) !== "undefined" && this.readyState != "loaded" && this.readyState != "completed")
                        return;
                }
                var cb = _cb;
                _cb = null;
                trc.removeEventListener(_target, _et, _listener);
                cb.call(_target, evt);
            }
        };
        trc.addEventListener(_target, _et, _listener, false);
    };

    (function () {
        var evtTypes = [
             "MouseMove", "MouseOver", "MouseDown", "MouseUp", "MouseOut", "Click", "DblClick",
             "KeyDown", "KeyUp", "KeyPress",
             "Focus", "Blur", "Change",
             "DragStart", "Drag", "DragOver", "DragDrop"],
            len = evtTypes.length,
            et;
        for (var i = 0; i < len; i++) {
            (function (et) {
                var etl = et.toLowerCase();
                trc["on" + et] = trc["on" + etl] = trc[etl] = function (element, listener, capture) {
                    return _addEvent(element, etl, listener, capture);
                };
            })(evtTypes[i]);
        }
    })();

    trc.isMouseRollout = function (element, evt) {
        if (element.getBoundingClientRect && evt.type == "mouseout") {
            var rect = element.getBoundingClientRect(),
				mx = (typeof (evt.x) === "undefined" ? evt.clientX : evt.x),
				my = (typeof (evt.y) === "undefined" ? evt.clientY : evt.y);
            return (mx <= rect.left || mx >= rect.right || my <= rect.top || my >= rect.bottom) ? true : false;
        }
        return true;
    };

    trc.formatCookie = _formatCookie;

    trc.setCookie = function (name, value, date, days, hours, mins) {
        value = _formatCookie(name, value, date, days, hours, mins);
        if (value != null)
            document.cookie = value;
    };

    trc.getCookie = function (cookieName, noEscape) {
        if (document.cookie) {
            var cookieList = document.cookie.split(";"), cookie, pos, name;
            for (var i = 0, len = cookieList.length; i < len; i++) {
                cookie = cookieList[i];
                if (cookie) {
                    pos = cookie.indexOf("=");
                    if (pos != -1) {
                        name = cookie.substr(0, pos).replace(/^\s+|\s+$/g, "");
                        if (cookieName == name) {
                            name = cookie.substr(pos + 1);
                            return noEscape ? name : unescape(name);
                        }
                    }
                }
            }
        }
        return null;
    };

    trc.filterFirst = function (nodes, selector) {
        if (nodes && selector) {
            selector = _splitSelector(selector);
            if (selector) {
                if (!_isArray(nodes))
                    return _matchNode(nodes, selector);
                for (var n = 0, len = nodes.length, node; n < len; n++) {
                    node = nodes[n];
                    if (node) {
                        node = _matchNode(node, selector);
                        if (node)
                            return node;
                    }
                }
            }
        }
        return null;
    };

    trc.filterAll = function (nodes, selector) {
        var result = [];
        if (!Array.isNullOrEmpty(nodes) && selector) {
            selector = _splitSelector(selector);
            if (selector) {
                for (var n = 0, len = nodes.length, node; n < len; n++) {
                    node = nodes[n];
                    if (node) {
                        node = _matchNode(node, selector);
                        if (node)
                            result.push(node);
                    }
                }
            }
        }
        return result;
    };

    trc.matchElement = function (node, selector) {
        return (node && selector) ? _matchNode(node, _splitSelector(selector)) : node;
    };

    trc.findChildElement = function (node, selector) {
        if (node && selector) {
            node = node.firstChild;
            selector = _splitSelector(selector);
            while (node) {
                if (_matchNode(node, selector))
                    return node;
                node = node.nextSibling;
            }
        }
        return null;
    };

    trc.getChildElement = _getChildElement;

    trc.getParentIndex = function (element) {
        if (element && element.parentNode) {
            if (typeof (element.sourceIndex) != "undefined") {
                return element.sourceIndex - element.parentNode.sourceIndex - 1;
            }
            else {
                for (var i = 0; (element = element.previousElementSibling) ; i++);
                return i;
            }
        }
        return -1;
    }

    trc.selectParentNode = function (element, selector) {
        if (element) {
            selector = selector ? selector.split(/[\.\s]/gi) : [];
            if (selector.length < 1)
                return element.parentNode;
            var tag = null; cn = null;
            if (selector[0] && selector[0] != "*")
                tag = selector[0].toUpperCase();
            if (selector.length > 1)
                cn = selector.slice(1);
            while (element) {
                if (tag) {
                    if (element.tagName && tag != element.tagName.toUpperCase()) {
                        element = element.parentNode;
                        continue;
                    }
                }
                if (!cn)
                    return element;
                if (element.className) {
                    var cl = _classList(element.className);
                    if (cl.length >= cn.length) {
                        var m = 0;
                        Array.foreach(cn, function (c) {
                            if (cl.indexOf(c) == -1)
                                return -1;
                            m++;
                        })
                        if (m == cn.length)
                            return element;
                    }
                }
                element = element.parentNode;
            }
        }
        return null;
    };

    trc.isParentOf = function (parent, child) {
        if (parent) {
            while (child) {
                if (child.parentNode == parent)
                    return true;
                child = child.parentNode;
            }
        }
        return false;
    };

    trc.attr = function (condition, attrbite) {
        return _parseBoolean(condition) ? attrbite : null;
    }; // useless ??

    trc.attrDisabled = function (condition) {
        return _parseBoolean(condition) ? "disabled" : null;
    }; // useless ??

    trc.attrReadonly = function (condition) {
        return _parseBoolean(condition) ? "readonly" : null;
    }; // useless ??

    trc.attrChecked = function (condition) {
        return _parseBoolean(condition) ? "checked" : null;
    }; // useless ??

    trc.setStyle = function (element, property, value) {
        if (element && property) {
            if (_isArray(element)) {
                Array.foreach(element, function (e) {
                    _setStyle(e, property, value);
                });
            }
            else {
                _setStyle(element, property, value);
            }
        }
    };

    trc.display = _display;

    trc.toHtml = _toHtml;

    trc.tag = _tag;

    trc.tagWithStyle = _tagStyle;

    trc.div = function () {
        return _tag.apply(this, Array.append(["DIV"], arguments));
    };

    trc.span = function () {
        return _tag.apply(this, Array.append(["SPAN"], arguments));
    };

    trc.getAttr = _getAttr;

    trc.setAttr = _setAttr;

    trc.removeAttr = _removeAttr;

    trc.wrapAttr = _wrapAttr;

    trc.enable = _enable;

    trc.disable = _disable;

    trc.readonly = _readonly;

    trc.isReadonly = _isReadonly;

    trc.classList = _classList;

    trc.addClassName = _addClassName;

    trc.removeClassName = _removeClassName;

    trc.hasClass = _hasClass

    trc.addClass = _addClass;

    trc.removeClass = _removeClass;

    trc.html = function (element, html) {
        if (arguments.length < 2)
            return element ? element.innerHTML : null;
        _setHtml(element, html);
    };

    trc.getValue = _getValue;
    trc.property = _property;

    trc.loadCSS = function (css, cb) {
        var heads = document.getElementsByTagName("head"), media;
        if (!heads || heads.length < 1)
            throw new Error("The document is missing required <head> element");
        
        var ct = typeof (css);
        if (ct == "function") {
            css = css();
            ct = css ? typeof (css) : null;
        }
        switch (ct) {
            case "string":
                css = {
                    url: css,
                    media: null,
                    callback: (Function.isFunction(cb) ? cb : null)
                };
                break;

            case "object":
                css = {
                    url: _resolve(css, "url"),
                    media: _resolve(css, "media"),
                    callback: _isFunction(cb) ? cb : (_isFunction(css, "callback") ? css["callback"] : null)
                }
                break;

            default:
                throw new Error("Invalid css file information.");
        }
        
        var cb = _isFunction(css.callback) ? css.callback : null;
        if (!css.callback || _browser.ie || _browser.opera) {
            var link = document.createElement("LINK");                
            _setAttr(link, "type", "text/css");
            _setAttr(link, "rel", "stylesheet");
            if (css.media)
                _setAttr(link, "media", css.media);
            function onload(evt) {
                TRC.Style.analyze();
                if (link) {
                    _removeEvent(link, "load", onload);
                    if (cb)
                        cb(true, evt);
                }
            }
            _addEvent(link, "load", onload);
            heads[0].appendChild(link);
            _setAttr(link, "href", css.url);
        }
        else {
            var start = (new Date).getTime(),
                id = css + "-" + start.toFixed(),
                style = document.createElement("STYLE");
                
            _setAttr(style, "id", id);
            _setAttr(style, "type", "text/css");
            if (css.media)
                _setAttr(style, "media", css.media);
            _setHtml(style, "@import url(\"" + css.url + "\")");
            heads[0].appendChild(style);

            function poll() {
                var sheets, ready = null;
                try {
                    sheets = document.styleSheets;
                    if (!sheets || sheets.length < 1)
                        throw new Error("");
                    for (var s = 0, l = sheets.length; s < l; s++) {
                        if (sheets[s].ownerNode.id == id && sheets[s].cssRules) {
                            TRC.Style.analyze();
                            ready = cb;
                            break;
                        }
                    }
                } catch(err) {
                    if (_time() - start < 7000)
                        window.setTimeout(poll, 50);
                    else {
                        if (cb)
                            cb(false, css, err);
                    }
                }
                if (ready)
                    ready(true, css);
            }
            setTimeout(poll, 50);
        }
    }    
    // #endregion

    // #region TRC.Style internal methods
    if (window.getComputedStyle && (!_browser.ie || _browser.ie > 9)) {
        trc.getComputedStyle = function (element, attribute) {
            var style = window.getComputedStyle(element);
            return (style && attribute) ? style.getPropertyValue(attribute) : style;
        };
    }
    else {
        trc.getComputedStyle = function (element, attribute) {
            return (element.currentStyle && attribute) ? element.currentStyle[attribute] : element.currentStyle;
            /*
	        this.el = el;
	        function getPropertyValue(prop) {
	            var re = /(\-([a-z]){1})/g;
	            if (prop == 'float') prop = 'styleFloat';
	            if (re.test(prop)) {
	                prop = prop.replace(re, function () {
	                    return arguments[2].toUpperCase();
	                });
	            }
	            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
	        }
	        return attribute ? this.getPropertyValue(attribute) : this;
            */
        };
    }

    if (!_browser.ie || _browser.ie > 9) {
        trc.getStyleProperty = function (style, prop) {
            return style ? (style.getAttribute ? style.getAttribute(prop) : (style.getPropertyValue ? style.getPropertyValue(prop) : style[prop])) : null;
        };
    }
    else {
        if (_browser.ie < 9) {
            trc.getStyleProperty = function (style, prop) {
                if (style) {
                    var _trcValue = style.getAttribute("-trc-" + prop);
                    if (_trcValue)
                        return _trcValue;
                    switch (prop) {
                        case "background-position":
                            return String.ifEmpty(style["backgroundPositionX"], "0px") + " " + String.ifEmpty(style["backgroundPositionY"], "0px");
                    }
                    return style[prop];
                }
                return null;
            };
        }
        else {
            trc.getStyleProperty = function (style, prop) {
                if (style) {
                    switch (prop) {
                        case "background-position":
                            prop = "backgroundPosition";
                            break;
                    }
                    return style[prop];
                }
                return null;
            };
        }
    }

    function _analyzeStyleSheet(sheet) {
        Array.foreach(sheet.imports, function (imp) {
            _analyzeStyleSheet(imp);
        });
        Array.foreach(sheet.rules || sheet.cssRules, function (r) {
            if (r.styleSheet) {
                _analyzeStyleSheet(r.styleSheet);
            }
            else {
                if (r.style && (_reTrcBgTest_.test(r.style.backgroundImage) || r.style["-trc-background-image"])) //|| r.style["-trc-background-position"] || r.style["-trc-background-size"]))
                    _customStyles_.addRule(r);
            }
        });
    }

    function _resize(element, top, left, width, height) {
        element.style.position = "absolute";
        if (top !== undefined && !isNaN(top))
            element.style.top = top + "px";
        if (left !== undefined && !isNaN(left))
            element.style.left = left + "px";
        if (width !== undefined && !isNaN(width) && width >= 0)
            element.style.width = width + "px";
        if (height !== undefined && !isNaN(height) && height >= 0)
            element.style.height = height + "px";
        return element;
    }

    function _createView(content, posTop, posLeft, width, height, top, left) {
        var view = document.createElement("DIV");
        view.style.position = "absolute";
        view.style.overflow = "hidden";
        view.style.textAlign = "left";
        view.style.verticalAlign = "top";
        view.style.top = posTop + "px";
        view.style.left = posLeft + "px";
        if (width >= 0)
            view.style.width = width + "px";
        if (height >= 0)
            view.style.height = height + "px";
        content.style.top = !top ? "0px" : ("" + -top + "px");
        content.style.left = !left ? "0px" : ("" + -left + "px");
        view.appendChild(content);
        return view;
    }

    function _computePosition(value, size, dimention) {
        if (typeof (value) == "number")
            return value ? value : 0;
        if (value) {
            switch (value.toLowerCase()) {
                case "left":
                case "top":
                    return 0;

                case "middle":
                case "center":
                    return (dimention - size) / 2;

                case "bottom":
                case "right":
                    return dimention - size;

                default:
                    if (value.charAt(value.length - 1) == '%') {
                        value = parseFloat(value);
                        if (!value)
                            return 0;
                        if (value == 100)
                            return dimention - size;
                        return (dimention * value / 100) - (size / 2);
                    }
                    else
                        return parseFloat(value);
            }
        }
        return 0;
    }

    function _computeSize(value, dimention) {
        if (typeof (value) == "number")
            return value ? value : 0;
        if (value) {
            switch (value.toLowerCase()) {
                case "100%":
                    return dimention;

                case "0%":
                    return 0;

                default:
                    if (value.charAt(value.length - 1) == '%') {
                        value = parseFloat(value);
                        return value ? (dimention * value / 100) : 0;
                    }
                    else
                        return parseFloat(value);
            }
        }
        return NaN;
    }

    function _renderDropdowns(start) {
        Array.foreach(TRC.selectAll("select.trc-dropdown", start), function (dd) {
            try {
                var dropdown = new TRC.Dropdown(dropdown);
                dropdown.attach();
            }
            catch (err) {
                _log(err);
            }
        });
    }

    function _renderAll(start, includeStart) {
        try {
            if (!start) {
                start = document;
                if (arguments.length < 2)
                    includeStart = true;
            }

            var customRules = _customStyles_.getCustomSelectors();
            if (customRules && customRules.length > 0) {
                if (includeStart)
                    _renderElement(start, false);
                var elements = TRC.selectAll(customRules.join(","), (_browser.ie && _browser.version < 8 ? null : start));
                Array.foreach(elements, function (e) {
                    if (e && e != start && e.tagName)
                        _renderElement(e);
                });
            }

            if (trc.config.dropdowns())
                _renderDropdowns(start);
        }
        catch (error) {
            _log(error);
            throw error;
        }
    }

    function _drawImage5(bgi) {
        var ctx = this.context,
	        cw = this.width,
	        ch = this.height,
	        img = bgi.img,
	        left = _computePosition(bgi.left, img.width, cw),
	        top = _computePosition(bgi.top, img.height, ch),
	        width = _computeSize(bgi.width, cw),
	        height = _computeSize(bgi.height, ch);

        if (!bgi.scale9) {
            if (bgi.repeat == "repeat-x") {
                var right = cw, w, h;
                if (width) {
                    right = Math.min(width, cw);
                    w = width;
                    h = height;
                }
                for (; left < right; left += img.width) {
                    ctx.drawImage(img, left, top, w, h);
                }
            }
            else if (bgi.repeat == "repeat-y") {
                for (; top < ch; top += img.height) {
                    ctx.drawImage(img, left, top);
                }
            }
            else if (bgi.repeat == "repeat") {
                // next version
            }
            else {
                ctx.drawImage(img, left, top);
            }
        }
        else {
            var s9 = {
                left: parseFloat(bgi.scale9[0]),
                top: parseFloat(bgi.scale9[1]),
                right: parseFloat(bgi.scale9[2]),
                bottom: parseFloat(bgi.scale9[3])
            };
            if (s9.right <= s9.left || s9.bottom <= s9.top)
                return;
            if (!width)
                width = cw;
            if (!height)
                height = ch;

            var leftWidth = s9.left;
            var rightWidth = img.width - s9.right;
            var topHeight = s9.top;
            var bottomHeight = img.height - s9.bottom;

            var unscaledWidth = s9.left + rightWidth;
            var unscaledHeight = s9.top + bottomHeight;
            var scaledWidth = img.width - unscaledWidth;
            var scaledHeight = img.height - unscaledHeight;

            // top left 
            if (leftWidth > 0 && topHeight > 0)
                ctx.drawImage(img, 0, 0, leftWidth, topHeight, left, top, leftWidth, topHeight);

            // top
            if (topHeight > 0)
                ctx.drawImage(img, s9.left, 0, scaledWidth, s9.top, left + s9.left, top, width - unscaledWidth, topHeight);

            // top right
            if (topHeight > 0 && rightWidth > 0)
                ctx.drawImage(img, s9.right, 0, rightWidth, s9.top, left + width - rightWidth, top, rightWidth, topHeight);

            // left <<<
            if (leftWidth > 0)
                ctx.drawImage(img, 0, topHeight, leftWidth, scaledHeight, left, top + s9.top, leftWidth, height - unscaledHeight);

            // middle <<<
            ctx.drawImage(img, s9.left, s9.top, scaledWidth, scaledHeight, left + s9.left, top + s9.top, width - unscaledWidth, height - unscaledHeight);

            // right <<<
            if (rightWidth > 0)
                ctx.drawImage(img, s9.right, s9.top, rightWidth, scaledHeight, left + width - rightWidth, top + s9.top, rightWidth, height - unscaledHeight);

            // bottom left corner
            if (leftWidth > 0 && bottomHeight > 0)
                ctx.drawImage(img, 0, s9.bottom, leftWidth, bottomHeight, left, top + height - bottomHeight, leftWidth, bottomHeight);

            // bottom
            if (bottomHeight > 0)
                ctx.drawImage(img, s9.left, s9.bottom, img.width - unscaledWidth, bottomHeight, left + s9.left, top + height - bottomHeight, width - unscaledWidth, bottomHeight);

            // bottom right corner
            if (rightWidth > 0 && bottomHeight > 0)
                ctx.drawImage(img, s9.right, s9.bottom, rightWidth, bottomHeight, left + width - rightWidth, top + height - bottomHeight, rightWidth, bottomHeight);
        }
    }

    function _drawImage4(bgi) {
        var div = this.canvas,
	        cw = this.width,
	        ch = this.height,
	        img = bgi.img,
	        left = _computePosition(bgi.left, img.width, cw),
	        top = _computePosition(bgi.top, img.height, ch),
	        width = _computeSize(bgi.width, cw),
	        height = _computeSize(bgi.height, ch);
        slice = null;

        if (bgi.scale9) {
            var s9 = {
                left: parseFloat(bgi.scale9[0]),
                top: parseFloat(bgi.scale9[1]),
                right: parseFloat(bgi.scale9[2]),
                bottom: parseFloat(bgi.scale9[3]),
                width: bgi.width ? width : this.width,
                height: bgi.height ? height : this.height
            },
            imgMiddleWidth = s9.right - s9.left,
            imgMiddleHeight = s9.bottom - s9.top;

            s9.rightWidth = img.width - s9.right;
            s9.bottomHeight = img.height - s9.bottom;
            s9.middleWidth = s9.width - s9.left - s9.rightWidth;
            s9.middleHeight = s9.height - s9.top - s9.bottomHeight;

            s9.hScale = s9.middleWidth / imgMiddleWidth;
            s9.vScale = s9.middleHeight / imgMiddleHeight;

            /* middle */
            slice = _resize(img.cloneNode(), 0, 0, img.width * s9.hScale, img.height * s9.vScale);
            div.appendChild(_createView(slice, top + s9.top, left + s9.left, s9.middleWidth, s9.middleHeight, s9.top * s9.vScale, s9.left * s9.hScale));

            /* top & bottom */
            slice = _resize(img.cloneNode(), 0, 0, img.width * s9.hScale, img.height);
            div.appendChild(_createView(slice.cloneNode(), top + 0, left + s9.left, s9.middleWidth, s9.top, 0, s9.left * s9.hScale));
            div.appendChild(_createView(slice.cloneNode(), top + s9.height - s9.bottomHeight, left + s9.left, s9.middleWidth, s9.bottomHeight, s9.bottom, s9.left * s9.hScale));

            //left & right
            slice = _resize(img.cloneNode(), 0, 0, img.width, img.height * s9.vScale);
            div.appendChild(_createView(slice.cloneNode(), top + s9.top, left + 0, s9.left, s9.middleHeight, s9.top * s9.vScale, 0));
            div.appendChild(_createView(slice.cloneNode(), top + s9.top, left + s9.width - s9.rightWidth, s9.rightWidth, s9.middleHeight, s9.top * s9.vScale, s9.right));

            // corners
            slice = _resize(img.cloneNode(), 0, 0);
            div.appendChild(_createView(slice.cloneNode(), top + 0, left + 0, s9.left, s9.top, 0, 0));
            div.appendChild(_createView(slice.cloneNode(), top + 0, left + s9.width - s9.rightWidth, s9.rightWidth, s9.top, 0, s9.right));
            div.appendChild(_createView(slice.cloneNode(), top + s9.height - s9.bottomHeight, left + 0, s9.left, s9.bottomHeight, s9.bottom, 0));
            div.appendChild(_createView(slice.cloneNode(), top + s9.height - s9.bottomHeight, left + s9.width - s9.rightWidth, s9.rightWidth, s9.bottomHeight, s9.bottom, s9.right));
        }
        else {
            if (bgi.repeat == "repeat-x") {
                var right = cw, w, h;
                if (width) {
                    right = Math.min(width, cw);
                    w = width;
                    h = height;
                }
                for (; left < right; left += img.width) {
                    slice = _resize(img.cloneNode(), top, left, w, h);
                    div.appendChild(slice);
                }
            }
            else if (bgi.repeat == "repeat-y") {

            }
            else if (bgi.repeat == "repeat") {

            }
            else {
                slice = _resize(img.cloneNode(), top, left, width, height);
                div.appendChild(slice);
            }
        }
    }

    function Scale9Anchor(element) {
        var self = this,
            _eventHandler = null;

        this.element = element;
        this.background = null;
        this.renderState = {
            idle: false,
            mouseover: false,
            mouseout: false,
            mousedown: false,
            toString: function () {
                return " idle=" + self.renderState.idle + "; " + "mouseover=" + self.renderState.mouseover + "; " + "mouseout=" + self.renderState.mouseout + "; " + "mousedown=" + self.renderState.mousedown + "; ";
            }
        };

        if (element) {
            var ca = element[_s9AnchorName_];
            if (ca != self)
                _invoke(ca, "detach");
            element[_s9AnchorName_] = self;
        }

        this.isActive = function () {
            return _eventHandler ? true : false;
        }

        function canWatchMouse() {
            return self.background ? (!self.background.hints["static"] && !self.background.hints["static-background"]) : false;
        }

        this.attach = function (background) {
            if (arguments.length > 0)
                self.background = background;

            if (!_eventHandler && self.element && canWatchMouse()) {
                delay = trc.config.s9Delay();
                if (delay > 0) {
                    _eventHandler = function (evt) {
                        if (!evt && typeof (event) !== "undefined")
                            evt = event;
                        if (evt) {
                            if (evt.type == "mouseover" && TRC.isParentOf(self.element, evt.target))
                                return;
                            setTimeout(function () {
                                _renderElement(self.element, evt);
                            }, delay);
                        }
                    }
                }
                else {
                    _eventHandler = function (evt) {
                        if (!evt && typeof (event) !== "undefined")
                            evt = event;
                        if (evt) {
                            if (evt.type == "mouseover" && TRC.isParentOf(self.element, evt.target))
                                return;
                            _renderElement(self.element, evt);
                        }
                    }
                }

                Array.foreach(_s9MouseEvents_, function (et) {
                    TRC.addEventListener(self.element, et, _eventHandler, false);
                });
            }
        };

        this.detach = function () {
            if (self.element && self.element[_s9AnchorName_] == self) {
                if (_eventHandler) {
                    Array.foreach(_s9MouseEvents_, function (et) {
                        TRC.removeEventListener(self.element, et, _eventHandler);
                    });
                    _eventHandler = null;
                }
                try {
                    _removeAttr(self.element, _s9AnchorName_);
                    // delete self.element[_s9AnchorName_];
                }
                catch (e) {
                    self.element[_s9AnchorName_] = null; // backup
                }
            }
        };

        this.isRendering = function (et) {
            if (!et)
                et = "idle";
            if (arguments.length > 1)
                self.renderState[et] = arguments[1];
            return self.renderState[et] ? true : false;
        };
    }

    function BackgroundInfo(element, images) {
        var self = this;

        this.element = element;
        this.images = images;
        this.width = parseFloat(element.clientWidth);
        this.height = parseFloat(element.clientHeight);
        this.canvas = null;
        this.hints = {};

        this.isEqual = function (bg) {
            try {
                if (bg && self.width == bg.width && self.height == bg.height && self.images.length == bg.images.length) {
                    var a, aw, ah, b, bw, bh;
                    for(var i=0, len = self.images.length; i < len; i++) {
                        a = self.images[i];
                        b = Array.pick(bg.images, i);
                        if (!b)
                            return false;
                        aw = _computeSize(a.width, self.width);
                        bw = _computeSize(b.width, bg.width);
                        if (aw != bw)
                            return false;
                        ah = _computeSize(a.height, self.height);
                        bh = _computeSize(b.height, bg.height);
                        if (ah != bh || a.src != b.src)
                            return false;

                        if (_computePosition(a.left, aw, self.width) != _computePosition(b.left, bg.bw, bg.width))
                            return false;

                        if (_computePosition(a.top, ah, self.height) != _computePosition(b.top, bg.bh, bg.height))
                            return false;

                        if (_isArray(a.scale9)) {
                            if (!_isArray(b.scale9))
                                return false;
                            if (a.scale9.length == b.scale9.length) {
                                for (var p = 0, sl = a.scale9.length; p < sl; p++) {
                                    if (a.scale9[p] != b.scale9[p])
                                        return false;
                                }
                            }
                        }
                        else {
                            if (_isArray(b.scale9))
                                return false;
                        }
                    }
                    return true;
                }
            }
            catch (err) {
                _log("BackgroundInfo.isEqual: " + TRC.getErrorMessage(err));
            }
            return false;
        };

        var _draw = null,
            _complete = null,
            _cbComplete = null,
            _canvas = document.createElement("CANVAS");

        this.isCanvas = (_canvas && _canvas.getContext) ? true : false;
        if (this.isCanvas) { // HTML5
            this.canvas = _canvas;
            this.context = _canvas.getContext("2d");
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            _draw = function (bgi) {
                _drawImage5.call(self, bgi);
            };

            _complete = function () {
                self.element.style.backgroundPosition = "0px 0px";
                self.element.style.backgroundSize = "100% 100%"
                self.element.style.backgroundRepeat = "no-repeat";
                try {
                    var dataUrl = self.canvas.toDataURL(); // "image/png"
                    dataUrl = "url(" + (dataUrl ? dataUrl : "about:blank") + ")";
                    self.element.style.backgroundImage = dataUrl;
                }
                catch (duErr) {
                    _log("dat url error: " + TRC.getErrorMessage(duErr));
                }

                if (_cbComplete)
                    _cbComplete.call(self);
            };
        }
        else {  // HTML4
            _canvas = document.createElement("DIV");
            _canvas.name = _s9AnchorName_;
            _canvas.style.position = "absolute";
            _canvas.style.display = "block";
            _canvas.style.top = "0px";
            _canvas.style.left = "0px";
            _canvas.style.width = this.width;
            _canvas.style.height = this.height;
            _canvas.style.zIndex = "0";
            _canvas.style.overflow = "hidden";
            this.canvas = _canvas;

            _draw = function (bgi) {
                _drawImage4.call(self, bgi);
            }

            _complete = function () {
                if (_canvas) {
                    if (element.firstChild)
                        element.insertBefore(_canvas, element.firstChild);
                    else
                        element.appendChild(_canvas);
                }
                if (_cbComplete)
                    _cbComplete.call(self);
            };
        }

        function _render() {
            if (!_complete)
                return;
            var readyCount = 0;
            Array.foreach(self.images, function (bgi) {
                if (bgi.state == 1) { // loaded
                    if (bgi.img) {
                        if (!_imageCache_.hasOwnProperty(bgi.img.src))
                            _imageCache_[bgi.img.src] = bgi.img;
                        _draw(bgi);
                        bgi.state = 2; // processed
                        delete bgi["img"];
                        readyCount++;
                    }
                }
                else if (bgi.state == 2) { // rendered
                    readyCount++;
                }
                else {
                    return -1; // image isn't ready yet
                }
            });
            if (self.images.length == readyCount && _complete) {
                try {
                    _complete();
                }
                finally {
                    _complete = null;
                }
            }
        };

        function _loadImage(bgi) {
            bgi.img = new Image();
            bgi.img.style.borderWidth = "0px";
            bgi.img.style.borderStyle = "none"; // ie defaults to border around an image
            TRC.addEventListener(bgi.img, "load", function (evt) {
                if (bgi && bgi.state != 1) {
                    bgi.state = 1;
                    _render();
                }
            });
            bgi.img.src = bgi.src;
        }

        this.apply = function (cb) {
            _cbComplete = cb;
            Array.foreach(self.images, function (bgi, i) {
                bgi.index = i;
                if (_imageCache_.hasOwnProperty(bgi.src)) {
                    bgi.img = _imageCache_[bgi.src];
                    bgi.state = 1;
                }
                else {
                    _loadImage(bgi);
                    if (_browser.firefox && bgi.img && bgi.img.complete)
                        bgi.state = 1;
                }
                if (bgi.state == 1)
                    _render();
            });
            _render();
        };
    }

    function _renderElement(element, evt) {

        if (!element || typeof (element.tagName) === "undefined" || !element.tagName || element == document)
            return;

        _renderCount_++;

        var log = [],
			isHTML5 = !!_browser.isHTML5,
			eventType = evt ? evt.type : "",
	        anchor = null;

        try {
            if (_isDebug)
                log.push("_renderElement(" + _renderCount_ + "," + element.tagName + "." + element.className + "," + (eventType ? eventType : "no event") + "): ");

            anchor = element[_s9AnchorName_];
            if (!anchor)
                anchor = new Scale9Anchor(element);
            else {
                if (anchor.isRendering(eventType)) {
                    if (_isDebug) {
                        log.push("ignoring; ");
                        log.push(anchor.renderState);
                        _trace.apply(self, log);
                    }
                    return;
                }
            }
            anchor.isRendering(eventType, true);

            function cleanup(container, temp) {
                try {
                    if (container && temp)
                        container.removeChild(temp);
                }
                catch (e) {

                }
                if (anchor) {
                    anchor.isRendering(eventType, false);
                    if (!anchor.isActive())
                        anchor.detach();
                    log.push(anchor.renderState);
                }
                _trace.apply(self, log);
            }

            //#region Capture current background & flush it
            var es = element.style,
				cb = {
				    image: es.backgroundImage,
				    size: es.backgroundSize,
				    repeat: es.backgroundRepeat
				};

            if (isHTML5) {
                /*
                if (_browser.ie >= 9 && anchor.background) {
                    cb.facade = element.cloneNode(false);
                    cb.facade.style.zIndex = 10000;
                    element.parentNode.appendChild(cb.facade);
                }
                */
                cb.position = es.backgroundPosition;

                es.backgroundPosition = "";
            }
            else {
                cb.child = anchor.background ? anchor.background.canvas : null;
                cb.backgroundPositionX = es.backgroundPositionX;
                cb.backgroundPositionY = es.backgroundPositionY;

                es.backgroundPositionX = "";
                es.backgroundPositionY = "";
            }
			
            es.backgroundImage = "";
            es.backgroundSize = "";
            es.backgroundRepeat = "";			
            //#endregion

            //#region Compute new background
            var style = TRC.getComputedStyle(element),
	            bgImages = TRC.getStyleProperty(style, "background-image"),
                bgScale9 = [],
                newBG = null;
			
            try {
                if (bgImages && String.prototype.toLowerCase.call(bgImages) != "none") {
                    bgImages = _revSplit(bgImages);
                    for (var i = 0, img; i < bgImages.length;) {
                        if (bgImages[i]) {
                            img = bgImages[i].replace(/url\s*\(\s*['"]*/gi, "").replace(/['"]*\s*\)/gi, "").replace(/%20/gi, " ").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
                            img = img.split(_reScale9Split_);
                            if (img.length > 0) {
                                bgImages[i++] = img[0];
                                s9 = Array.pick(img, 1, RegExp.$1);
                                if (s9)
                                    bgScale9.push(s9);
                                continue;
                            }
                        }
                        bgImages.splice(i, 1);
                    }
                }
            }
            catch (imgError) {
                _log("background-image parsing error. images: " + bgImages + " error: " + TRC.getErrorMessage(imgError));
            }

            if (bgImages.length > 0 && bgScale9.length > 0) {
                var bgRepeat = TRC.getStyleProperty(style, "background-repeat"),
                    bgPos = TRC.getStyleProperty(style, "background-position"),
                    bgSize = TRC.getStyleProperty(style, "background-size"),
                    imageInfo = [];

                try {
                    bgRepeat = _revSplit(bgRepeat);
                    bgPos = _revSplit(bgPos);
                    bgSize = _revSplit(bgSize);

                    for (var i = 0, bi, pos, size, s9; i < bgImages.length; i++) {
                        bi = {
                            src: bgImages[i],
                            top: 0,
                            left: 0,
                            state: 0
                        };
                        if (i < bgPos.length && bgPos[i]) {
                            pos = String.trim(bgPos[i]).split(_reSpaceSplit_);
                            if (pos.length > 0) {
                                bi.left = String.trim(pos[0]).toLowerCase();
                                if (pos.length > 1)
                                    bi.top = String.trim(pos[1]).toLowerCase();
                                else {
                                    if (bi.left == "center" || bi.left == "middle")
                                        bi.top = "center";
                                }
                            }
                        }
                        if (i < bgRepeat.length && bgRepeat[i]) {
                            bi.repeat = bgRepeat[i].toLowerCase();
                        }
                        if (i < bgSize.length && bgSize[i]) {
                            size = String.trim(bgSize[i]).split(_reSpaceSplit_);
                            if (size.length > 0) {
                                bi.width = (size[0] == "auto") ? "100%" : String.trim(size[0]);
                                bi.height = (size.length > 1 && size[1] != "auto") ? String.trim(size[1]) : "100%";
                            }
                        }
                        if (i < bgScale9.length && bgScale9[i]) {
                            s9 = String.trim(bgScale9[i]);
                            if (s9)
                                bi.scale9 = s9.split(_reSpaceSplit_);
                        }

                        imageInfo.push(bi);
                    }
                }
                catch (posError) {
                    _log("background parsing error. repeat: " + bgRepeat + " position: " + bgPos + " size: " + bgSize + " error: " + TRC.getErrorMessage(posError));
                }

                if (imageInfo.length > 0) {
                    newBG = new BackgroundInfo(element, imageInfo);
                    var hints = _getAttr(element, "data-trc"); 
                    if (!hints)
                        hints = _resolve(style, "background-trc");
                    if (hints) {
                        hints = hints.split(_reSpaceSplit_);
                        for (var h = 0, hl = hints.length; h < hl; h++) {
                            newBG.hints[hints[h]] = true;
                        }
                    }
                }
            }
            //#endregion

            if (_isDebug) {
                log.push(" background=");
                log.push(imageInfo);
                log.push(";");
            }

            //#region Redraw background if new
            if (newBG && !newBG.isEqual(anchor.background)) {
                if (_isDebug)
                    log.push(" updating background.");
                anchor.attach(newBG);
                newBG.apply(function () {
                    if (isHTML5)
                        cleanup();
                    else
                        cleanup(element, cb.child);
                });
            }
            else {
                if (_isDebug)
                    log.push(" no update is needed.");

                //#region Revert captured background
                es.backgroundImage = cb.image;
                es.backgroundSize = cb.size;
                es.backgroundRepeat = cb.repeat;
                if (isHTML5) {
                    es.backgroundPosition = cb.position;
                }
                else {
                    es.backgroundPositionX = cb.backgroundPositionX;
                    es.backgroundPositionY = cb.backgroundPositionY;
                }
                //#endregion
                if (isHTML5)
                    cleanup();
                else
                    cleanup(element, cb.child);
            }
            //#endregion
        }
        catch (error) {
            log.push(" error: ");
            log.push(TRC.getErrorMessage(error));
            _log.apply(self, log);
        }
    }
    //#endregion

    trc.Dictionary = function (config, data) {
        var self = this;
        this.name = "";
        this.key = "id";
        this.items = {};

        try {
            if (!_isNull(config)) {
                if (_hasProperty(config, "name"))
                    this.name = config.name;
                if (_hasProperty(config, "key"))
                    this.key = config.key;
            }

            function _getState() {
                var state = null, itemState = null;
                Object.foreach(self.items, function (item, index) {
                    if (!_isFunction(item) && _isFunction(item.getState)) {
                        itemState = item.getState.call(item);
                        if (!_isNull(itemState)) {
                            state = state || {};
                            state[index] = itemState;
                        }
                    }
                }, true);
                return state;
            }

            function _setState(state) {
                if (state) {
                    Object.foreach(self.items, function (item, index) {
                        if (!_isFunction(item) && _isFunction(item.setState) && _hasProperty(state, index)) {
                            item.setState.call(item, state[index]);
                        }
                    }, true);
                }
            }

            function _add() {
                return (argument.length > 1) ? _addKeyValue(self.items, arguments[0], arguments[1]) : _addKeyObject(self.items, self.key, arguments[0]);
            }

            function _find(key) {
                return _hasProperty(self.items, key) ? self.items[key] : null;
            }

            var base = {
                name: this.name,
                key: this.key,
                add: _add,
                find: _find,
                getState: _getState,
                setState: _setState,
                clone: function () {
                    var clone = new trc.Dictionary(self.key, config);
                    if (clone) {
                        Object.foreach(self.items, function (item, key) {
                            var clonedItem = Object.clone(item);
                            clone.items[key] = clonedItem;
                        });
                    }
                    return clone;
                }
            };

            Object.merge(this, base);
            Object.merge(this, config);

            this.name = base.name;
            this.key = base.key;
            this.base = function () {
                return base;
            };

            if (data && typeof (data) === "object") {
                var key;
                if (_isArray(data)) {
                    for (var i = 0, len = data.length, val; i < len; i++) {
                        val = data[i];
                        if (val)
                            _addKeyObject(this.items, this.key, val);
                    }
                }
                else {
                    for (key in data) {
                        _addKeyValue(this.items, key, data[key]);
                    }
                }
            }

            _invoke(this, "create");
        }
        catch (err) {
            _log("new TRC.Dictionary('" + self.name + "')", _errMsg(err));
        }
    };

    trc.List = function (config, data) {
        var self = this;
        this.name = "";
        this.key = null;
        this.items = [];

        try {
            if (!_isNull(config)) {
                if (_hasProperty(config, "name"))
                    this.name = config.name;
                if (_hasProperty(config, "key"))
                    this.key = config.key;
            }

            function _add(value, key) {
                return (arguments.length > 1) ? _addKeyValue(self.items, key, value) : (self.key ? _addKeyValue(self.items, self.key, value) : self.items.push(item));
            }

            function _find(value, key) {
                return (arguments.length > 1) ? Array.lookupBy(self.items, key, value) : (self.key ? Array.lookupBy(self.items, self.key, value) : null);
            }

            function _getState() {
                var state = self.key ? {} : [];
                var is, empty = true;
                Array.foreach(self.items, function (item, index) {
                    if (!_isNull(item) && _isFunction(item.getState) && !_parseBoolean(item.ignoreState, false)) {
                        is = item.getState.call(item);
                        if (self.key) {
                            if (!Object.isNull(is)) {
                                state[item[self.key]] = is;
                                empty = false;
                            }
                        }
                        else {
                            state[index] = is;
                            empty = false;
                        }
                    }
                });
                return empty ? null : state;
            }

            function _setState(state) {
                if (state && !_isEmptyArray(self.items)) {
                    if (_isArray(state)) {
                        Array.foreach(state, function (s, i) {
                            if (i < self.items.length)
                                _invoke(self.items[i], "setState", [s]);
                            else
                                return -1;
                        });
                    }
                    else {
                        if (!self.key)
                            throw new Error("State object of a keyless list must be defined as an array");
                        Object.foreach(state, function (s, id) {
                            _invoke(Array.lookupBy(self.items, self.key, id), "setState", [s]);
                        });
                    }
                }
            };

            var base = {
                name: this.name,
                key: this.key,
                add: _add,
                find: _find,
                getState: _getState,
                setState: _setState
            };

            Object.merge(this, base);
            Object.merge(this, config);

            this.name = base.name;
            this.key = base.key;
            this.base = function () {
                return base;
            };

            if (this.key) {
                Array.foreach(data, function (item, index) {
                    if (!item || _isEmptyString(item[self.key]))
                        throw new Error("List '" + self.name + "' element index " + index + " has invalid key '" + self.key + "'.");
                    self.items.push(item);
                });
            }
            else {
                Array.append(this.items, data);
            }

            _invoke(this, "create");
        }
        catch (err) {
            _log("new TRC.List('" + self.name + "')", _errMsg(err));
        }
    };

    trc.Logger = function (source) {
        var self = this;

        this.source = source || "";

        this.log = function () {
            var args = _toArray(arguments);
            if (self.source)
                args.unshift(self.source);
            _trclog.apply(self, args);
        }

        this.logError = function (error, popup, rethrow) {
            var msg = (error instanceof Error) ? _errMsg(error) : (_isNull(error) ? "" : error.toString());
            self.log(msg);
            if (popup)
                alert(msg);
            if (rethrow)
                throw error;
        }

        this.logMethodError = function (method, error, popup, rethrow) {
            if (error instanceof Error)
                error = _errMsg(error);
            self.logError("[" + method + "]" + error, popup, rethrow);
        }
    };

    trc.FileLoader = function (request, onComplete, onError) {
        var self = this,
            rt = typeof(request),
            loader = null,
            status = null,
            state = null,
            completed = false;

        this.url = null;
        this.contentType = undefined;
        this.onComplete = _isFunction(onComplete) ? onComplete : null;
        this.onError = _isFunction(onError) ? onError : null;
        this.content = null;

        if (request) {
            if (_typeo(rt))
                Object.merge(this, request);
            else
                if (_types(rt))
                    this.url = request;
                else
                    throw new Error("Unsupported request format");
        }
        if (!this.url)
            throw new Error("Invalid url.");

        if (this.contentType === undefined) {
            var p = this.url.lastIndexOf(".");
            if (p != -1) {
                p = this.url.substring(p + 1).toLowerCase();
                switch (p) {
                    case "png":
                    case "jpg":
                    case "jpeg":
                    case "gif":
                    case "tiff":
                    case "bmp":
                        this.contentType = "image/" + p;
                        break;

                    case "pdf":
                    case "js":
                        this.contentType = "application/" + p;
                        break;

                    case "text":
                        this.contentType = "text/plain";
                        break;

                    case "html":
                    case "shtml":
                    case "htm":
                        this.contentType = "text/html";
                        break;
                }
            }
        }

        function onReadyState() {
            state = this.readyState;            
            if (loader && state == 4 && !completed) {
                completed = true;
                status = parseInt(loader.status);
                try {							
                    switch(status) {
                        case 200: // ok
                        case 304: // from cache
                            self.content = loader.response;
                            if (self.onComplete)
                                self.onComplete.call(self, loader);
                            break;
                        
                        default:
                            if (self.onError) {
                                var err = new Error(loader.statusText);
                                err.name = self.url;
                                err.number = loader.status;
                                err.description = loader.statusText;
                                self.onError.call(self, err);
                            }
                    }
                }
                catch(err) {
                    err.name = self.url;
                    err.description = loader.statusText;
                    self.onError.call(self, err);
                }
                finally {
                    loader = null;
                }
            }
        };
        
        this.load = function(method){
            if (!self.url)
                throw new Error("Invalid url");				
            if (!method)
                method = self.method ? self.method : "GET";
            if (!loader) {
                loader = new XMLHttpRequest();
                loader.onreadystatechange = onReadyState;
            }
            loader.open(method, self.url, true);
            if (self.contentType)
                loader.setRequestHeader("Content-Type", self.contentType);
            loader.send();
        };
    };

    trc.Bundle = function(bundle, onload, onerror) {
        var self = this,
            files = [],
            loader = null,
            rt = typeof (bundle),
            onload = _typef(typeof (onload)) ? onload : null,
            onerror = _typef(typeof (onerror)) ? onerror : null;

        if (!bundle)
            throw new Error("Invalid bundle.");

        if (_typeo(rt))
            Object.merge(this, bundle);
        else
            if (_types(rt))
                this.url = bundle;
            else
                throw new Error("Unsupported bundle format");

        this.content = null;
        this.loaded = false;
        this.errors = [];

        this.findFile = function (url, type) {
            if (url) {
                var pos = url.search(/\.min$/i);
                if (pos != -1)
                    url = url.substring(0, pos);
                return Array.filter(files, (type ? function (f) { return (f.type === type && Array.indexOf(f.url, url) != -1); } : function(f) { return (Array.indexOf(f.url, url) != -1); } ) );
            }
            return null;
        };

        this.getHtmlView = function (url) {
            var html = Array.pick(self.findFile(url, "html"), 0),
                view = null;
            if (html && html.body) {
                var div = document.createElement("DIV");
                TRC.html(div, html.body);
                view = Object.resolve(div, "firstElementChild");
                if (view)
                    div.removeChild(view);
            }
            return view;
        };

        this.defineModule = function (url) {
            var js = Array.pick(self.findFile(url, "javascript"), 0);
            if (js && !js.evaluated && js.body) {
                js.evaluated = true;
                var def = js.body.replace(/\s*define\s*\(/i, "define(\"" + url + "\",");
                try {
                    eval(def);
                }
                catch (error) {
                    _showErrMsg(error, ":\r\n", def.substring(0, 200));
                }
            }
            return js;
        };

        this.load = function (cbOk, cbErr) {
            if (loader)
                loader = null;
            var url = self.url;
            if (url.search(/\.shtml$/i) == -1)
                url += ".shtml";

            loader = new trc.FileLoader(
                    url, 
                    function(loader) {
                        if (loader && loader.responseText) {
                            self.content = loader.responseText;
                            try {
                                var reEof = /<\/file\s*>/gi,
                                    reAttr = /(?:(\w*)\s*(?:=\s*["'])([\w\/\s\-\?,\.]*))/gi,
                                    parts = self.content.split(reEof),
                                    flen = parts.length,
                                    text;
                                for (var f = -1, match; ++f < flen;) {
                                    text = parts[f];
                                    if (text) {
                                        match = text.indexOf(">");
                                        if (match == -1)
                                            throw new Error("Invalid syntax: " + text.substring(0, 50));
                                        file = {
                                            type: "text",
                                            url: [],
                                            body: text.substring(match + 1)
                                        };
                                        text = text.substring(0, match);
                                        while ((match = reAttr.exec(text)) != null) {
                                            //if (m.index === reAttr.lastIndex) {
                                            //    reAttr.lastIndex++;
                                            //}
                                            if (match[1] && match[2]) {
                                                switch (String.toLowerCase(match[1])) {
                                                    case "type":
                                                        file.type = match[2];
                                                        if (file.type == "js")
                                                            file.type = "javascript";
                                                        else {
                                                            if (String.startsWith(file.type, "text/"))
                                                                file.type = file.type.substring(5);
                                                        }
                                                        break;
                                                    case "url":
                                                        file.url = _commaSplit(match[2]);
                                                        break;
                                                }
                                            }
                                        }
                                        files.push(file);
                                    }
                                }
                            }
                            catch (err) {
                                self.errors.push(err);
                            }
                        }
                        loader = null;
                        self.loaded = true;
                        if (Function.isFunction(cbOk))
                            cbOk.call(self, self.content);
                        else
                            if (Function.isFunction(onload))
                                onload.call(self, self.content);
                    },
                    function(err) {
                        loader = null;
                        self.errors.push(err);
                        if (Function.isFunction(cbErr))
                            cbErr.call(self, err);
                        if (Function.isFunction(onerror))
                            onerror.call(self, err);
                    }
                );
            loader.load();
        };

        this.register = function () {
            var config = trc.config,
                bundles = Object.resolve(config, "bundles");
            if (Array.indexOf(bundles, self) == -1)
                bundles.push(self);
            if (!self.loaded)
                bundle.load();
            return bundle;
        };
    }

    trc.Preloader = function (data) {
        var self = this,
            other = null,
            queue = [],
            requiredQueue = [];

        this.groups = [];

        _arrayForeach(data, function (g) {
            if (g) {
                switch (typeof (g)) {
                    case "string":
                        if (!other) {
                            other = { files: [] };
                            self.groups.push(other);
                        }
                        other.files.push({ src: _trim(g) });
                        break;

                    case "object":
                        if (g.files) {
                            var files = _isArray(g.files) ? g.files : _commaSplit(g.files.toString());
                            for(var i=0; i < files.length; i++)
                                files[i] = { src: _trim(files[i]) };
                            g.files = files;
                            self.groups.push(g);
                        }
                        break;
                }
            }
        });

        function removeFrom(f, from) {
            var idx = Array.indexOf(from, f);
            if (idx != -1)
                from.splice(idx, 1);
            return idx;
        }

        function _onComplete(loader) {
            if (this.file) {
                this.file.complete = true;
                removeFrom(this.file, queue);
                removeFrom(this.file, requiredQueue)
            }
        };

        function _onError(err) {
            if (this.file) {
                removeFrom(this.file, queue);
                this.file.error = err;
            }
        }

        this.getQueue = function () {
            return queue.slice(0, queue.length);
        };

        this.getRequiredQueue = function () {
            return !requiredQueue.length ? null : requiredQueue.slice(0, requiredQueue.length);
        };

        this.start = function () {
            for (var i = -1, group, root, prefix, suffix; ++i < self.groups.length;) {
                group = self.groups[i];
                root = Object.resolve(group, "root");
                if (root && !String.endsWith(root))
                    root += "/";
                prefix = Object.resolve(group, "prefix");
                if (!prefix)
                    prefix = null;
                suffix = Object.resolve(group, "suffix");
                if (!suffix)
                    suffix = null;
                for (var f = 0, file, req; f < group.files.length; f++) {
                    file = group.files[f];
                    if (file && !!!file.complete) {
                        delete file.error;
                        req = root ? root : "";
                        if (prefix)
                            req += prefix;
                        req += file.src;
                        if (suffix)
                            req += suffix;
                        req = new trc.FileLoader({ url: req, file: file }, _onComplete, _onError);
                        queue.push(file);
                        if (group.required || file.required)
                            requiredQueue.push(file);
                        req.load();
                    }
                }
            }
        };
    };

    trc.Form = {
        parseUrl: _parseUrl,
        setUrlValues: _setUrlValues,
        setFormValue: _setFormValues,
        post: _postForm
    };

    trc.Keyboard = new function () {
        var self = this;

        _merge(this, _keycodes_);

        this.isCursorKey = function (kc) {
            return ((kc > 15 && kc < 18) || (kc > 32 && kc < 41)) ? true : false;
        };

        this.isFunctionalKey = function (kc) {
            return (kc >= _keycodes_.F1 && kc <= _keycodes_.F12) ? true : false;
        };
    };

    trc.Utils = {
        browserName: _browser.name,
        browserVersion: _browser.version,
        isIE: _browser.ie ? true : false,
        isChrome: _browser.chrome ? true : false,
        isFirefox: _browser.firefox ? true : false,
        isSafari: _browser.safari ? true : false,
        isOpera: _browser.opera ? true : false,
        isHTML5: _browser.isHTML5,

        getIE: function () {
            return _browser.ie;
        },
        getChrome: function () {
            return _browser.chrome;
        },
        getFirefox: function () {
            return _browser.firefox;
        },
        getSafari: function () {
            return _browser.safari;
        },
        getOpera: function () {
            return _browser.opera;
        },
        isWindow: _isWindow,
        isFrame: _isFrame,
        toHtml: _toHtml,
        getChildElement: _getChildElement,
        getAttr: _getAttr,
        setAttr: _setAttr,
        removeAttr: _removeAttr,
        enable: _enable,
        hasClass: _hasClass,
        addClassName: _addClassName,
        removeClassName: _removeClassName,
        addClass: _addClass,
        removeClass: _removeClass,

        setInnerHTML: _setHtml,
        setInnerHtml: _setHtml,
        setProperty: function (element, prop, value, reset) {
            return _property(element, prop, value, reset);
        }
    };

    trc.Style = new function () {
        var self = this;

        this.analyze = function () {
            _customStyles_.reset();
            Array.foreach(document.styleSheets, function (sheet) {
                _analyzeStyleSheet(sheet);
            });
        };

        this.render = function (element, selector) {
            if (!arguments.length) {
                _renderAll();
            }
            else {
                var elements = null;
                if (Array.isCollection(element)) {
                    elements = element;
                }
                else {
                    if (Object.isNull(element))
                        element = document.body;
                    if (arguments.length < 2 || selector == undefined)
                        selector = true;
                    switch (selector) {
                        case true:
                        case "*":
                            _renderAll(element, true);
                            return;

                        case false:
                        case "":
                            _renderAll(element, false);
                            return;

                        default:
                            elements = TRC.selectorAll(selector, element);
                    }
                    if (element.tagName || element == document.body)
                        _renderElement(element);
                }
                Array.foreach(elements, function (e) {
                    if (e && e.tagName)
                        _renderElement(e);
                });
            }
        };

        this.renderView = function () {
            if (arguments.length < 1 || !arguments[0])
                throw new Error("Invalid arguments");
            var t = arguments.length > 1 ? _ensurePositive(arguments[1]) : trc.config.renderViewDelay();
            if (t > 0)
                setTimeout(function () { self.render(arguments[0]); }, t);
            else
                self.render(arguments[0]);
        }
    };

    //#region TRC.Dropdown
    (function () {
        var _setCurrentIndex = function (index, evt, noOnChange) {
            if (typeof (index) !== "number")
                index = parseInt(index);
            if (isNaN(index))
                index = -1;
            this.select.selectedIndex = index;

            var text = "", value = null;
            if (index > -1 && index < this.select.options.length) {
                var option = this.select.options[index];
                if (option) {
                    text = option.text;
                    value = option.value;
                }
            }
            this.input.value = text;
            this.value = this.dropdown.value = value;

            if (this.select.onchange && !noOnChange)
                this.select.onchange.call(this.select, evt);

            return this.select.selectedIndex;
        };

        function _onclick(element, evt) {
            try {
                var target = evt ? (evt.srcElement ? evt.srcElement : evt.target) : null;
                if (element) {
                    var show = null;
                    if (this.options) {
                        for (var child = this.options.firstChild; child; child = child.nextSibling) {
                            if (child == target && child.hasOwnProperty("option")) {
                                this.currentIndex(child["index"]);
                                show = "none";
                                break;
                            }
                        }
                        var os = TRC.getComputedStyle(this.options);
                        this.options.style.display = show ? show : ((!os || os.display == "" || os.display == "none") ? "block" : "none");
                    }
                }
            }
            catch (error) {
                _showErrMsg(error);
            }
        }

        function _onkeydown(input, evt) {
            try {
                if (input && evt) {
                    switch (evt.keyCode) {
                        case trc.Keyboard.Esc:
                            if (this.options.style.display == "block")
                                this.options.style.display = "none";
                            break;

                        case trc.Keyboard.Up:
                            if (this.select.selectedIndex > 0 && this.options.style.display == "block")
                                _setCurrentIndex.call(this, this.select.selectedIndex - 1, evt);
                            break;

                        case trc.Keyboard.Down:
                            if (this.options.style.display != "block")
                                this.options.style.display = "block";
                            else {
                                var idx = this.select.selectedIndex + 1;
                                if (idx < this.select.options.length)
                                    _setCurrentIndex.call(this, idx, evt);
                            }
                            break;
                    }
                }
            }
            catch (error) {
                _showErrMsg(_FILELOGO_, error);
            }
        }

        function _onblur(input, evt) {
            try {
                if (input) {
                    if (this.options.style.display == "block")
                        this.options.style.display = "none";
                }
            }
            catch (error) {
                _showErrMsg(error);
            }
        }

        TRC.Dropdown = function (select) {
            var self = this;
            this.select = select;
            this.dropdown = document.createElement("DIV");
            this.value = select.value;

            this.input = document.createElement("INPUT");
            this.input.type = "text";
            this.input.className = "text";
            var ro = select.getAttribute("readonly");
            if (ro != "false" && ro != "editable")
                this.input.readOnly = "readonly";
            this.dropdown.appendChild(this.input);

            this.button = document.createElement("INPUT");
            this.button.type = "button";
            this.button.className = "button";
            this.button.tabIndex = -1;
            this.dropdown.appendChild(this.button);

            this.options = document.createElement("DIV");
            this.options.className = "options";
            this.dropdown.appendChild(this.options);

            TRC.onClick(this.dropdown, function (evt) {
                _onclick.call(self, self.dropdown, evt);
            });

            TRC.onKeyDown(this.input, function (evt) {
                _onkeydown.call(self, self.input, evt);
            });

            TRC.onBlur(this.input, function (evt) {
                _onblur.call(self, self.input, evt);
            });

            this.currentIndex = function (index) {
                return (arguments.length == 0) ? self.select.selectedIndex : _setCurrentIndex.call(self, index);
            };

            this.attach = function () {
                try {
                    self.dropdown.className = "trc-dropdown " + self.select.className;

                    for (var i = -1, len = self.select.options.length, option, item; ++i < len;) {
                        option = self.select.options[i];
                        if (option != null) {
                            item = document.createElement("DIV");
                            item["index"] = i;
                            item["option"] = option;
                            item["value"] = option.value;
                            if (item.hasOwnProperty("innerHTML"))
                                item.innerHTML = option.text;
                            else
                                item.textContent = option.text;
                            self.options.appendChild(item);
                        }
                    }

                    _setCurrentIndex.call(self, self.select.selectedIndex, null, true);

                    var parent = self.select.parentNode;
                    if (parent) {
                        parent.replaceChild(self.dropdown, self.select);
                        self.dropdown.id = self.select.id;
                        self.select.id = null;
                        self.dropdown.name = self.select.name;
                        self.select.name = null;
                    }
                }
                finally {
                }
            };
        };
    })();

    function _initDropdowns() {
        var rules = "select.trc-dropdown {}\
div.trc-dropdown { position: absolute; top: 2px; left: 2px; display: block-inline; box-sizing: border-box; -moz-box-sizing: border-box; }\
div.trc-dropdown > input[type=text] { position: relative; top: 0px; right: 0px; height: 100% }\
div.trc-dropdown > input[type=button] { position: absolute; top: 0px; right: 0px; cursor: pointer; }\
div.trc-dropdown > div.options { position: relative; top: 4px; left: 0px; width: 100%; box-sizing: border-box; -moz-box-sizing: border-box; padding: 3px 3px 3px 3px; display: none; border:1px solid black; z-index: 99999; overflow: auto; }\
div.trc-dropdown > div.options div { position: relative; width: 100%; box-sizing: border-box; -moz-box-sizing: border-box; background-color: transparent; }\
div.trc-dropdown > div.options div:hover { background-color: #333333; color: white; cursor: pointer; }";
        var dds = document.createElement("STYLE");
        dds.type = "text/css";
        if (typeof (dds.styleSheet) !== "undefined")
            dds.styleSheet.cssText = rules;
        else
            dds.appendChild(document.createTextNode(rules));
        var heads = document.getElementsByTagName("head");
        if (heads.length > 0)
            heads[0].appendChild(dds);
    }
    //#endregion
    
    //#region Browser-dependent methods
    if (_browser.ie) {
        if (_browser.ie < 10) {
            trc.acceptMessage = acceptJSONMessage; // before IE10 all messages (message data) must be posted and accepted as JSON string
            if (_browser.ie > 8) { // ie9
                trc.postMessage = postJSONMessage;
            }
            else {
                // why setTimeout in IE8 - http://blogs.msdn.com/b/ieinternals/archive/2009/09/16/bugs-in-ie8-support-for-html5-postmessage-sessionstorage-and-localstorage.aspx
                trc.postMessage = function (t, m, o) {
                    var args = [t, m, o];
                    setTimeout(function () {
                        postJSONMessage.apply(trc, args);
                    }, 0);
                };
            }
        }
        trc.getZoom = _getXDPIZoom;
        trc.zoom = _getXDPIZoom();
    }
    else {
        if (_browser.chrome || _browser.safari) {
            trc.zoom = _getWindowZoom(15);
            trc.getZoom = function () {
                return _getWindowZoom(15);
            }
        }
        else {
            if (_browser.firefox) {
                trc.zoom = _getMatchMediaZoom();
                trc.getZoom = function () {
                    return _getMatchMediaZoom();
                };
            }
            else {
                if (_browser.opera) {
                    trc.zoom = _getWindowZoom(18);
                    trc.getZoom = function () {
                        return _getWindowZoom(18);
                    }
                }
            }
        }
    }
    //#endregion

    //#endregion

    //#region Startup
    (function () {
        var reTrcJs = /(?:trc(?:\.min){0,1}\.js)$/i,
            bundles = [],
            head = null,
            scripts = null,
            dataMain = null;

        function startupError(err) {
            _log(err);
            _showErrMsg(_FILELOGO_, err);
        }

        try {
            //#region Parse data-config
            function _parseConfig(config) {
                if (config.charAt(0) != "{")
                    config = "{" + config + "}";
                _trace(config);
                eval("config=" + config);
                for (var p in config) {
                    if (typeof (trc.config[p]) === "function")
                        trc.config[p].call(trc.config[p], config[p]);
                    else
                        trc.config[p] = config[p];
                }
                config = trc.config;

                //#region determine TRC.language
                if (config.language) {
                    var lang = null;
                    switch (typeof config.language) {
                        case "string":
                            lang = new RegExp(config.language, "gi");
                            break;

                        case "object":
                            lang = config.language;
                            break;
                    }
                    if (lang instanceof RegExp) {
                        lang = lang.exec(window.location.href);
                        if (lang && lang.length > 1)
                            trc.language = lang[1].toLowerCase();
                    }
                }
                //#endregion

                //#region minify
                if (config.minify) {
                    var minify = String.isString(minify) ? _commaSplit(minify) : config.minify;
                    config.minify = [];
                    if (!Array.isEmpty(minify)) {
                        for (var s = minify.length, m; --s > -1;) {
                            m = minify[s];
                            if (m) {
                                if (String.isString(m))
                                    m = new RegExp(m.replace(/\*/gi, ".*"), "i");
                                else
                                    if (!(m instanceof RegExp))
                                        continue;
                                config.minify.push(m);
                            }
                        }
                    }
                }
                //#endregion

                //#region bundles
                Array.foreach(Object.resolve(config, "bundles"), function(b) {
                    bundles.push(new trc.Bundle(b));
                });
                config.bundles = bundles;
                bundles = []; // reset for bundle loading
                //#endregion

                if (!_isEmptyArray(config.preload)) {
                    config.preloader = new trc.Preloader(config.preload);
                    config.preloader.start();
                }
            }

            function __javascript__(head, js) {
                var script = null;
                if (head && js) {
                    var script = document.createElement("SCRIPT"), av;
                    _setAttr(script, "type", "text/javascript");
                    if (typeof (js) === "object") {
                        for (var a in js) {
                            if (a != "src") {
                                av = js[a];
                                if (_typeo(typeof (av)))
                                    av = JSON.stringify(av);
                                _setAttr(script, a, av);
                            }
                        }
                        js = js["src"];
                    }
                    _setAttr(script, "src", js);
                    head.appendChild(script);
                }
                return script;
            }

            for (var scripts = document.getElementsByTagName("SCRIPT"), i = scripts.length, script; --i > -1;) {
                script = scripts[i];
                if (script && reTrcJs.test(script.src)) {
                    script = _trim(script.getAttribute("data-config"));
                    if (script)
                        _parseConfig(script);
                    break;
                }
            }
            //#endregion

            //#region Load bundles
            function onBundle() {
                var i = bundles.indexOf(this);
                if (i != -1)
                    bundles.splice(i, 1);
            }
            Array.foreach(trc.config.bundles, function (b) {
                if (b && !b.loaded) {
                    bundles.push(b);
                    b.load(onBundle, function (err) {
                        err = "Bundle '" + b.url + "' " + err.number + " - " + err.description;
                        startupError(err);
                    });
                }
            });
            //#endregion

            //#region Launch sequence
            scripts = _isEmptyArray(trc.config.scripts) ? null : trc.config.scripts;

            if (scripts) {
                head = document.getElementsByTagName("HEAD");
                if (head.length > 0)
                    head = head[head.length - 1];
                else {
                    head = document.createElement("HEAD");
                    document.appendChild(head);
                }

                if (scripts) {
                    for (var i = -1, len = scripts.length, script; ++i < len;) {
                        script = _resolve(scripts, i);
                        if (_hasProperty(script, "data-main"))
                            dataMain = script;
                        else
                            __javascript__(head, script);
                    }
                }

                if (!dataMain && trc.config.app) {
                    trc.config.path = _merge(trc.config.path || {}, { app: trc.config.app });
                    dataMain = {
                        src: (_resolve(trc.config, "requirejs") || "/scripts/require.js"),
                        "data-main": (_resolve(trc.config, "main") || "/scripts/trc/trc.main")
                    };
                }
            }

            (function() {
                function launch() {
                    var preloader = trc.config.preloader;
                    if (!bundles.length && (!preloader || (preloader && !preloader.getRequiredQueue()))) {
                        var startup = trc.config["startup"];
                        if (startup) {
                            switch (typeof (startup)) {
                                case "function":
                                    startup = startup();
                                    break;

                                case "string":
                                    eval("startup = (function(){" + startup + "})();");
                                    break;

                                default:
                                    startup = true;
                            }
                        }
                        if (startup !== false)
                            __javascript__(head, dataMain);
                    }
                    else
                        setTimeout(launch, 25);
                }
                launch();
            })();
            //#endregion

            trc.onReady(function () {
                try {
                    _docReady_ = true;

                    if (_browser.opera || _browser.chrome || _browser.safari)
                        trc.getZoom = _getSVGZoom;

                    trc.Style.analyze();

                    if (trc.config.dropdowns())
                        _initDropdowns();

                    if (trc.config.styleStartup())
                        _renderAll();
                }
                catch (err) {
                    _log(err);
                }
            });
        }
        catch (err) {
            startupError(err);
        }
    })();
    //#endregion

})(TRC);
