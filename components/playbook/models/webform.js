define([],
function () {

    var Module = new function () {

        // var module = this;
        var _DefaultTextEntryType = "text";

        function _ConfigReadonly(e, c) {
            switch (typeof (c.readonly)) {
                case "undefined":
                    e = undefined;
                    break;
                case "boolean":
                    e = c.readonly;
                    break;
                case "function":
                    e.readonly = c.readonly;
                    e = undefined;
                    break;
                case "number":
                    e = c.readonly ? true : false;
                    break;
            }
            delete c["readonly"];
            return e;
        }

        function _IsParentReadonly(e) {
            if (e && e.parent) {
                var p = e.parent();
                if (p)
                    return Boolean.eval(p.readonly, p);
            }
            return false;
        }

        function _CanChangeTest(obj) {
            return (!!!Object.resolve(obj, "readonly") && !_IsParentReadonly(obj));
        }


        function _DoKeyboardEvent(vm, element, evt, evtName) {
            var retValue = true;
            try {
                retValue = (evt && TRC.Keyboard.isCursorKey(evt.keyCode)) ? true : _CanChangeTest(this);
                if (retValue !== false && evtName) {
                    retValue = TRC.call(this, evtName, vm, element, evt);
                    if (retValue !== false)
                        retValue = true;
                }
            }
            catch (error) {
                TRC.log("webform.js/" + TRC.getFunctionName(this.$type) + ":" + (evt ? evt.type : "<event>") + "(): " + TRC.getErrorMessage(error));
                retValue = false;
            }
            if (!retValue)
                TRC.cancelEvent(evt);
            return retValue;
        }

	    this.WebForm = function WebForm(id, title, elements, config) {
	        var self = this,
	            _isReadonly = false;

	        this.id = id;
	        this.title = title || null;
	        this.completed = false;
	        this.readonly = false;
	        this.elements = null;

	        function _me() {
	            return self;
	        };

	        function _findElement(id) {
	            return Array.lookupBy(self.elements.items, "id", id);
	        };

	        function _findSubform(formId) {
	            for (var i = 0, elems = self.elements.items, len = elems.length, e; i < len; i++) {
	                e = elems[i];
	                if (e && (e instanceof WebForm) && e.id == formId)
	                    return e;
	            }
	            return null;
	        }

	        function _getState() {
	            var state = null;
	            if (!!Object.resolve(self, "completed"))
	                state = { c: 1 };
	            var es = self.elements ? self.elements.getState() : null;
	            if (es != null) {
	                state = state || {};
	                state.es = es;
	            }
	            return state;
	        };

	        function _setState(state) {
	            var es = state ? state["es"] : null;
	            self.elements.setState(es);
	            Object.put(self, "completed", (state && state.c));
	        };

	        function _init() {
	            Array.foreach(self.elements.items, function (e, i) {
	                if (e) {
	                    e.parent = _me;
	                    if (e.base)
	                        e.base.parent = _me;
	                }
	            });
	        }
	        
	        function _readonly() {
	            if (arguments.length > 0)
	                _isReadonly = !!arguments[0];
	            return (_isReadonly || !!Object.resolve(self, "completed") || _IsParentReadonly(self));
            }

	        this.init = _init;
	        this.findElement = _findElement;
	        this.findSubform = _findSubform;
	        this.getState = _getState;
	        this.setState = _setState;

	        if (config) {
	            _isReadonly = Object.ifNull(Object.resolve(config, "readonly"), _isReadonly);
	            Object.merge(this, config);
	        }

	        this.$type = this.constructor;
	        this.readonly = _readonly;

	        this.base = {
	            $type: this.constructor,
	            init: _init,
	            readonly: _readonly,
	            findElement: _findElement,
	            findSubform: _findSubform,
	            getState: _getState,
	            setState: _setState
	        };

	        this.elements = new TRC.List({
	            name: this.id + ".elements",
	            key: String.ifEmpty(this.key, "id")
	        }, elements);

	        TRC.call(this, "init");
	    };

	    this.Label = function Label(id, text, config) {
	        var self = this;

	        this.id = id;
	        this.text = text || "";
	        this.css = "";

	        if (config) {
	            var t = typeof (config);
	            if (TRC.types(t))
	                this.css = config;
	            else
	                if (TRC.typeo(t))
	                    Object.merge(this, config);
	        }

	        this.$type = this.constructor;
	        this.base = {
	            $type: this.$type
	        };
	    };

	    this.Text = function Text(id, text, config) {
	        var self = this;

	        this.id = id;
	        this.text = text || "";
	        this.css = "";

	        if (config) {
	            var t = typeof (config);
	            if (TRC.types(t))
	                this.css = config;
	            else
	                if (TRC.typeo(t))
	                    Object.merge(this, config);
	        }

	        this.$type = this.constructor;
	        this.base = {
	            $type: this.$type
	        };
	    };

	    this.TextEntry = function TextEntry(id, label, text, config) {
	        var self = this,
                _isReadonly = false;

	        this.id = id;
	        this.type = _DefaultTextEntryType;
	        this.label = label || "";
	        this.text = text || "";
	        this.css = "";

	        function readonly() {
	            if (arguments.length > 0)
	                _isReadonly = !!arguments[0];
	            return _isReadonly;
	        }

	        function canChange() {
	            return _CanChangeTest(self);
	        }

	        function getState() {
	            var state = null
	            if (_isReadonly)
	                state = { r: 1 };
	            var text = String.eval(self.text, self);
	            if (text) {
	                state = state || {};
	                state.t = text;
	            }
	            return state;
	        };

	        function setState(state) {
	            if (state) {
	                self.text = Object.ifNull(state.t, "");
	                if (state.hasOwnProperty("r"))
	                    Object.put(self, "readonly", !!state.r);
	            }
	        };

	        this.getState = getState;
	        this.setState = setState;

	        if (config) {
	            var t = typeof (config);
	            if (TRC.types(t))
	                this.css = config;
	            else
	                if (TRC.typeo(t)) {
	                    Object.merge(this, config);
	                    if (String.isEmpty(this.type))
	                        this.type = _DefaultTextEntryType;
	                    _isReadonly = Object.resolve(this, "readonly");
	                }
	        }

	        this.$type = this.constructor;
	        this.readonly = readonly;
	        this.canChange = canChange;

	        this.base = {
	            readonly: readonly,
	            getState: getState,
	            setState: setState
	        };

	        this.$keydown = function (vm, element, evt) {
	            return _DoKeyboardEvent.call(self, vm, element, (evt || event), "onkeydown");
	        };

	        this.$keyup = function (vm, element, evt) {
	            return _DoKeyboardEvent.call(self, vm, element, (evt || event), "onkeyup");
	        };

	        this.$change = function (vm, element, evt) {
	            var allowed = _DoKeyboardEvent.call(self, vm, element, (evt || event), "onchange");
	            if (allowed && element)
	                Object.put(self, "text", TRC.getValue(element));
	            return allowed;
	        };

	        this.$contextMenu = function (vm, element, evt) {
	            if (self.canChange(self))
	                return true;
	            TRC.cancelEvent(evt);
	            return false;
	        };
	    };

	    this.TextInput = function TextInput(id, label, text, config) {
	        return new Module.TextEntry(id, label, text, Object.merge(config, { type: "text" }));
	    };

	    this.TextArea = function TextArea(id, label, text, config) {
	        return new Module.TextEntry(id, label, text, Object.merge(config, { type: "textarea" }));
	    };

	    this.Link = function Link(id, text, href, config) {
	        var self = this,
                _dis_ = "disabled",
	            _disabled = false;

	        this.id = id;
	        this.text = text || "";
	        this.href = null;
	        this.disabled = _disabled;

	        if (arguments.length > 2) {
	            var t = typeof (arguments[2]);
                if (TRC.types(t))
                    this.href = arguments[2];
	            else {
                    if (TRC.typef(t))
                        this.onclick = arguments[2];
                    else
                        if (TRC.typeo(t) && arguments.length < 4)
	                        config = arguments[2];
	            }
	            if (config) {
	                Object.merge(this, config);
	                _disabled = Object.resolve(config, _dis_);
	            }
	        }

	        function _disabled() {
	            if (arguments.length > 0)
	                _disabled = !!arguments[0];
	            return _disabled;
	        }

	        this.base = {
	            $type: this.constructor,
	            disabled: _disabled
	        };

	        this.$type = this.constructor;
	        this.disabled = _disabled;

	        this.$click = function (vm, element, evt) {
	            var retValue = false;
	            try {
	                evt = evt || event;
	                if (!!!Object.resolve(self, _dis_) && !_IsParentReadonly(self)) {
	                    retValue = Function.invoke(self, "onclick", [vm, element, evt]);
	                    if (retValue !== false)
	                        retValue = true;
	                }
	            }
	            catch (error) {
	                TRC.log("webform.js/link.click(): " + TRC.getErrorMessage(error));
	                retValue = false;
	            }
	            if (!retValue)
	                TRC.cancelEvent(evt);
	            return retValue;
	        }
	    };

	    this.Option = function Option(id, text, config) {
	        var self = this,
                _isReadonly = false;

	        this.id = id;
	        this.text = text;
	        this.css = "";

	        function _readonly() {
	            if (arguments.length > 0)
	                _isReadonly = !!arguments[0];
	            return _isReadonly;
	        }

	        function _canChange() {
	            return _CanChangeTest(self);
	        }

	        if (TRC.typeb(typeof(config)))
	            this.selected = config;
	        else {
	            this.selected = false;
	            if (config) {
	                Object.merge(this, config);
	                _isReadonly = !!Object.resolve(this, "readonly");
	            }
            }
	        this.$type = this.constructor;
	        this.readonly = _readonly;
	        this.canChange = _canChange;

	        this.base = {
	            readonly: _readonly,
	            canChange: _canChange
	        };
	    };

	    this.RadioButtonGroup = function RadioButtonGroup(id, label, options, config) {
	        var self = this,
                _isReadonly = false;

	        this.id = id;
	        this.label = label || "";
	        this.css = "";

	        function me() {
	            return self;
	        }

	        function _find(id) {
	            return Array.lookupBy(self.options.items, "id", id);
	        }

	        function _readonly() {
	            if (arguments.length < 1)
	                return _isReadonly ? _isReadonly : _IsParentReadonly(this);
	            _isReadonly = !!arguments[0];
	            return _isReadonly;
	        }

	        function _getState() {
	            return self.selectedValue();
	        };

	        function _setState(state) {
	            var delegate = Object.isNull(state) ?
                    function (rb) {
                        Object.put(rb, "rb", false);
                    }
                    : function (rb) {
                        if (rb)
                            Object.put(rb, "rb", (rb.id == state));
                    };
	            Array.foreach(self.options.items, delegate);
	        };

	        this.find = _find;
	        this.readonly = _readonly;
	        this.getState = _getState;
	        this.setState = _setState;

	        if (config) {
	            _isReadonly = Object.ifNull(_ConfigReadonly(this, config), _isReadonly);
	            Object.merge(this, config);
            }

	        this.$type = this.constructor;

	        this.base = {
	            find: _find,
	            readonly: _readonly,
	            getState: _getState,
	            setState: _setState
	        };

	        this.options = new TRC.List({
	            name: this.id + ".options",
	            key: String.ifEmpty(this.key, "id")
	        }, options);

	        Array.foreach(this.options.items, function (o, i) {
                if (o)
	                o.parent = me;
	        });
	        
	        this.$click = function (vm, option, element, evt) {
	            var retValue = false;
	            try {
	                if (option && !Boolean.eval(self.readonly, self) && !Boolean.eval(self.disabled, self)) {
	                    evt = evt || event;
	                    retValue = TRC.call(option, "onclick", vm, element, evt);
	                    if (retValue !== false) {
	                        retValue = TRC.call(self, "onclick", option, vm, element, evt);
	                        if (retValue !== false) {
	                            var selected = !!!Object.resolve(option, "selected");
	                            Object.put(option, "selected", selected);
	                            Array.foreach(self.options.items, function (ro, i) {
	                                if (ro && ro != option)
	                                    Object.put(ro, "selected", false);
	                            });
	                            if (element) {
	                                if (element.checked && !selected) {
	                                    retValue = false;
	                                    setTimeout(function () {
	                                        element.checked = false;
	                                    }, 50);
	                                }
	                                element.checked = selected;
	                            }
	                            if (TRC.call(option, "afterClick", vm, element, evt) !== false)
	                                TRC.call(self, "afterClick", option, vm, element, evt);
	                            retValue = true;
	                        }
	                    }
	                }
	            }
	            catch (error) {
	                TRC.log("webform.js/RadioButtonGroup.$click(): " + TRC.getErrorMessage(error));
	                retValue = false;
	            }
	            if (retValue === false)
	                TRC.cancelEvent(evt);
	            return retValue;
	        };

	        this.selectedValue = function () {
	            var sel = null;
	            Array.foreach(self.options.items, function (rb, i) {
	                if (!!Object.resolve(rb, "selected")) {
	                    sel = rb.id;
	                    return -1;
	                }
	            });
	            return sel;
	        };
	    };

	    this.CheckboxGroup = function CheckboxGroup(id, label, options, config) {
	        var self = this,
	            _isReadonly = false;

	        this.id = id;
	        this.label = label || "";
	        this.css = "";

	        function me() {
	            return self;
	        }

	        function _find(id) {
	            return Array.lookupBy(self.options.items, "id", id);
	        }
	        
	        function _readonly() {
	            if (arguments.length < 1)
	                return _isReadonly ? _isReadonly : _IsParentReadonly(this);
	            _isReadonly = !!arguments[0];
	            return _isReadonly;
	        }

	        function _canChange() {
	            return _CanChangeTest(self);
	        }

	        function _getState() {
	            var checked = self.selectedValue();
	            return Array.isEmpty(checked) ? null : checked;
	        };

	        function _setState(state) {
	            var delegate = Array.isNullOrEmpty(state) ?
                    function (o) {
                        Object.put(o, "selected", false);
                    }
                    :
                    function (o) {
                        if (o)
                            Object.put(o, "selected", (Array.indexOf(state, o.id) != -1));
                    };
	            Array.foreach(self.options.items, delegate);
	        };
            
	        this.find = _find;
	        this.reaonly = _readonly;
            this.getState = _getState;
	        this.setState = _setState;

	        if (config) {
	            _isReadonly = Object.ifNull(_ConfigReadonly(this, config), _isReadonly);
    	        Object.merge(this, config);
	        }

	        this.$type = this.constructor;
	        this.base = {
	            find: _find,
	            readonly: _readonly,
	            getState: _getState,
	            setState: _setState                
	        };

	        this.options = new TRC.List({
	            name: this.id + ".options",
	            key: String.ifEmpty(this.key, "id")
	        }, options);
	        Array.foreach(this.options.items, function (o, i) {
	            if (o)
	                o.parent = me;
	        });

	        this.$click = function (vm, option, element, evt) {
	            var retValue = false;
	            try {
	                if (option && _canChange(self)) {
	                    retValue = TRC.call(option, "onclick", vm, element, evt);
	                    if (retValue !== false) {
	                        retValue = TRC.call(self, "onclick", vm, element, evt);
	                        if (retValue !== false) {
	                            var selected = element ? element.checked : (!option.checked);
	                            Object.put(option, "selected", selected);
	                            if (TRC.call(option, "afterClick", vm, element, evt) !== false)
	                                TRC.call(self, "afterClick", option, vm, element, evt);
	                            retValue = true;
	                        }
	                    }
	                }
                }
	            catch (error) {
	                TRC.log("webform.js/CheckboxGroup.$click(): " + TRC.getErrorMessage(error));
	                retValue = false;
	            }
	            if (retValue === false)
	                TRC.cancelEvent(evt);
	            return retValue;
	        };

	        this.selectedValue = function () {
	            var selected = [];
	            Array.foreach(self.options.items, function (o, i) {
	                if (!!Object.resolve(o, "selected"))
	                    selected.push(o.id);
	            });
	            return selected;
	        };
	    };

	    this.Dropdown = function DropDown(id, label, options, config) {
	        var self = this,
                _isReadonly = false,
                _ignoreReadonly = false,
                _selected = null;

	        this.id = id;
	        this.label = label || "";
	        this.disabled = false;

	        function me() {
                return self;
	        }

	        function _readonly() {
	            if (arguments.length > 0)
	                _isReadonly = !!arguments[0];
	            return _isReadonly;
	        }

	        function _canChange() {
	            return _CanChangeTest(self);
	        }

	        function _find(value) {
	            return Array.lookupBy(self.options.items, self.options.key, value);
	        }

	        function _getState() {
	            return Object.resolve(self, "selectedValue");
	        }

	        function _setState(state) {
	            Object.put(self, "selectedValue", state);
	        }

	        function _selectedValue() {
	            if (arguments.length > 0) {
	                var option = _find(arguments[0]);
	                if (option)
	                    _selected = arguments[0];
	            }
	            return _selected;
	        }

	        this.selectedValue = _selectedValue;
	        this.getState = _getState;
	        this.setState = _setState;
	        this.find = _find;
	        this.readonly = _readonly;

	        if (config) {
	            _isReadonly = Object.ifNull(_ConfigReadonly(this, config), _isReadonly);
	            Object.merge(this, config);
	        }

	        this.$type = this.constructor;            

	        this.base = {
	            find: _find,
	            selectedValue: _selectedValue,
	            getState: _getState,
	            setState: _setState,
	            readonly: _readonly
	        };

	        this.$change = function (vm, element, evt) {
	            var retValue = false;
	            try {
	                evt = evt || event;
	                if (_canChange()) {
	                    retValue = Function.invoke(self, "onchange", [vm, element, evt]);
	                    if (retValue !== false && element.selectedIndex != -1) {
	                        var option = Array.pick(self.options.items, element.selectedIndex);
	                        if (option)
	                            _selected = option.id;
	                    }
	                }
	            }
	            catch (error) {
	                TRC.log("webform.js/Dropdown.$onchange(): " + TRC.getErrorMessage(error));
	                retValue = false;
	            }
	            if (retValue == false)
	                TRC.cancelEvent(evt);
	            return retValue;
	        }

	        this.options = new TRC.List({
	            name: this.id + ".options",
	            key: String.ifEmpty(this.key, "id")
	        }, options);

	        Array.foreach(this.options.items, function (o, i) {
                if (o)
	                o.parent = me;
	        });
	    };

	    this.find = function (start, path) {
	        if (path) {
	            var current = start;
	            if (typeof (path) == "string")
	                path = path.split(/\//gi);
	            else {
	                if (!Array.isArray(path))
	                    path = [path];
	            }
	            for (var i = 0; i < path.length && current; i++) {
	                if (!current || !current.find)
	                    break;
	                current = current.find(path[i]);
	            }
	            if (i == path.length)
	                return current;
	        }
	        return null;
	    };

	    this.isForm = function (element) {
	        return (element instanceof Module.WebForm);
	    };

	    this.isLabel = function (element) {
	        return (element.$type == Module.Label);
	    };

	    this.isText = function (element) {
	        return (element.$type == Module.Text);
	    };

	    this.isLink = function (element) {
	        return (element.$type == Module.Link);
	    };

	    this.isTextEntry = function (element) {
	        return (element.$type == Module.TextEntry);
	    };

	    this.isDropdown = function (element) {
	        return (element.$type == Module.Dropdown);
	    };

	    this.isRadioButtonGroup = function (element) {
	        return (element.$type == Module.RadioButtonGroup);
	    };

	    this.isCheckboxGroup = function (element) {
	        return (element.$type == Module.CheckboxGroup);
	    };

	    var _KnownElementTypes = [this.WebForm, this.Label, this.Text, this.Link, this.TextInput, this.TextArea, this.RadioButtonGroup, this.CheckboxGroup, this.Dropdown];

	    this.isCustomElement = function (element) {
	        var isCustom = true;
	        Array.foreach(_KnownElementTypes, function (t, i) {
	            if (element instanceof t) {
	                isCustom = false;
	                return -1;
	            }
	        });
	        return isCustom;
	    };
    };

	return Module;

});