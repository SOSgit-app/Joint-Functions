define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/webform"],
function (ko, SPA, Themes, WF) {

    var _defaultTheme = Themes.resolveTheme("playbook.webform");

    return function () {
        var self = SPA.CreateView(this),
            _form = null,
            _theme = null;

        function _watchDisabled(ctrl, element) {
            if (ctrl) {
                ctrl.disabled = function () {
                    if (arguments.length < 0)
                        return Object.resolve(ctrl.base, "disabled");
                    var d = Object.put(ctrl.base, "disabled", !!arguments[0]);
                    TRC.disable(element, d);
                    return d;
                }
            }
        }

        function _simpleReadonly(fe, input) {
            if (fe) {
                fe.readonly = function () {
                    if (arguments.length < 1)
                        return !!Object.resolve(fe.base, "readonly"); 

                    var ro = !!arguments[0];
                    Object.put(fe.base, "readonly", ro);
                    if (arguments.length > 0) {
                        var can = fe.canChange ? fe.canChange.call(fe) : !ro;
                        if (can !== false)
                            can = true;
                        TRC.readonly(input, !can);
                        if (input.tagName && String.toUpperCase(input.tagName) === "SELECT") {
                            TRC.enable(input, can);
                        }
                    }
                    return ro;
                };
            }
        }

        function _optionReadonly(option, input) {
            if (option) {
                option.readonly = function () {
                    if (arguments.length < 1)
                        return !!Object.resolve(option.base, "readonly");

                    var ro = !!arguments[0];
                    Object.put(option.base, "readonly", ro);
                    var can = !!Object.resolve(option, "canChange");
                    TRC.readonly(input, !can);
                    TRC.enable(input, can);
                    return ro;
                };
            }
        }

        function _groupReadonly(group, div) {
            if (group) {
                group.readonly = function () {
                    if (arguments.length > 0)
                        Object.put(group.base, "readonly", !!arguments[0]);
                    var ro = Object.resolve(group.base, "readonly");
                    if (arguments.length > 0) {
                        Array.foreach(group.options.items, function (o) {
                            Object.put(o, "readonly", Object.resolve(o, "readonly"));
                        });
                    }
                    return ro;
                };
            }
        }            

        function _create(tag, cn, content) {
            var node = document.createElement(tag);
            node.className = "trc-pbce " + (cn ? cn : "");
            if (content) {
                var ct = typeof(content);
                if (TRC.types(ct))
                    TRC.html(node, content);
                else {
                    Array.foreach(content, function (child) {
                        if (child)
                            node.appendChild(child);
                    });
                }
            }
            return node;
        }

        function _createLabel(text, name) {
            var lbl = _create("SPAN", "label");
            if (name)
                TRC.setAttr(lbl, "name", name);
            TRC.html(lbl, text);
            return lbl;
        }

        function _createLink(control) {
            var a = _create("A", "link"),
                href = Object.resolve(control, "href"),
                target = Object.resolve(control, "target"),
                text = Object.resolve(control, "text"),
                css = Object.resolve(control, "css");
            if (control.id)
                TRC.setAttr(a, "name", control.id);
            if (href)
                TRC.setAttr(a, "href", href);
            if (target)
                TRC.setAttr(a, "target", target);
            if (css)
                TRC.addClass(a, css);
            if (text)
                TRC.html(a, text);
            _watchDisabled(control, a);
            TRC.onclick(a, function (evt) {
                return control.$click.call(control, self, a, evt);
            });
            return a;
        }

        function _createTextInput(control) {
            var element = _create("DIV", "textinput " + control.id),
                input = null;

            if (control.id)
                TRC.setAttr(element, "name", control.id);

            if (control.label)
                element.appendChild(_createLabel(control.label));

            if (control.type == "textarea") {
                input = _create("TEXTAREA", "textarea");
            }
            else {
                input = _create("INPUT");
                input.type = control.type;
            }

            if (input) {
                var tt = typeof (control.text),
                    value = Object.resolve(control, "text");
                if (!TRC.typef(tt)) {
                    control.base.text = control.text;
                    control.text = function () {
                        if (arguments.length < 1)
                            return control.base.text;
                        control.base.text = arguments[0];
                        TRC.property(input, "value", control.base.text);
                    }
                }
                TRC.property(input, "value", value);
                _simpleReadonly(control, input);

                if (control.$change)
                    TRC.onchange(input, function (evt) {
                        return control.$change.call(control, self, input, evt);
                    });
                else
                    TRC.onchange(input, function (evt) {
                        Object.put(control, "text", TRC.getValue(input));
                    });

                if (control.$keydown) {
                    TRC.onkeydown(input, function (evt) {
                        return control.$keydown.call(control, self, input, evt);
                    });
                }
                if (control.$keyup) {
                    TRC.onkeyup(input, function (evt) {
                        return control.$keyup.call(control, self, input, evt);
                    });
                }
                if (control.$contextMenu) {
                    TRC.addEventListener(input, "contextmenu", function (evt) {
                        return control.$contextMenu.call(control, self, input, evt);
                    });
                }
                element.appendChild(input);
            }
            return element;
        }

        function _createDropdown(control) {
            var element = _create("DIV", "dropdown " + control.id),
                select = _create("SELECT");

            if (control.label)
                element.appendChild(_createLabel(control.label));
            element.appendChild(select);

            var selected = null;
            Array.foreach(control.options.items, function (o) {
                var option = new Option();
                option.text = Object.resolve(o, "text");
                option.value = Object.resolve(o, "value") || o.text;
                if (!!Object.resolve(o, "checked"))
                    selected = option.value;
                select.add(option);
            });

            control.selectedValue = function () {
                if (arguments.length < 1)
                    return Object.resolve(control.base, "selectedValue");
                var sv = Object.put(control.base, "selectedValue", arguments[0]);
                select.selectedIndex = Object.isNull(sv) ? -1 : Array.indexBy(select.options, "value", sv);
                return sv;
            };

            if (selected != null)
                control.selectedValue(selected);

            _simpleReadonly(control, select);

            TRC.onchange(select, function (evt) {
                return control.$change.call(control, self, select, evt);
            });

            return element;
        }

        function _createInputGroup(group, inputType) {
            var fc = _create("DIV", inputType + "-group");

            if (group.label)
                fc.appendChild(_createLabel(group.label));

            Array.foreach(group.options.items, function (option, index) {
                var input = _create("INPUT");
                input.type = inputType;
                input.name = group.id;
                input.checked = !!Object.resolve(option, "checked");

                _optionReadonly(option, input);

                if (group.$click) {
                    TRC.click(input, function (evt) {
                        return group.$click.call(group, self, option, input, evt);
                    });
                }
                fc.appendChild(input);

                label = _createLabel(option.text);
                fc.appendChild(label);
            });
            _groupReadonly(group, fc);
            return fc;
        }

        function _createSubform(subform) {
            var skin = Object.resolve(subform, "skin"),
                cn = ("subform " + subform.id + (skin ? (" " + skin) : "")),
                element = _create("DIV", cn),
                content = _create("DIV", "content");
            renderForm(subform, content);
            element.appendChild(content);
            return element;
        }

        function _applyAttrs(control, element) {
            if (element) {
                Object.foreach(control.attrs, function (v, a) {
                    TRC.setAttr(element, a, v);
                });
            }
        }

        function renderForm(form, content) {
            if (!form || !content)
                return;
            for (var i = 0, controls = form.elements.items, control, element, input; i < controls.length; i++) {
                control = controls[i];
                element = null;
                switch(control.$type) {
                    case WF.Label:
                        element = _createLabel(Object.resolve(control, "text"), control.id);
                        break;

                    case WF.Text:
                        element = _create("DIV", "text");
                        TRC.html(element, control.text);
                        break;

                    case WF.Link:
                        element = _createLink(control);
                        break;

                    case WF.TextEntry:
                        element = _createTextInput(control);
                        break;

                    case WF.Dropdown:
                        element = _createDropdown(control);
                        break;

                    case WF.RadioButtonGroup:
                        element = _createInputGroup(control, "radio");
                        break;

                    case WF.CheckboxGroup:
                        element = _createInputGroup(control, "checkbox");
                        break;

                    case WF.WebForm:
                        element = _createSubform(control);
                        break;
                }
                if (element) {
                    _applyAttrs(control, element);
                    content.appendChild(element);
                }
            }
        }

        this.form = function () {
            var a = arguments;
            if (a.length > 0)
                _form = a[0];
                return _form;
        };

        this.theme = function () {
            var a = arguments;
            if (a.length > 0)
                _theme = a[0];
            return _theme;
        };

        this.parentForm = function () {
            return null;
        };

        this.isSubform = function () {
            return (self.parentForm() == null);
        };

        this.isVisibleElement = function (element) {
            return (element && Boolean.parseBoolean(element.visible, true));
        };
            
        this.getView = function () {
            var view = self.elements.view = document.createElement("DIV");
            view.className = "trc-pbc webform";

            return view;
        };
            
        this.activateView = function () {
            var parameters = arguments[arguments.length - 1],
                form = Object.resolve(parameters, "content") || Object.resolve(parameters, "form"),
                elems = self.elements || {},
                view = elems.view;

            if (!view)
                throw new Error("Invalid form view.");

            if (!form || !(form instanceof WF.WebForm))
                throw new Error("Invalid form content.");

            var theme = Themes.resolveTheme(Object.resolve(parameters, "theme"), _defaultTheme),
                title = Object.resolve(form, "title") || Object.resolve(theme, "title"),
                skin = Object.resolve(form, "skin") || Object.resolve(theme, "skin"),
                dataTrc = Object.resolve(theme, "data-trc"),
                content = document.createElement("DIV"),
                html = null;

            if (skin)
                TRC.addClass(view, skin);

            elems.content = content;
            content.className = "trc-pbce content";
                
            if (dataTrc)
                TRC.setAttr(view, "data-trc", dataTrc);

            html = Themes.resolve([form, theme], "backHTML"); 
            if (html)
                view.appendChild(_create("DIV", "trc-pbce html back", html));
                
            if (title) {
                var td = _create("DIV", "title");
                td.appendChild(_createLabel(title));
                view.appendChild(td);
            }

            view.appendChild(content);

            html = Themes.resolve([form, theme], "frontHTML");
            if (html)
                view.appendChild(_create("DIV", "trc-pbce html front", html));

            _form = form;
            _theme = theme;

            Themes.call(theme, ["activateView"], [self, view, form]);

            if (TRC.config.debug())
                TRC.log("WebForm '" + form.id + "' activated.");
        };


        this.mapView = function (child) {
            renderForm(_form, self.elements.content);
        }

        this.attachView = function (child) {
            Themes.call([_form, _theme], ["attachView"], [self, child, _form]);
        };

        this.completeView = function (child) {
            Themes.call([_form, _theme], ["completeView"], [self, child, _form]);
        };

        this.canCloseView = function () {

        };
    };
});
