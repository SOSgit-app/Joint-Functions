// v1.8 | 05/05/2014 | Copyright (c) 2013,2014 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
(function (scope) {
    var _FILE_ = "trc.data-context.js",
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

	function _selectAll(root, selector) {
		var selected = root.querySelectorAll(selector);
		var result = [];
		for (var i = -1; ++i < selected.length;) {
			result.push(selected[i]);
		}
		return result;
	};

	function _selectLevel(root, includeRoot) {
		var result = [],
			query = _selectAll(root, "[data-context]");
			
		if (includeRoot) {
			var value = root.getAttribute("data-context");
			if (value)
				result.push(root);
		}

		if (query.length > 0) {
			var repeaters = _selectAll(root, "[data-context~='$foreach:']");
			if (repeaters.length > 0) {
				for (var i = -1, len = query.length, e, p; ++i < query.length;) {
					e = query[i];
					p = e.parentElement;
					while (p && p != root) {
						if (repeaters.indexOf(p) != -1) {
							e = null;
							break;
						}
						p = p.parentElement;
					}
					if (e)
						result.push(e);
				}
			}
			else
				result.push.apply(result, query);
		}
		return result;
	};

	function _ClassUrl(url) {
		this.url = url;
	};

	function _ClassBinding(type, expression, handler1, handler2, handler3, eventType) {
		this.type = type;
		this.expression = expression;
		this.eventType = eventType || 'change';
		this.before = null;
		this.instead = null;
		this.after = null;
		this.updating = false;

		for (var i = 2; i < arguments.length; i++) {
			var arg = arguments[i];
			switch (typeof (arg)) {
				case "string":
					if (arg)
						this.eventType = arg;
					break;

				case "object":
					if (!Object.isFunction(arg))
						break;

				case "function":
					var fn = TRC.getFunctionName(arg);
					switch (fn) {
						case "before":
						case "instead":
						case "after":
							this[fn] = arg;
							break;
					}
					break;
			}
		}
	};

	function _isBinding(value) {
	    return (value && typeof (value) === "object" && value.constructor == _ClassBinding) ? true : false;
	};

	function _ClassTemplate(html) {
	    this.html = html;
	    var re = /(@@\w+)/gi, replace = [], match;
	    while (match = re.exec(html)) {
	        if (replace.indexOf(match[0]) == -1)
	            replace.push(match[0]);
	    }
	    if (replace.length > 0)
	        this.replace = replace;
	};

	function _ClassDC(context, element, dataContext) {
	    
		if (!dataContext)
	        dataContext = element.getAttribute("data-context");
	    if (!dataContext)
	        return null;

	    function url(u) {
	        return new _ClassUrl(u);
	    }
	    function set(expr, h1, h2, h3, evt) {
	        return new _ClassBinding(false, expr, h1, h2, h3, evt); //element -> model: expression, handler1, handler2, handler3, eventType
	    }
	    function get(expr, h1, h2, h3, evt) { // just a draft, do nto use it yet!!!
	        return new _ClassBinding(false, expr, h1, h2, h3, evt); //model -> element: expression, handler1, handler2, handler3, eventType
	    }
	    function bind(expr, h1, h2, h3, evt) {
	        return new _ClassBinding(true, expr, h1, h2, h3, evt);  //element <-> model: expression, handler1, handler2, handler3
	    }
		
	    var $context = context;
	    var model = context.model;
		var $view = context.view;
		var $controller = context.controller;
	    var $parent = null;
		var $index = context.hasOwnProperty("$index") ? context.$index : null;
		
	    var _override = element["data-context$override"];
	    if (_override) {
	        delete element["data-context$override"];
	        $parent = _override["parent"];
	        if (_override.hasOwnProperty("model"))
	            model = _override["model"];
	        if (_override.hasOwnProperty("$index"))
	            $index = _override["$index"];
	    }

	    var dc = null;
	    eval("dc = {" + dataContext + "};"); // $context: $context, $model: model, $view: $view, $controller: $controller, $parent: $parent, 

	    for (var p in dc) {
	        if (p.charAt(0) != '$') {
	            if (_isBinding(dc[p]))
	                dc[p].dc = dc;
	        }
	    }

	    // dc.$dataContext = dataContext;
	    Object.defineProperty(dc, "$context", {
	        get: function () {
	            return $context;
	        }
	    });
		
	    Object.defineProperty(dc, "$model", {
	        get: function () {
	            return model;
	        }
	    });

	    Object.defineProperty(dc, "$view", {
	        get: function () {
	            return $view;
	        }
	    });
		
	    Object.defineProperty(dc, "$controller", {
	        get: function () {
	            return $controller;
	        }
	    });

	    Object.defineProperty(dc, "$parent", {
	        get: function () {
	            return $parent;
	        }
	    });

	    Object.defineProperty(dc, "$index", {
	        get: function () {
	            return $index;
	        }
	    });
		
	    dc.$eval = function (name) {
	        var value = null;
	        if (name && dc.hasOwnProperty(name)) {
	            value = dc[name];
	            if (value && dc.$model && _isBinding(value) && value.expression) {
	                value = TRC.evaluate(dc.$model, value.expression);
	            }
	        }
	        return value;
	    };

	    return dc;
	};

	var _loadedTemplates = {};

	scope.DataContext = scope.DataContext || function(view, model, callback) {

		var self = this;
		var _callback = null;
		var _loaders = [];
		
	    this.elements = [];
		this.view = view;
		this.model = model || {};
		this.controller = null; // in next version
		this.onBeforeChange = null;
		this.onAfterChange = null;
		this.errors = [];
		this.onError = null;   // (element, dc, error)
		//this.ready = false;

		function _handleError(element, error, details) {
		    var err = {
		        element: (element.id ? element.id : element.className), 
		        error: error
		    };
		    if (details)
		        err["details"] = details;
		    if (element)
		        self.errors.push(err);

		    if (self.onError)
		        self.onError(err);
		    else {
				if (self.controller && self.controller.onError)
					self.controller.onError.call(self.controller, error, self);
				else
					throw error;
			}
		};

		function _process() {
		    while (self.elements.length > 0) {
		        var element = self.elements.shift();
		        if (!element)
		            continue;

		        var dc = element["data-context"];
		        if (!dc || dc.constructor != _ClassDC) {

		            var dataContext = element.getAttribute("data-context");
		            if (!dataContext)
		                continue;

		            try {
		                dc = new _ClassDC(self, element, dataContext);
		                if (!dc || typeof (dc) !== "object")
		                    throw new Error("Invalid data-context value: " + dataContext);

		                element["data-context"] = dc;
		            }
		            catch (error) {
		                _handleError(element, error, "Invalid data-context syntax: '" + dataContext + "'. Error:" + error.message);
		            }
		        }

		        try {
		            if (dc.hasOwnProperty("$template")) {
		                var template = _loadTemplate(element, dc);
		                if (!template)
		                    continue; // element will be processed when template is loaded and applied
		                _applyTemplate(template, element, dc);
		            }
		            _applyBindings(element, dc);
		        }
		        catch (error) {
		            _handleError(element, error, "data-context processing error.\r\ndata-context: " + dataContext + "\r\nError: " + error.message);
		        }
		    }
		};

		function _renderForeach(element, dc) {
		    var $foreach = dc.$eval("$foreach");
		    var isArray = Object.isArray($foreach);
		    var eachCount = isArray ? $foreach.length : (function (o) { var c = 0; if (o) { for (var i in o) c++; } return c; })($foreach);

		    try {
		        var template = dc.$foreach$template;
		        while (element.lastChild)
		            element.removeChild(element.lastChild);
		        if (eachCount > 0 && template && template.length > 0) {
		            for (var index in $foreach) {

		                var eachModel = $foreach[index];
						var $index = isArray ? parseInt(index) : index;

		                for (var e = 0; e < template.length; e++) {
		                    var child = template[e].cloneNode(true);
		                    element.appendChild(child);

		                    var levelNodes = _selectLevel(child, true);
		                    for (var n = 0; n < levelNodes.length; n++) {
		                        var node = levelNodes[n];
		                        node["data-context$override"] = {
		                            parent: $foreach,
									$index: $index,
		                            model: eachModel
		                        };
		                        self.elements.push(node);
		                    }
		                }
		            }
		        }
		    }
		    catch (error) {
		        _handleError(element, error, { dc: dc, property: "$foreach", $foreach: $foreach });
		        return false;
		    }
		    finally {
		    }
		    return true;
		};

		function _applyTemplate(template, element, dc) {
		    if (template && element && template.html) {
		        var html = template.html;
		        if (template.replace) {
		            for (var k = -1, len = template.replace.length, key, value; ++k < len;) {
		                key = template.replace[k];
		                value = dc ? dc[key.substring(2)] : "";
		                html = html.replace(key, value);
		            }
		        }

		        TRC.html(element, html);
		        if (!dc.$foreach) {
		            var level = _selectLevel(element, false);
		            self.elements.push.apply(self.elements, level); // join two arrays
		        }
		    }
		};

		function _completeLoader(loader) {
		    try {
		        if (loader.req.status == 200) {
		            loader.completed = true;
		            var template = new _ClassTemplate(loader.req.responseText);
		            loader.req = null;
		            _loadedTemplates[loader.url] = template;

		            var target, element, dc;
		            while (loader.targets.length > 0) {
		                target = loader.targets.shift();
		                if (target) {
		                    element = target[0];
		                    dc = target[1];
		                    _applyTemplate(template, element, dc);
		                    _applyBindings(element, dc);
		                }
		            }

		            var lcIndex = _loaders.indexOf(loader);
		            if (lcIndex != -1)
		                _loaders.splice(lcIndex, 1);

		            _process();

		            _doCallback();
		        }
		    }
		    finally {
		        if (loader) {
		            loader.completed = true;
		            loader.req = null;
		        }
		    }
		};

		function _startLoader(element, dc, url) {
		    var loader = {
		        req: new XMLHttpRequest(),
		        url: url,
		        targets: [[element, dc]]
		    };
		    _loaders.push(loader);
		    loader.onStateChange = function () {
		        if (this.readyState == 4) // this -> req
		            _completeLoader(loader);
		    }
		    loader.req.onreadystatechange = loader.onStateChange;
		    loader.req.open("GET", url, true);
		    loader.req.send();
		    return loader;
		};

		function _loadTemplate(element, dc) {
		    var template = dc.$template;
		    switch (typeof (template)) {
		        case "string":
		            if (_loadedTemplates.hasOwnProperty(template))
		                return _loadedTemplates[template];
	                template = document.querySelector(template);
	                if (template) {
	                    template = new _ClassTemplate(template.innerHTML);
	                    _loadedTemplates[dc.$template] = template;
	                    return template;
	                }
		            break;
		        case "object":
		            if (typeof (template) === "object" && template.url) {
		                var url = template.url;
		                template = _loadedTemplates.hasOwnProperty(url) ? _loadedTemplates[url] : null;
		                if (template && template.loaded)
		                    return template;

		                for (var i = 0; i < _loaders.length; i++) {
		                    var loader = _loaders[i];
		                    if (loader.url == url) {
		                        loader.targets.push([element, dc]); // add target to an active loader
		                        return null;
		                    }
		                }
		                _startLoader(element, dc, url);
		            }
		            break;
		    }		    
		    return null;
		};

		function _applyBindings(element, dc) {
		    if (element && dc) {

		        if (dc.hasOwnProperty("$before")) {
		            var before = dc["$before"];
		            delete dc["$before"];
		            if (Object.isFunction(before)) {
		                before.call(self, element, dc);
		            }
		        }

		        for (var prop in dc) {
		            if (prop.charAt(0) == '$')
		                continue;

		            var value = dc[prop];
		            if (!value)
		                continue;

		            if (_isBinding(value))
		                _bind(value, element, dc, prop);
		            else
		                TRC.property(element, prop, value);
		        }

		        if (dc.$foreach) {
		            if (!dc.$foreach$template) {
		                var template = dc.$foreach$template = [];
		                for (var i = -1, len = element.children.length; ++i < len;) {
		                    template.push(element.children[i].cloneNode(true));
		                }
		            }
		            if (_isBinding(dc.$foreach))
		                _bind(dc.$foreach, element, dc, '$foreach');
		            if (!_renderForeach(element, dc))
		                return;
		        }

		        if (Object.isFunction(dc.$after))
		            dc.$after.call(self, element, dc);
		    }
		};

		function _bind(binding, element, dc, prop) {
		    try {
		        var _binding = binding;
		        var _expr = binding.expression.replace(/model\./g, "");
		        var _element = element;
		        var _dc = dc;
		        var _prop = prop;
		        var _model = dc.$model;
		        var _value = TRC.evaluate(_model, binding.expression);

		        var _isForeach = (_prop === "$foreach");
                /*
		        if (_isForeach) {
		            if (!_dc.$foreach$template) {
		                _dc.$foreach$template = [];
		                for (var i = -1, len = _element.children.length; ++i < len;) {
		                    _dc.$foreach$template.push(_element.children[i].cloneNode(true));
		                }
		            }
		        }
                */

		        if (binding.type) {
		            var arrayWatcher = function (method, args, value) {
		                if (_binding.updating == false) {
		                    _binding.updating = true;
		                    try {
		                        if (self.onBeforeChange)
		                            self.onBeforeChange(_element, null, _binding, _dc);

		                        var renderAll = false; 
		                        switch (method) { // for right now always re-render all elements
		                            case Array.prototype.push:
		                            case Array.prototype.pop:
		                            case Array.prototype.shift:
		                            case Array.prototype.unshift:
		                            case Array.prototype.splice:
		                            case Array.prototype.sort:
		                            case Array.prototype.reverse:
		                            case this.set:
										renderAll = true;
										switch (_element.tagName.toLowerCase()) {
											case "select":
												if (_prop == "options") {
													renderAll = false;
													var selectedIndex = _element.selectedIndex;
													TRC.property(_element, _prop, this, true);
													if (_element.options.length < 1 || selectedIndex >= _element.options.length)
														selectedIndex = -1;
													_element.selectedIndex = selectedIndex;
												}
												break;
										}
		                        }
                                if (renderAll)
		                            _renderForeach(_element, _dc);
		                        _process();

		                        if (self.onAfterChange)
		                            self.onAfterChange(_element, null, _binding, _dc);
		                    }
		                    catch (error) {
		                        _handleError(_element, error, { dc: _dc, property: _prop, expression: _binding.expression });
		                    }
		                    finally {
		                        _binding.updating = false;
		                    }
		                }
		            };


		            var getter = function () {
		                return _value;
		            };

		            var setter = function (value) {
		                if (_value != value && _binding.updating == false) {
		                    try {
		                        _binding.updating = true;
		                        setValue(value);
	                        }
		                    catch (error) {
		                        _handleError(_element, error, { dc: _dc, property: _prop, expression: _binding.expression });
		                    }
		                    finally {
		                        _binding.updating = false; // was true but why ?
		                    }
                        }
		            };

		            var setValue = function (value, skipElement) {
		                if (self.onBeforeChange && self.onBeforeChange(_element, null, _binding, _dc) == false)
		                    return;

		                _value = value;

		                if (Object.isArray(value) && !value.onchange)
		                    value.onchange = arrayWatcher;

		                if (!skipElement) {
		                    if (_isForeach)
		                        _renderForeach(_element, _dc);
		                    else
		                        TRC.property(_element, _prop, value);
		                }

		                if (self.onAfterChange)
		                    self.onAfterChange(_element, null, _binding, _dc);
		            };


		            if (Object.isArray(_value)) {
		                _value.onchange = arrayWatcher;
		            }

		            var cur = _model, path = _expr.split('.'), len = path.length - 1, v;
		            for (var i = -1; ++i < len;) {
		                v = cur[path[i]];
		                if (typeof (v) === "undefined" || v == null)
		                    v = cur[path[i]] = {};
		                cur = v;
		            }
		            if (cur && path[len]) {
		                Object.defineProperty(cur, path[len], {
		                    enumerable: true,
		                    configurable: true,
		                    get: getter,
		                    set: setter
		                });
		            }
		        }

		        if (!_isForeach) {

		            TRC.property(_element, _prop, _value);
					
					if (_prop == "options" && element.tagName.toLowerCase() == "select")
						_binding.eventType = null;
					
					if (_binding.eventType) {
						TRC.addEventListener(element, _binding.eventType, function (evt) {
							evt = evt || event;
							if (evt && evt.target == _element && _model && _expr && _binding.updating == false) {
								try {
									_binding.updating = true;

									if (_binding.before && _binding.before.call(_element, evt, _binding, _dc) == false)
										return;

									if (self.onBeforeChange && self.onBeforeChange(_element, evt, _binding, _dc) == false)
										return;

									if (_binding.instead)
										_binding.instead.call(_element, evt, _binding, _dc);
									else {
										var v = _element[_prop];
										if (v != _value)
											setValue(v, false);
									}

									if (_binding.after)
										_binding.after.call(_element, evt, _binding, _dc);

									if (self.onAfterChange)
										self.onAfterChange(_element, evt, _binding, _dc);
								}
								catch (error) {
									_handleError(_element, error, { dc: _dc, property: _prop, expression: _binding.expression });
								}
								finally {
									_binding.updating = false;
								}
							}
						});
					}
		        }
		    }
		    catch (error) {
                _handleError(element, error, { dc: dc, property: prop });
		    }
		};

		function _doCallback() {
			if (self.controller && Object.isFunction(self.controller.init)) {
				self.controller.init.call(self.controller);
			}
		    if (_callback && _loaders.length == 0 && self.elements.length == 0) {
		        var cb = _callback;
		        _callback = null;
		        cb.call(self);
		        return true;
		    }
		    return false;
		};
	    //------------

	    /*
		this.attachOn = function (eventType, target, callback) {
			if (!eventType)
				eventType = 'load';
			target = target ? target : window;
			if (target) {
				var cb = callback;
				TRC.addEventListener(target, eventType, function () {
					self.attach.call(self, cb);
				}, false);
			}
		};
		*/

		this.attach = function (callback) {
		    if (callback)
		        _callback = callback;

		    if (!self.view)
		        self.view = document;
		    else {
		        if (typeof (self.view) === "string")
		            self.view = document.querySelector(self.view);
		    }
		    if (!self.view)
		        throw new Error("DataContext.attach: Invalid view");

		    var dcChildren = _selectLevel(self.view, (self.view != document));

		    if (dcChildren) {
		        for (var i = 0; i < dcChildren.length; i++) {
		            self.elements.push(dcChildren[i]);
		        }
		        dcChildren = null;
		    }

		    _process();

		    _doCallback();
		};

		if (callback) {
		    TRC.onReady(function () {
		        //var cbName = TRC.getFunctionName(callback);
		        self.attach.call(self, callback);
		    });
		}
	};
	
	scope.Activity = scope.Activity || function(view, model, controller) {
		var self = this;
		this.activated = false;
		
		var dataContext = new TRC.DataContext(view, model);		

		if (Object.isFunction(controller)) {
			dataContext.controller = new controller(dataContext);
		}

		Object.defineProperty(this, "context", {
			enumerable: false,
			configurable: false,
			get: function() {
				return dataContext;
			},
			set: function(value) {			
			}
		});

		Object.defineProperty(this, "model", {
			enumerable: false,
			configurable: false,
			get: function() {
				return dataContext ? dataContext.model : null;
			},
			set: function(value) {			
			}
		});

		Object.defineProperty(this, "view", {
			enumerable: false,
			configurable: false,
			get: function() {
				return dataContext ? dataContext.view : null;
			},
			set: function(value) {			
			}
		});
		
		Object.defineProperty(this, "controller", {
			enumerable: false,
			configurable: false,
			get: function() {
				return dataContext ? dataContext.controller : null;
			},
			set: function(value) {			
			}
		});
		
		function _activate(callback) {
			dataContext.attach(function() {
				self.activated = true;
				var ctrl = self.controller;
				if (ctrl && Object.isFunction(ctrl.activate)) {
					ctrl.activate.call(self, dataContext);
					if (callback)
						callback.call(self);
				}
			});
		}
		
		function _show(display) {
			var ctrl = self.controller;
			if (ctrl && Object.isFunction(ctrl.show)) {
				ctrl.show.call(self, display);
			}
			else {
				if (self.view) {
					if (!display)
						display = "block";						
					if (self.view.style.display != display)
						self.view.style.display = display;
				}
			}
		}
		
		this.activate = function() {
			if (!self.activated)
				_activate();
		};
		
		this.show = function(display) {
			if (!self.activated)
				_activate(function() { _show(display); });
			else
				_show(display);
		};
		
		this.hide = function(display) {
			if (!self.activated)
				throw new Error("Must first activate() activity.");
			var ctrl = self.controller;
			if (ctrl && Object.isFunction(ctrl.hide)) {
				ctrl.hide.call(self, display);
			}
			else {
				if (self.view) {
					if (!display)
						display = "none";
					if (self.view.style.display != display)
						self.view.style.display = display;
				}
			}
		};
	};	
})(TRC || {});