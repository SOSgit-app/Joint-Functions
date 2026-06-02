// v1.8d | 02/06/2015 | Copyright (c) 2013,2014 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
(function () {
    var _FILE_ = "trc.simport.js",
        _VERSION_ = 1.7;

    if((function() {
        function wrongTRC() {
            throw new Error("" + document.location + ": script '" + _FILE_ + "' requires 'trc.js' v1.7 or higher.");
        }
        if (typeof (window.TRC) == "undefined" || !window.TRC)
            wrongTRC();
        var ver = (typeof (TRC.version) != "undefined") ? parseFloat(TRC.version) : 0;
        if (isNaN(ver) || ver < 1.8)
            wrongTRC();

        if (typeof (TRC.Simport) != "undefined" && typeof (TRC.Simport.version) != "undefined") {
            ver = parseFloat(TRC.Simport.version);
            if (ver && ver >= _VERSION_)
                return false;
        }
    }) == false)
       return;

    TRC.Simport = new function () {
        var self = this;

        this.version = _VERSION_;
        this.wsTeamWS2 = null;
        this.logoutUrl = "../../logout.aspx?force=1";
        this.context = {
            simId: 0,
            pathId: 0,
            pathName: null,
            simState: null,
            simStateInfo: {},
            simStateProperties: {},
            currentRoundNo: 0,
            currentRoundInfo: {}
        };

        var reSimportJs = /(?:trc\.simport(?:\.min){0,1}\.js)$/i,
            scripts = document.getElementsByTagName("SCRIPT"),
            config;
        for (var s = -1, script; ++s < scripts.length;) {
            script = scripts[s];
            if (script && reSimportJs.test(script.src)) {
                config = script.getAttribute("data-config");
                if (config) {
                    config = eval(config);
                    if (Function.isFunction(config))
                        config = new config();
                    if (typeof (config) == "object" && config) {
                        Object.merge(this.context, config);
                        if (config.hasOwnProperty("teamId"))
                            this.context.simId = config.teamId;
                    }
                }
                break;
            }
        }

        if (!this.context.simId) {
            alert(_FILE_ + ": Invalid Simulation ID!");
            window.close();
            return this;
        }

        function _validateSimId() {
            if (!self.context.simId) {
                alert("Your session expired.");
                window.location = self.logoutUrl;
            }
        }

        function _isValidWS2Service(ws) {
            try {
                return (typeof ws === "object" && ws && typeof ws.ExecuteCommand === "function");
            }
            catch (err) {
                return false;
            }
        }

        function _validateWebService() {
            if (!_isValidWS2Service(self.wsTeamWS2) && !_initWebServices()) {
                throw new Error(_FILE_ + ": Simgate web service is not initialized.");
			}
        }

        function _initWebServices(retry) {
            try {
                if (_isValidWS2Service(self.wsTeamWS2))
                    return true;

                if (_isValidWS2Service(RegisLearning.Simport.Web.WS.TeamWS2)) {
                    self.wsTeamWS2 = RegisLearning.Simport.Web.WS.TeamWS2;
                    return true;
                }

                if (typeof (RegisLearning.Simport.Web.WS.TeamWS2) === "function") {
                    var s = new RegisLearning.Simport.Web.WS.TeamWS2();
                    if (_isValidWS2Service(s)) {
                        self.wsTeamWS2 = s;
                        return true;
                    }
                }
            }
            catch (error) {
            }
            if (retry) {
                setTimeout(function () {
                    _initWebServices(true);
                }, 250);
            }
            return false;
        }

        function _success(onSuccess, onFail, args) {
            var response = (args && args.length > 0) ? args[0] : null, result = null;
            if (response) {
                if (response.ErrorMessage) {
                    onFail.call(self, { message: response.ErrorMessage, details: response.ErrorDetails }, response);
                    return;
                }
                result = response.Result;
            }
            onSuccess.call(self, result, response);
        }

        function _blankStatus(state) {
            this.simId = self.context.simId;
            this.State = state ? state : null;
            this.Round = {
                RoundNo: self.context.currentRoundNo
            };
        }

        this.getTeamInfo = function () {
        };

        this.onSuccess = function () {
        };

        this.onFail = function (error) {
            alert("Error: " + TRC.getErrorMessage(error));
        };

        this.isVisitor = function () {
            return (self.context.pathId == self.context.homePathId) ? false : true;
        };

        this.isReady = function () {
            return _isValidWS2Service(self.wsTeamWS2);
        };
        
        this.executeCommand = function (commandName, parameters, onSuccess, onFail) {
            _validateSimId();
            _validateWebService();

            if (Object.isFunction(parameters)) {
                onFail = onSuccess;
                onSuccess = parameters;
                parameters = null;
            }

            parameters = parameters || [];

            if (!Object.isFunction(onFail))
                onFail = self.onFail;
            try {
                self.wsTeamWS2.ExecuteCommand(self.context.simId,
                    self.context.simState,
                    commandName,
                    parameters,
                    function () {
                        _success(onSuccess, onFail, arguments);
                    },
                    onFail);
            }
            catch (error) {
                onFail.call(self, error);
            }
        };

        this.loadVariables = function (variables, onSuccess, onFail) {
            _validateSimId();
            _validateWebService();

            if (!Object.isFunction(onSuccess))
                onSuccess = self.onSuccess;

            if (!Object.isFunction(onFail))
                onFail = self.onFail;

            if (!Array.isArray(variables))
                onFail.call(self, { message: "Invalid variables argument", details: "Value must be an array" });

            if (variables.length < 1)
                onSuccess.call(self, { Status: new _blankStatus(), Values: [] });
            else {
                _validateSimId();
                _validateWebService();
                try {
                    self.wsTeamWS2.LoadVariables(self.context.simId,
                        self.context.currentRoundNo,
                        self.context.simState,
                        variables,
                        function () {
                            _success(onSuccess, onFail, arguments);
                        },
                        onFail);
                }
                catch (error) {
                    onFail.call(self, error);
                }
            }
        };

        this.saveVariables = function (variables, values, onSuccess, onFail) {
            _validateSimId();
            _validateWebService();

            if (!Array.isArray(variables))
                throw new Error(_FILE_ + ": Simgate.saveVariables - unsupported 'variables' format");

            if (!Array.isArray(variables))
                throw new Error(_FILE_ + ": Simgate.saveVariables - unsupported 'values' format");

            if (variables.length != values.length)
                throw new Error(_FILE_ + ": Simgate.saveVariables - number of 'variables' and 'values' doesn't match");

            if (!Object.isFunction(onSuccess))
                onSuccess = self.onSuccess;

            if (!Object.isFunction(onFail))
                onFail = self.onFail;

            if (variables.length > 0) {
                Array.foreach(values, function (value, index) {
                    if (value && typeof (value) !== "string") {
                        values[index] = JSON.stringify(value);
                    }
                });
                try {
                    self.wsTeamWS2.SaveVariables(self.context.simId,
                        self.context.currentRoundNo,
                        self.context.simState,
                        variables,
                        values,
                        function () {
                            _success(onSuccess, onFail, arguments);
                        },
                        onFail);
                }
                catch (error) {
                    onFail.call(self, error);
                }
            }
            else
                onSuccess.call(self, new _blankStatus());
        };

        _initWebServices(true);
    };
})();