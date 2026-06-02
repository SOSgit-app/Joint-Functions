// v1.9 | 07/28/2015 | Copyright (c) 2013-2015 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
(function () {
    var _FILE_ = "trc.main.js",
        _VERSION_ = 1.9;

	(function () {
	    function wrongTRC() {
	        throw new Error(_FILE_ + " requires trc.js v1.9 or higher.");
	    }
	    if (typeof (TRC) !== "object" || !TRC || parseFloat(TRC.version) < 1.9)
	        wrongTRC();
	})();

	try {		

	    function _reportError(error, exit) {
            error = TRC.getErrorMessage(error);
            alert(_FILE_ + ": Application startup error: " + error);
            if (exit)
                window.close();
	    }

	    function _toArray(a) {
	        return Array.apply(null, a);
	    }

	    function _defineFromBundle(bundles, mod) {
	        for (var i = bundles.length, b; --i > -1;) {
	            b = bundles[i];
	            if ((b instanceof TRC.Bundle) && b.loaded && b.defineModule(mod))
	                return true;
	        }
	        return false;
	    }

	    var paths = {
                "scripts": "../scripts"
                , "jquery": "../jquery-1.11.0.min"
			    , "jqueryui": "../jquery-ui-1.10.3.custom.min"
                , "text": "../text"
                , "durandal": "../durandal"
                , "plugins": "../durandal/plugins"
                , "transitions": "../durandal/transitions"
                , "knockout": "../knockout-3.4.0"
                , 'touchPunch': "../jquery.ui.touch-punch"
                , "trc": "."
                , "assets": "../../assets"
                , "client": "../../client"
                , "data": "../../client/data"
                , "components": "../../components"
                , "content": "../../content"
                , "playbook": '../../components/playbook'
               
                //, "app": "../../client/app" - perhaps forcing developer to specify the app file manually is a better way
            },
            path = Object.resolve(TRC.config, "path");

        if (TRC.language)
            paths.content += "/" + TRC.language;

        if (path) {
            if (typeof window[path] === "function")
                path = window[path].call(TRC.config, paths);
            if (path) {
                switch (typeof path) {
                    case "object":
                        Object.merge(paths, path);
                        break;

                    case "string":
                        paths.app = path;
                        break;
                }
            }
        }

        var reqConfig = { paths: paths };
        if (TRC.config && TRC.config.debug) {
            reqConfig.urlArgs = "dev=" + Date.now();
        }
        requirejs.config(reqConfig);

        if (!paths.app)
            throw new Error("<script src='trc.js' data-config='path: {}>' is missing 'app' path.");


        if (typeof (define) === "function") {
            var origDefine = define,
                origRequire = require;
            
            define = function() {
                var config = TRC.config,
                    alen = arguments.length,
                    deps = (alen == 2 ? arguments[0] : (alen == 3 ? arguments[1] : null));                    
                if (Array.isArray(deps) && deps.length > 0 && (config.minify.length > 0 || config.bundles.length > 0)) {
                    for (var i = -1, dlen = deps.length; ++i < dlen;) {
                        deps[i] = config.translate(deps[i]);
                        _defineFromBundle(config.bundles, deps[i]);
                    }
                }                
                return origDefine.apply(this, _toArray(arguments));
            }

            for (var p in origDefine) {
                define[p] = origDefine[p];
            }

            require = function () {
                var config = TRC.config;
                if (arguments.length > 0 && config.minify.length > 0) {
                    var mods = arguments[0];
                    if (Array.isArray(mods)) {
                        for (var i = mods.length; --i > -1;)
                            mods[i] = config.translate(mods[i]);
                    }
                    else {
                        mods = config.translate(mods);
                    }
                }
                return origRequire.apply(this, _toArray(arguments));
            }
            for (var p in origRequire) {
                require[p] = origRequire[p];
            }
        }

        define(["durandal/system", "durandal/app", "durandal/viewLocator", "app"], function (system, environment, viewLocator, app) {

            if (!system)
                throw new Error("Failed to load Durandal/System module.")

            if (!environment)
                throw new Error("Failed to load Durandal/Environment module.");

            if (!app)
                throw new Error("Failed to load Application module.");

            if (Function.isFunction(system.acquire)) {
                var origAcquire = system.acquire;

                system.acquire = function () {
                    var modules,
                        first = arguments[0],
                        arrayRequest = false,
                        slice = Array.prototype.slice;

                    if (system.isArray(first)) {
                        modules = first;
                        arrayRequest = true;
                    } else {
                        modules = slice.call(arguments, 0);
                    }

                    return system.defer(function (dfd) {

                        var bundles = TRC.config.bundles;
                        if (bundles.length > 0) {
                            Array.foreach(modules, function (mod) {
                                _defineFromBundle(bundles, mod);
                            });
                        }

                        require(modules, function () {
                            var args = arguments;
                            setTimeout(function () {
                                if (args.length > 1 || arrayRequest) {
                                    dfd.resolve(slice.call(args, 0));
                                } else {
                                    dfd.resolve(args[0]);
                                }
                            }, 1);
                        }, function (err) {
                            dfd.reject(err);
                        });
                    }).promise();
                };
            }            

            environment.title = null;
            app.config = TRC.config;

            //hijack viewLocator.convertModuleIdToViewId to strim ".min" suffix from module id -> "file" view id 
            viewLocator.useConvention();

            if (Function.isFunction(viewLocator.convertModuleIdToViewId)) {
                var origM2V = viewLocator.convertModuleIdToViewId;
                viewLocator.convertModuleIdToViewId = function (moduleId) {
                    var pos = moduleId.search(/(?:\.min)$/i);
                    if (pos != -1)
                        moduleId = moduleId.substring(0, pos);
                    return origM2V(moduleId);
                };
            }

            // hijack ViewLocator.locateView to utilze TRC.Bundle mechanizm
            if (Function.isFunction(viewLocator.locateView)) {
                var origLocator = viewLocator.locateView;
                viewLocator.locateView = function (viewOrUrlOrId, area, elementsToSearch) {
                    if (TRC.types(typeof (viewOrUrlOrId))) {
                        for (var bundles = TRC.config.bundles, i = bundles.length, b; --i > -1;) {
                            b = bundles[i];
                            if (b instanceof TRC.Bundle) {
                                b = b.getHtmlView(viewOrUrlOrId);
                                if (b) {
                                    viewOrUrlOrId = b;
                                    break;
                                }
                            }
                        }
                    }
                    return origLocator(viewOrUrlOrId, area, elementsToSearch);
                };
            }

            environment.start().then(function () {
                try {
                    TRC.call(app, "start", environment);
                }
                catch (error) {
                    _reportError(error, true);
                }
            });
        });
    }
    catch (error) {
        _reportError(error, true);
        return false;
    }
})();
