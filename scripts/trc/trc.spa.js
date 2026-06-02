// v1.8 | 06/04/2014 | Copyright (c) 2013,2014 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
define(["knockout"],
function (ko) {

    var _FILE_ = "trc.spa.js",
        _VERSION_ = 1.8;
    
    (function () {
        function wrongTRC() {
            throw new Error(_FILE_ + " requires trc.js v1.8 or higher.");
        }
        if (typeof (TRC) == "undefined" || !TRC)
            wrongTRC();
        var ver = (typeof (TRC.version) != "undefined") ? parseFloat(TRC.version) : 0;
        if (!ver || ver < 1.8)
            wrongTRC();
    })();

    function toArray(a) {
        return Array.apply(null, a);
    }

    function startup(app, dm) {
        if (dm) {
            var sm;
            for (var m in dm) {
                sm = dm[m];
                if (!TRC.typef(typeof(sm)))
                    TRC.call(sm, "startup", app);
            }
        }
    }

    function classApplication(config) {
        var self = this,
            launchTimer = 0,
            launchStartTime = 0,
            launchExpirationTime = 0,
            strTryAgain = "\n\nPlease wait one minute and try again.",
            log = new TRC.Logger("Application: ");

        this.title = null;
        this.shell = null; // injected by shell
        this.shellModuleId = null;
        this.shellTransition = null;
        this.isShellReady = false;
        this.launchDuration = 20; // seconds
        this.launchPulse = 200; // ms
        this.callbacks = {};

        function startLaunchSequence() {
            launchStartTime = (new Date()).getTime(); // in ms
            launchExpirationTime = launchStartTime + (self.launchDuration * 1000) + 1; // in ms
            continueLaunchSequence();
        }

        function clearLaunchSequence() {
            if (launchTimer) {
                clearTimeout(launchTimer);
                launchTimer = 0;
            }
        }

        function continueLaunchSequence() {
            launchTimer = setTimeout(checkLaunchState, Number.parse(self.launchPulse, 200));
        }
        
        function checkLaunchState() {
            try {
                clearLaunchSequence();
                if (Object.resolve(self, "launchSequence") === true) {
                    self.launch.call(self);
                }
                else {
                    if ((new Date()).getTime() < launchExpirationTime) {
                        continueLaunchSequence();
                    }
                    else {
                        if (Function.isFunction(self, "launchAborted")) {
                            log.log("launch aborted.");
                            self.launchAborted.call(self, {
                                shell: self.isShellReady
                            });
                        }
                        else {
                            var msg = "couldn't launch on time.";
                            log.log(msg);
                            throw new Error("Application " + msg + strTryAgain);
                        }
                    }
                }
            }
            catch (error) {
                alert(TRC.getErrorMessage(error));
                window.close();
            }
        }

        function _start(environment) {
            log.log("is starting...");
            self.environment = environment;
            if (self.shellModuleId)
                self.environment.setRoot(self.shellModuleId, self.shellTransition); //  || "entrance"
            log.log("started.");

            if (Function.isFunction(self.launch)) {
                try {
                    clearLaunchSequence();
                    log.log("is launching...");
                    if (typeof (self.launchSequence) !== "undefined")
                        startLaunchSequence(true);
                    else {
                        log.log("launched.");
                        self.launch.call(self);
                    }
                }
                catch (error) {
                    clearLaunchSequence();
                    alert(TRC.getErrorMessage(error));
                    window.close();
                    return;
                }
            }
        }

        function _launchSequence() {
            return Object.resolve(self, "isShellReady");
        }

        var nextCallbackId = 0;
        function registerCallback(callback, thiz) {
            if (typeof (callback) !== "function")
                return null;
            var ar = (arguments.length > 2) ? (!!arguments[2]) : false,
                id = ++nextCallbackId,
                scope = thiz || self;
            self.callbacks[id] = function (evt) {
                try {
                    callback.call(scope, evt);
                    // perhaps add callback cleanup
                    if (ar) {
                        try {
                            delete self.callbacks[id];
                        }
                        catch (e) {
                        }
                    }
                }
                catch (error) {
                    alert(TRC.getErrorMessage(error));
                    throw error;
                }
            };
            return "window.application.callbacks[" + id + "]";
        }

        function deleteCallback(callback) {
            if (self.callbacks && callback) {
                var t = typeof (callback);
                if (t === "string") {
                    if (/window.application.callbacks\[(\d)+\]/gi.test(callback)) {
                        eval("delete " + callback);
                    }
                }
                else {
                    if (t === "function") {
                        for (var id in self.callbacks) {
                            if (self.callbacks[id] === callback) {
                                delete self.callbacks[id];
                                break;
                            }
                        }
                    }
                }
            }
        }

        this.launchSequence = _launchSequence;
        this.registerCallback = registerCallback;
        this.deleteCallback = deleteCallback;

        Object.merge(this, config);

        this.base = {
            start: _start,
            launchSequence: _launchSequence,
            registerCallback: registerCallback,
            deleteCallback: deleteCallback
        };

        this.start = _start;

        window.application = this;
        if (this.title)
            window.document.title = this.title;

        if (this.dataModel) {
            if (!this.dataModel.startup)
                this.dataModel.startup = function () {
                    startup(self, self.dataModel);
                };
            if (Boolean.parseBoolean(this["dataModelStartup"], true))
                this.dataModel.startup.call(this.dataModel);
        };
    }

    function async(action) {
        return $.Deferred(action).promise();
    }

    var _nextViewId = 0;
    function ViewInfo(shell, modal, view, parameters) {
        var self = this;
        this.shell = shell;
        this.modal = !!modal;
        this.view = view;
        this.parameters = parameters;
        this.id = ++_nextViewId;
        this.closing = false;

        var vmap = shell.resolveViewMap(view);
        this.moduleId = vmap ? Object.resolve(vmap, "moduleId") : view;
        if (!this.moduleId)
            throw new Error("Invalid moduleId for view " + (Object.isNull(view) ? "<null>" : view.toString()));

        var config = window.application.config;
        if (config)
            this.moduleId = config.translate(this.moduleId);
    }

    function closeViewInfo(vi) {
        if (vi && (vi instanceof ViewInfo) && !vi.closing) {
            vi.closing = true;

            var stack = vi.modal ? vi.shell.modalStack : vi.shell.viewStack,
                index = stack ? stack().indexOf(vi) : -1;
            if (index == -1)
                return false;

            var ctrl = vi.controller;
            if (ctrl) {
                if (typeof (ctrl.canClose) === "function" && !Boolean.parseBoolean(ctrl.canClose.call(ctrl), true))
                    return false;
                ctrl = null;
                delete vi["controller"];
            }
            stack.splice(index, 1);

            if (arguments.length < 2 || arguments[1] == true) {
                if (vi.modal) {
                    var se = vi.shell.elements;
                    if (vi.shell.modalStack().length < 1)
                        TRC.setStyle(se.modalStack, "display", "none");
                    else {
                        if (se.dialogBlanket) {
                            var zMax = 0, z = -1, dialogs = TRC.selectAll("div", se.modalStack);
                            Array.foreach(dialogs, function (d) {
                                if (d && d != se.dialogBlanket) {
                                    z = Number.parse(d.style.zIndex, 0);
                                    if (z > zMax)
                                        zMax = z;
                                }
                            });
                            if (zMax > 0)
                                TRC.setStyle(se.dialogBlanket, "zIndex", zMax - 1);
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }

    function classShell(config) {
        if (!window.application)
            throw new Error("The Shell requires instance of the trc.application object.");

        var self = this,
            logger = new TRC.Logger("shell: "),
            vzMaxIndex = 0,
            dzMaxIndex = 0;

        this.app = window.application;
        this.app.shell = this;
        this.viewMap = null;
        this.viewStack = ko.observableArray([]);
        this.modalStack = ko.observableArray([]);
        this.elements = {};

        function trace() {
            logger.log.apply(log, toArray(arguments));
        }

        function logMethod() {
            logger.logMethodError.apply(log, toArray(arguments));
        }

        function mapShell(view, parent, context) {
            var e = self.elements || {};
            e.view = view;
            if (view) {
                e.viewStack = TRC.selectFirst("div.view-stack", view);
                e.modalStack = TRC.selectFirst("div.modal-stack", view);
            }
        }

        function activateShell() {
            var result;
            try {
                if (Function.isFunction(self.activateShell))
                    result = self.activateShell.apply(self, toArray(arguments));
            }
            catch (err) {
                logMethod("activateShell", err);
                result = false;
            }
            return result;
        }

        function bindShell(view, parent, context) {
            var result, args = [view, parent, context];
            try {
                mapShell.call(self, args);
                if (Function.isFunction(self.mapShell) && self.mapShell != mapShell)
                    self.mapShell.apply(self, args);
                if (Function.isFunction(self.bindShell))
                    result = self.bindShell.apply(self, args);
            }
            catch (err) {
                logMethod("bindShell", err);
                result = false;
            }
            return result;
        }

        function attachShell(view, parent, context) {
            var result;
            try {
                if (Function.isFunction(self.attachShell))
                    result = self.attachShell.apply(self, [view, parent, context]);
            }
            catch (err) {
                logMethod("attachShell", err);
                result = false;
            }
            return result;
        }

        function completeShell(view, parent, context) {
            try {
                if (self.app)
                    self.app.isShellReady = true;
                var result = Function.isFunction(self.completeShell) ? self.completeShell.apply(self, [view, parent, context]) : true;
                if (view && TRC.Style && Boolean.parseBoolean(result, true))
                    TRC.Style.renderView(view);
            }
            catch (error) {
                logMethod("completeShell", error);
            }
        }

        function resolveViewMap(view, prop) {
            if (view && self.viewMap) {
                view = Object.resolve(self.viewMap, view);
                return (view && arguments.length > 1) ? Object.resolve(view, prop) : view;
            }
            return view;
        }

        function openView(view, parameters) {
            if (view) {
                view = new ViewInfo(self, false, view, parameters);
                self.viewStack.push(view);
                return view;
            }
            return null;
        }

        function openModalView(view, parameters) {
            if (view) {
                view = new ViewInfo(self, true, view, parameters);
                self.modalStack.push(view);
                return view;
            }
        }

        function closeStack(stack) {
            if (Array.isArray(stack)) {
                for (var i = stack.length - 1, v; i > -1; i--) {
                    if (!closeViewInfo(stack[i], (i == 0)))
                        return false;
                }
                return true;
            }
            return false;
        }

        function closeThese(filter, stack) {
            if (filter instanceof ViewInfo)
                return closeViewInfo(filter);

            var allDone = true;
            Array.foreach((Array.isArray(filter) ? filter : [filter]), function (v) {
                if (v) {
                    switch (typeof (v)) {
                        case "object":
                            allDone = closeViewInfo(v);
                            break;

                        case "number":
                            if (stack)
                                allDone = closeViewInfo(Array.lookupBy(stack, "id", v));
                            break;

                        case "string":
                            if (stack) {
                                for (var i = stack.length - 1, mid = v.toLowerCase(); i > -1 && allDone; i--) {
                                    v = stack[i];
                                    if ((v instanceof ViewInfo) && String.toLowerCase(v.moduleId) == mid) {
                                        allDone = closeViewInfo(v);
                                    }
                                }
                            }
                            break;
                    }
                }
                if (!allDone || stack.length < 1)
                    return -1;
            });
            return allDone;
        }


        function closeView(view) {
            return (view instanceof ViewInfo) ? closeViewInfo(view) : false;
        }

        function closeViews(modal, filter) {
            var stack = modal ? self.modalStack() : self.viewStack();
            return filter ? closeThese(filter, stack) : closeStack(stack);
        }

        function viewComposed(view, stage, context) {
            try {
                if (context && (context.activationData instanceof ViewInfo)) {
                    if (context.activationData.modal) {
                        var blanket = self.elements.dialogBlanket;
                        if (!blanket) {
                            blanket = document.createElement("DIV");
                            blanket.style.position = "absolute";
                            blanket.style.display = "block;"
                            blanket.style.top = "0px";
                            blanket.style.left = "0px";
                            blanket.style.width = "100%";
                            blanket.style.height = "100%";
                            blanket.className = "stack-blanket";
                            self.elements.modalStack.appendChild(blanket);
                            self.elements.dialogBlanket = blanket;

                            TRC.onDragOver(blanket, function (evt) {
                                TRC.cancelEvent(evt); // allow drop
                            });

                        }
                        TRC.setStyle(blanket, "zIndex", ++dzMaxIndex);
                        TRC.setStyle(view, "zIndex", ++dzMaxIndex);
                        TRC.setStyle(self.elements.modalStack, "display", "block");
                    }
                    else {
                        if (view) {
                            if (self.viewStack().length > 1 && vzMaxIndex)
                                view.style.zIndex = ++vzMaxIndex;
                            else
                                vzMaxIndex = 0;
                        }
                    }
                }
            }
            catch (error) {
                logMethod("onViewComposed", error);
            }
        }

        function bringToFront(vi) {
            if (vi && (vi instanceof ViewInfo) && !vi.closing && vi.controller.view) {
                var stack = self.viewStack(),
                    index = stack ? stack.indexOf(vi) : -1;
                if (index != -1) {
                    if (stack.length > 1) {
                        var z = 0;
                        Array.foreach(stack, function (v) {
                            if (v != vi && v.controller && v.controller.view) {
                                z = Number.parse(v.controller.view.style.zIndex, 0);
                                if (z > vzMaxIndex)
                                    vzMaxIndex = z;
                            }
                        });
                        z = parseInt(vi.controller.view.style.zIndex);
                        if (!z || vzMaxIndex > z)
                            vi.controller.view.style.zIndex = ++vzMaxIndex;
                    }
                    return true;
                }
            }
            return false;
        }

        //#region infrastructure methods
        this.onViewComposed = viewComposed;
        //#endregion


        this.trace = trace;
        this.logMethodError = logMethod;
        this.resolveViewMap = resolveViewMap;
        // shell's pipeline
        this.activate = activateShell;
        this.mapShell = mapShell;
        this.bindingComplete = bindShell;
        this.attached = attachShell;
        this.compositionComplete = completeShell;

        // view methods
        this.openView = openView;
        this.openModalView = openModalView;
        this.closeView = closeView;
        this.closeViews = closeViews;
        this.bringToFront = bringToFront;

        Object.merge(this, config);

        var viewMap = this.viewMap;
        Object.foreach(viewMap, function (v, i) {
            if (typeof (v) === "string" && i !== "__moduleId__") {
                viewMap[i] = {
                    moduleId: v
                };
            }
        }, true);

        if (!window.openView)
            window.openView = this.openView;

        if (!window.openModalView)
            window.openModalView = this.openModalView;

        if (!window.closeView)
            window.closeView = this.closeView;

        if (!window.closeViews)
            window.closeViews = this.closeViews;

        this.base = {
            activateShell: activateShell,
            mapShell: mapShell,
            bindShell: bindShell,
            attachShell: attachShell,
            completeShell: completeShell,
            resolveViewMap: resolveViewMap,
            onViewComposed: viewComposed,
            openView: openView,
            openModalView: openModalView,
            closeView: closeView,
            closeViews: closeViews
        };
    }

    function classDataModel(app, model, connection) {
        var self = this;
        this.app = app;

        this.models = {
        };

        this.variables = {
        };

        this.connection = connection || {};

        Object.foreach(model, function (value, name) {
            self.models[name] = value.data;
            self.variables[name] = {
                read: value.read
            };
            if (value.hasOwnProperty("write"))
                self.variables[name] = value.write;
        });

        this.startup = function () {
            startup(self.app, self.models);
        };

        this.load = function (onLoad, onError) {
            var request = {
                models: [],
                variables: []
            };

            var model = null, readVar;
            for (var m in self.models) {
                modelVars = self.variables[m];
                if (modelVars && modelVars.read) {
                    request.models.push(m);
                    request.variables.push(modelVars.read);
                }
            }

            if (request.variables.length < 1) {
                onLoad(request);
            }
            else {
                self.connection.loadVariables(request.variables,
                    function (result) {
                        if (result) {
                            Array.foreach(result.Values, function (value, index) {
                                model = Array.pick(request.models, index);
                                if (model) {
                                    model = self.models[model];
                                    if (model) {
                                        var value = Array.pick(result.Values, index);
                                        if (value) {
                                            value = JSON.parse(value);
                                            if (Function.isFunction(model.setState))
                                                model.setState.call(model, value);
                                        }
                                    }
                                }
                            });
                        }
                        if (onLoad)
                            onLoad(request);
                    },
                    onError);
            }
        }
    }

    //this method doesn't create new instance but rather attaches trc view interface 
    function createView(instance, fileName) {
        var self = instance,
            errorAlert = (arguments.length > 2 ? arguments[2] : true);

        self.log = new TRC.Logger((fileName ? fileName : self.__moduleId__) + ": ");
        self.view = null; // becoming obsolete. use self.selements.view instead
        self.parent = null;
        self.elements = {};
        self.resolved = {};

        self.trace = function (msg) {
            self.log.log(msg);
        }

        self.logMethodError = function (method, err) {
            self.log.logMethodError(method, err);
        }

        self.getViewInfo = function () {
            return null;
        };

        self.getParameters = function () {
            self.resolved = self.resolved || {};
            if (!self.resolved.hasOwnProperty('__parameters__'))
                self.resolved.__parameters__ = Object.resolve(self.getViewInfo(), "parameters");
            return self.resolved.__parameters__;
        };

        self.resolve = function (src, propName, resolveAs) {
            if (src) {
                src = Array.isArray(src) ? src : [src];
                if (arguments.length < 3)
                    resolveAs = propName;
                for (var i = 0, v; i < src.length; i++) {
                    v = src[i];
                    if (v && typeof (v[propName]) !== "undefined") {
                        try {
                            delete self.resolved[resolveAs];
                        }
                        catch (e) {
                        }
                        v = Object.resolve(v, propName);
                        if (Object.isNull(v) || String.isEmpty(v))
                            return null;
                        self.resolved[resolveAs] = v;
                        return v;
                    }
                }
            }
            return null;
        }

        function activate() {
            var result;
            try {
                if (arguments[0] instanceof ViewInfo) {
                    var vi = arguments[0];
                    vi.controller = self;
                    self.getViewInfo = function () {
                        return vi;
                    };
                }
                else {
                    self.trace("Warning: View activationData isn't type of ViewInfo.");
                    self.resolved.__parameters__ = Object.resolve(arguments[0], "parameters");
                }
                self.parent = Object.resolve(arguments[0], "parent");

                if (Function.isFunction(self.activateView)) {
                    var args = toArray(arguments);
                    args.push(self.getParameters());
                    result = self.activateView.apply(self, args);
                }
            }
            catch (err) {
                self.logMethodError("activateView", err);
                if (errorAlert)
                    alert(TRC.getErrorMessage(err));
                result = false;
            }
            return result;
        }

        function premapView(view, parent, context) {
            if (arguments.length > 0) {
                self.elements = self.elements || {};
                if (self.view != view)
                    self.view = view;
                if (self.elements.view != view)
                    self.elements.view = view;
                self.elements.content = TRC.selectFirst("DIV.trc-pbce.content", view);
            }
        }

        function bindingComplete(view, parent, context) {
            var result;
            try {
                if (arguments.length > 0) {
                    self.view = view;
                    if (view) {
                        var vi = self.getViewInfo();
                        if (vi && !vi.modal) {
                            TRC.onClick(view, function (evt) {
                                self.bringToFront.call(self);
                            });
                        }
                        var attr = TRC.getAttr(view, "data-trc");
                        if (attr && String.toLowerCase(attr).indexOf("movable") != -1) {
                            var header = TRC.$(".title", view);
                            if (header) {
                                var mdX = 0, mdY = 0, moving = false, cursor;
                                TRC.onMouseDown(header, function (evt) {
                                    if (evt && evt.target) {
                                        mdY = evt.target.offsetTop + evt.offsetY;
                                        mdX = evt.target.offsetLeft + evt.offsetX;
                                        cursor = header.style.cursor;
                                        header.style.cursor = "move";
                                        moving = true;
                                    }
                                }, true);
                                TRC.onMouseMove(view, function (evt) {
                                    try {
                                        if (moving) {
                                            var top = view.offsetTop + (evt.offsetY - mdY);
                                            var left = view.offsetLeft + (evt.offsetX - mdX);
                                            if (top > 0 || left > 0) {
                                                view.style.top = top + "px";
                                                view.style.left = left + "px";
                                            }
                                        }
                                    }
                                    catch (err) {
                                    }
                                });
                                TRC.onMouseUp(header, function () {
                                    if (moving) {
                                        moving = false;
                                        header.style.cursor = cursor;
                                    }
                                });
                                TRC.onMouseUp(view, function () {
                                    if (moving) {
                                        moving = false;
                                        header.style.cursor = cursor;
                                    }
                                });
                            }
                        }
                    }
                }
                premapView(view, parent, context);

                TRC.call(self, "mapView", self.view, parent, context);

                result = TRC.call(self, "bindView", view, parent, context);
            }
            catch (err) {
                self.logMethodError("bindView", err);
                if (errorAlert)
                    alert(TRC.getErrorMessage(err));
                result = false;
            }
            return result;
        }

        function attached(view, parent, context) {
            var result;
            try {
                if (Function.isFunction(self.attachView))
                    result = self.attachView.apply(self, [view, parent, context]);
            }
            catch (err) {
                self.logMethodError("attachView", err);
                if (errorAlert)
                    alert(TRC.getErrorMessage(err));
                result = false;
            }
            return result;
        }

        function compositionComplete(view, parent, context) {
            var result;
            try {
                if (Function.isFunction(self.completeView))
                    result = self.completeView.apply(self, [view, parent, context]);
                setTimeout(function () { self.resolved = {}; }, 3000); // flash "resolved" cache after 5 seconds.
                if ((typeof (result) === "undefined" || result) && typeof (TRC.Style) !== "undefined")
                    TRC.Style.render(arguments[0]);
            }
            catch (err) {
                self.logMethodError("completeView", err);
                if (errorAlert)
                    alert(TRC.getErrorMessage(err));
                result = false;
            }
            return result;
        }

        function canClose() {
            var result;
            try {
                result = TRC.call(self, "canCloseView");
            }
            catch (err) {
                self.logMethodError("canCloseView", err);
                result = false;
            }
            return result;
        }

        function close() {
            var result;
            try {
                result = closeViewInfo(self.getViewInfo());
            }
            catch (err) {
                self.logMethodError("close", err);
                if (errorAlert)
                    alert(TRC.getErrorMessage(err));
                result = false;
            }
            return result;
        }

        function bringToFront() {
            var vi = self.getViewInfo();
            if (vi && vi.shell && typeof (vi.shell.bringToFront) === "function")
                vi.shell.bringToFront(vi);
        };

        self.activate = activate;
        self.bindingComplete = bindingComplete;
        self.attached = attached;
        self.compositionComplete = compositionComplete;
        self.canClose = canClose;
        self.close = close;
        self.bringToFront = bringToFront;

        self.base = {
            activateView: activate,
            mapView: premapView,
            bindView: bindingComplete,
            attachView: attached,
            completeView: compositionComplete,
            canCloseView: canClose,
            close: close,
            bringToFront: bringToFront
        };

        return self;
    }

    return new function () {
        this.Application = classApplication;
        this.Shell = classShell;
        this.CreateView = createView;
        this.DataModel = classDataModel;
        this.startup = startup;
    };
});
