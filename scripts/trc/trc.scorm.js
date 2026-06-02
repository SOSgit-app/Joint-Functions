// v1.8f | 01/21/2015 | Copyright (c) 2013,2014 The Regis Company, Inc. All Rights Reserved. | for details visit: www.regiscompany.com
// For terms of use and licensing must contact The Regis Company at info@regiscompany.com
var TRC = TRC || {};
(function (trc) {
    var _FILE_ = "trc.scorm.js",
        _VERSION_ = 1.8,
        _path_ = null,
        _config_ = {
            debug: false
        },
        _apiName_ = {
            "1.2": "API",
            "2004": "API_1484_11"
        };

    if ((function () {
        function wrongTRC() {
            throw new Error("" + document.location + ": script '" + _FILE_ + "' requires 'trc.js' v1.8 or higher.");
        }
        if (typeof (TRC) == "undefined" || !TRC)
            wrongTRC();
        var ver = (typeof (TRC.version) != "undefined") ? parseFloat(TRC.version) : 0;
        if (!ver || ver < 1.8)
            wrongTRC();

        if (typeof (trc.SCORM) != "undefined" && typeof (trc.SCORM.version) != "undefined") {
            ver = parseFloat(trc.SCORM.version);
            if (ver && ver >= _VERSION_)
                return false;
        }
    })() == false)
        return;

    function _log() {
        if (!arguments)
            arguments = [];
        arguments.unshift("trc.scorm.js: ");
        TRC.log.apply(TRC, arguments)
    }

    trc.SCORM = {
        version: _VERSION_,
        config: _config_
    };

    try {
        var scripts = document.getElementsByTagName("SCRIPT"),
            reSrc = /(?:trc\.scorm(?:\.min){0,1}\.js)$/i;
        for (var i = 0, script, pos; i < scripts.length; i++) {
            script = scripts[i];
            pos = script.src.search(reSrc);
            if (pos != -1) {
                _path_ = script.src.substring(0, pos);
                var config = script.getAttribute("data-config");
                if (config) {
                    if (config.charAt(0) != "{")
                        config = "{" + config + "}";
                    eval("config = " + config);
                    Object.merge(_config_, config);
                }
                break;
            }
        }
    }
    catch (error) {
        alert(_FILE_ + " startup error: " + trc.getErrorMessage(error));
    }

    function _isError(result) {
        return (result && result.toString().toLowerCase() == "true") ? false : true;
    }

    function ScormError(message, code) {
        this.message = message || "Default Message";
        if (code)
            this.code = code;
    }
    ScormError.prototype = new Error();
    ScormError.prototype.constructor = ScormError;
    ScormError.unwrap = function (e) {
        switch(typeof (e)) {
            case "string":
                return { message: e };
            case "object":
                if (e != null) {
                    return {
                        code: e.code,
                        message: TRC.getErrorMessage(e)
                    };
                }
                break;
        }
        return {};
    }

    function _throwError(scorm, code, description, cb) {
        if (!code && scorm)
            code = scorm.getLastError();
        if (!description && scorm)
            description = scorm.getErrorString(code);
        if (!code)
            code = 101;
        scorm.lastError = code;
        if (Function.isFunction(cb))
            cb.call(scorm, { code: code, description: description });
        else
            throw new ScormError(description, code);
    };

    function ManifestFile(url, cbComplete, cbError) {
        var self = this;
		this.completed = false;
		this.url = url ? url : "imsmanifest.xml";
		this.state = null;
		this.status = null;
		this.onComplete = cbComplete;
		this.onError = cbError;

		this.request = new XMLHttpRequest();
		this.request.onreadystatechange = function () {
			self.state = this.readyState;
			if (this.readyState == 4 && !self.completed) {
			    try {
			        self.status = this.status;
			        self.statusText = this.statusText;

					if (this.status == 200) {
					    self.responseXML = self.request.responseXML;
					    self.responseText = self.request.responseText;
					    if (self.onComplete)
					        self.onComplete.call(self);
					}
					else
					    throw new Error(this.status, self.statusText);
				}
				catch(error) {
				    if (self.onError)
				        self.onError.call(self, error); // 1.2
					else
						throw error;
				}
				finally {
				    self.request = null;
				}
			}
        };

        this.load = function(method){
            if (!self.url)
                throw new Error("Invalid manifest url");
            if (!method)
                method = "GET";
            self.request.open(method, self.url, true);
            self.request.send();
        };
    }
	
    function _findAPI(win, apiName) {
		for(var count=0, api; count < 500 && win; count++) {
			api = win[apiName];
			if (typeof(api) !== "undefined")
				return api;
			if (win === win.parent)
				break;
			win = win.parent;
		}
		return null;
    }

    function _args4(a) {
        switch (a.length) {
            case 1:
                return [a[0], undefined, undefined, undefined];

            case 2:
                return (typeof (a[1]) === "function") ? [a[0], undefined, a[1], undefined] : [a[0], a[1], undefined, undefined];

            case 3:
                return (typeof (a[1]) === "function") ? [a[0], undefined, a[1], a[2]] : [a[0], a[1], a[2], undefined];

            case 4:
                return a;
        }
        return [undefined, undefined, undefined, undefined];
    }

    function _return(cb, value) {
        if (Function.isFunction(cb))
            cb.call(this, value);
        return value;
    }


    function SCORM12(scorm, api) {
        var self = scorm,
		    _supportedExitMode = ["time-out", "suspend", "logout"],
		    _supportedStatus = ["completed", "passed", "failed", "incomplete", "browsed", "not attempted"];

        if (arguments.length < 2 || !api)
            api = _findAPI(window, _apiName_["1.2"]);

		if (!api && window.opener)
		    api = _findAPI(window.opener, _apiName_["1.2"]);
		if (!api)
		    throw new Error("No SCORM 1.2 API found or it is too deeply nested.");

		function _call(cb, value) {
		    return _return.call(self, cb, value);
		}

		self.getInternal = function (name, success, fail) {
		    switch (String.prototype.toLowerCase.call(name)) {
		        case "api_name":
		            return _call(success, "API");
		        case "student_id":
		            return _call(success, "cmi.core.student_id");
		        case "student_name":
		            return _call(success, "cmi.core.student_name");
		        case "status":
		            return _call(success, "cmi.core.lesson_status");
		        case "raw_score":
		            return _call(success, "cmi.core.score.raw");
		        case "bookmark":
		            return _call(success, "cmi.core.lesson_location");
		        case "suspend_data":
		            return _call(success, "cmi.suspend_data");
		        case "supported_status":
		            return _call(success, _supportedStatus);
		        case "supported_exitmode":
		            return _call(success, _supportedExitMode);
		        case "exit":
		            return _call(success, "cmi.core.exit");
		    }
		    _throwError(self, 0, "Unknow '" + name + "' property", fail);
		    return null;
		};
			
		self.getLastError = function () {
			return api.LMSGetLastError();
		};
			
		self.getErrorString = function (errorCode) {
			return api.LMSGetErrorString(errorCode);
		};
				
		self.initAPI = function () {
            if (!self.initialized) {
                if (!_isError(api.LMSInitialize("")))
                    self.initialized = true;
            }
            if (self.initialized) {
                self.studentId = self.getStudentId();
                self.studentName = self.getStudentName();
                return true;
            }
			return false;
		};
				
		self._terminator = function () {
		    if (!self.terminated) {
				if (_isError(api.LMSFinish("")))
				    _throwError(self);
				self.terminated = true;
			}
		};

		self.exit = function (exitMode, commit) {
			if (typeof(exitMode) === "undefined" || exitMode == null) 
				exitMode = "";
			else {
				if (typeof(exitMode) !== "string")
				    _throwError(self, 405, "Invalid exit mode type.");
				exitMode = exitMode.toString();
				if (Array.indexOf(_supportedExitMode, exitMode) == -1)
				    _throwError(self, 405, "Invalid exit mode.");
			}
			if (typeof(commit) == "undefined")
				commit = true;					
			self.setValue("cmi.core.exit", exitMode, commit);
		};

		self.commit = function () {
			return api.LMSCommit("");
		};

		self.getValue = function (variable, success, fail) {
		    if (!self.initialized)
		        _throwError(self, 101, "Scorm not initialized.", fail);
		    else {
		        if (self.terminated)
		            _throwError(self, 101, "Scorm terminated.", fail);
		        else {
		            var value = api.LMSGetValue(variable);
		            var err = api.LMSGetLastError();
		            if (err != 0)
		                _throwError(self, err, null, fail);
		            else {
		                if (Function.isFunction(success))
		                    success.call(self, value);
		            }
		            return value;
                }
            }
		};
				
		self.setValue = function (variable, value, commit, success, fail) {
		    if (!self.initialized)
		        _throwError(self, 101, "Scorm not initialized.", fail);
		    else {
		        if (self.terminated)
		            _throwError(self, 101, "Scorm terminated.", fail);
		        else {
		            if (value && typeof (value) === "object" && JSON)
		                value = JSON.stringify(value);
		            if (_isError(api.LMSSetValue(variable, value)))
		                _throwError(self, null, null, fail);
		            else {
		                if (typeof (commit) === "undefined" || commit == null)
		                    commit = self.autoCommit;
		                if (commit && _isError(self.commit()))
		                    _throwError(self, null, null, fail);
		                else
		                    if (Function.isFunction(success))
		                        success.call(self, variable, value);
		            }
		        }
		    }
		};

		self.isFirstEntry = function () {
		    var entry = self.getValue("cmi.core.entry");
			return (entry == "ab-initio") ? true : false;
		};
			
		self.isResume = function () {
		    var entry = self.getValue("cmi.core.entry");
			return (entry == "resume") ? true : false;
		};

		self.isBrowseMode = function () {
		    var mode = self.getValue("cmi.core.lesson_mode");
			return (mode == "browse") ? true : false;
		};

		self.isNormalMode = function () {
		    var mode = self.getValue("cmi.core.lesson_mode");
			return (mode == "normal") ? true : false;
		};
			
		self.isReviewMode = function () {
		    var mode = self.getValue("cmi.core.lesson_mode");
			return (mode == "review") ? true : false;
		};
			
		return api;
    };
	
    function SCORM2004(scorm, api) {
        var self = scorm,
            _supportedExitMode = ["suspend", "normal"],
            _supportedStatus = ["not attempted", "completed", "incomplete"];

        if (arguments.length < 2 || !api)
            api = _findAPI(window, _apiName_["2004"]);

		if (!api && window.opener)
		    api = _findAPI(window.opener, _apiName_["2004"]);
		if (!api)
			throw new Error("No SCORM 2004 API found or it is too deeply nested.");				

		function _call(cb, value) {
		    return _return.call(self, cb, value);
		}

		self.getInternal = function (name, success, fail) {
		    switch (String.prototype.toLowerCase.call(name)) {
		        case "api_name":
		            return _call(success, "API_1484_11");
		        case "student_id":
		            return _call(success, "cmi.learner_id");
		        case "student_name":
		            return _call(success, "cmi.learner_name");
		        case "status":
		            return _call(success, "cmi.success_status");
		        case "raw_score":
		            return _call(success, "cmi.score.raw");
		        case "bookmark":
		            return _call(success, "cmi.location");
		        case "suspend_data":
		            return _call(success, "cmi.suspend_data");
		        case "supported_status":
		            return _call(success, _supportedStatus);
		        case "supported_exitmode":
		            return _call(success, _supportedExitMode);
		        case "exit":
		            return _call(success, "cmi.exit");
		    }
		    _throwError(self, 0, "Unknow '" + name + "' property", fail);
		    return null;
		};

		self.getLastError = function () {
			return api.GetLastError();
		};
			
		self.getErrorString = function (errorCode) {
			return api.GetErrorString(errorCode);
		};
														
		self.initAPI = function () {
		    if (!self.initialized) {
		        if (api.Initialize("") == "true")
		            self.initialized = true;
		    }
		    if (self.initialized) {
			    self.studentId = self.getStudentId();
			    self.studentName = self.getStudentName();
				return true;
			}
			return false;
		};
			
		self._terminator = function () {
			var result = false;
			if (!self.terminated) {
				api.Terminate("");
				if (result && (result.toLowerCase() == "true" || result == true))
				    self.terminated = true;
			}
			return result;
		};
			
		self.exit = function (exitMode, commit) {
			if (typeof(exitMode) === "undefined" || exitMode == null) 
				exitMode = "";
			else {
				if (typeof(exitMode) !== "string")
				    _throwError(self, 405, "Invalid exit mode type");
				exitMode = exitMode.toString();
				if (Array.indexOf(_supportedExitMode, exitMode) == -1)
				    _throwError(self, 405, "Invalid exit mode");
			}
			if (typeof(commit) == "undefined")
				commit = true;					
			return api.setValue("cmi.exit", exitMode, commit);
		};
			
		self.commit = function () {
			return api.Commit("");
		};
		
		self.getValue = function (variable, success, fail) {
		    if (!self.initialized)
		        _throwError(self, 101, "Scorm not initialized.", fail);
		    else {
		        if (self.terminated)
		            _throwError(self, 101, "Scorm terminated.", fail);
		        else {
		            var value = api.GetValue(variable);
		            var err = api.GetLastError();
		            if (err != 0)
		                _throwError(self, err, null, fail);
		            else {
		                if (Function.isFunction(success))
		                    success.call(self, value);
		            }
		            return value;
		        }
		    }
		};
				
		self.setValue = function (variable, value, commit, success, fail) {
		    if (!self.initialized)
		        _throwError(self, 101, "Scorm not initialized.", fail);
		    else {
		        if (self.terminated)
		            _throwError(self, 101, "Scorm terminated.", fail);
		        else {
		            if (value && typeof (value) === "object" && JSON)
		                value = JSON.stringify(value);
		            if (_isError(api.SetValue(variable, value)))
		                _throwError(self, null, null, fail);
		            else {
		                if (typeof (commit) === "undefined" || commit == null)
		                    commit = self.autoCommit;
		                if (commit && _isError(self.commit()))
		                    _throwError(self, null, null, fail);
		                else
		                    if (Function.isFunction(success))
		                        success.call(self, variable, value);
		            }
		        }
		    }
		};
				
		// not implemented
		self.isFirstEntry = function () {
		    _throwError(self, 101, "Not implemented");
		};
			
		// not implemented
		self.isResume = function () {
		    _throwError(self, 101, "Not implemented");
		};

		// not implemented
		self.isBrowseMode = function () {
		    _throwError(self, 101, "Not implemented");
		};

		// not implemented
		self.isNormalMode = function () {
		    _throwError(self, 101, "Not implemented");
		};
			
		// not implemented
		self.isReviewMode = function () {
		    _throwError(self, 101, "Not implemented");
		};
			
		self.getScaledScore = function (success, fail) {
		    return self.getValue("cmi.score.scaled", success, fail);
		};
			
		self.setScaledScore = function (score, commit) {
			if (Math.abs(score) > 1)
				score = score / 100.0;
			self.setValue("cmi.score.raw", score, commit);
		};

		self.getCompletionStatus = function () {
		    return self.getValue("cmi.completion_status");
		};
			
		self.setCompletionStatus = function (value, commit) {
			if (typeof(status) !== "string" || !status)
				_throwError(405, "Invalid completion status type.");
			value = value.toLowerCase();
			if (Array.indexOf(_supportedStatus, value) == -1)
				_throwError(405, "Invalid completion status value.");
			self.setValue("completion_status", value, commit);
		};

		return api;
    }

    function callOnce(obj, fn) {
        if (typeof (obj[fn]) === "function") {
            var f = obj[fn];
            obj[fn] = null;
            f.call(obj);
        }
    }
		
	trc.ScormProvider = function(config) {
	    var self = this,
            _token = (new Date()).getTime(),
            _manifestUrl = null,
            _manifestSuccess = null,
            _manifestFail = null,
            _manifest = null,
		    _scormVersion = null,
            _title = null,
            _api = null,
            _attached = false,
            _invitePool = {},
		    _nextInviteId = 0,
	        _listening = null,
		    _keepInvite = false;

	    window["scorm" + _token.toString()] = self; // just to make sure the instance doesn't get disposed by GC

		this.initialized = false;
		this.terminated = false;
		this.autoCommit = true;
		this.lastError = 0;
		this.studentId = null;
		this.studentName = null;
		this.onSuccess = null;
		this.onError = null;
		this.onTerminate = null;

        //#region Provider private members
		function onUnload() {
		    try {
		        if (self.onTerminate)
		            self.onTerminate.call(self);
		    }
		    catch (err) {
		    }
		    try {
		        self.terminate();
		    }
		    catch (err) {

		    }
		}

		function attachAPI(api) {
		    try {
		        if (!_attached && _scormVersion) {
		            if (_scormVersion == "1.2")
		                _api = SCORM12(self, api);
		            else {
		                if (String.prototype.substring.call(_scormVersion, 0, 4) == "2004") // "CAM 1.3" - 2004 2nd edition, "2004 3rd Edition", "2004 4th Edition"
		                    _api = SCORM2004(self, api);
		            }
		        }
		        if (!_api)
		            _throwError(self, 101, "Unsupported SCORM API version '" + _scormVersion + "'");
		        _attached = true;

		        if (!self.initialized) {
		            if (typeof(self.initAPI) !== "function")
		                _throwError(self, 101, "Interface '" + _scormVersion + "' doesn't implement initAPI() method.");

		            if (self.initAPI.call(self) == false)
		                _throwError(self, 101, "API initialization error");
		        }

		        TRC.addEventListener(window, "unload", onUnload);
		        
		        callOnce(self, "onSuccess");
		    }
		    catch (err) {
		        callOnce(self, "onError");
		    }
		}

		function postResponse(request, status, response) {
		    var msg = {
		        token: _token,
		        msg: "scorm-response",
		        mid: request.data.mid,
		        status: status
		    };
		    if (Array.isArray(response) && response.length > 0)
		        msg.response = response;
		    TRC.postMessage(request.source, msg, request.origin);
		}

		function providerListener(evt) {
		    var msg = TRC.acceptMessage(evt);
		    if (msg && msg.data.token == _token) {
		        try {
		            var m = msg.data;
		            switch (m.msg) {
		                case "scorm-connect":
		                    if (m.args) {
		                        var invite = _invitePool[m.args.inviteId];
		                        if (invite && !invite.accepted) {
		                            invite.accept(msg);
		                            postResponse(msg, 200, [_scormVersion, self.getStudentId(), self.getStudentName(), self.getStatus()]);
		                        }
                            }
		                    break;

		                case "scorm-call":
		                    var method = self[m.method];
		                    if (!Function.isFunction(method))
		                        throw new Error("SCORM Provider doesn't support method '" + m.method + "'.");
		                    var args = Array.isArray(m.args) ? m.args : [];
		                    postResponse(msg, 200, [method.apply(self, args)]);
		                    break;

		                case "scorm-invite":
		                    var invite = _invitePool[m.args.inviteId];
		                    if (!invite)
		                        throw new Error("Invalid inviteId");

		                    var target = (invite.originalTarget || invite.target);
		                    if (TRC.isFrame(target))
		                        target = target.contentWindow;

		                    setTimeout(function () {
		                        invite.send(target);
		                    }, 3000);
		                    break;
		            }
		        }
		        catch (error) {
		            postResponse(msg, 500, [ScormError.unwrap(error)]);
		        }
		    }
		}

		function beginListen() {
		    if (!_listening) {
		        _listening = arguments.length > 0 ? arguments[0] : window;
		        TRC.addEventListener(_listening, "message", providerListener, false);
		    }
		}

		function stopListen() {
		    if (_listening) {
		        TRC.removeEventListener(_listening, "message", providerListener);
		        _listening = null;
		    }
		}

		function _getValue(name, success, fail) {
		    var name = self.getInternal(name);
		    if (!name)
		        _throwError(self, 0, "Invalid internal '" + name + "' parameter", fail);
		    return self.getValue(name, success, fail);
		};

		function _setValue(name, value, commit, success, fail) {
		    var name = self.getInternal(name);
		    if (!name)
		        _throwError(self, 0, "Invalid internal '" + name + "' parameter", fail);
		    else
		        self.setValue(name, value, commit, success, fail);
		};

		function _getJSONValue(name, success, fail) {
		    var failed = false, onfail = (Function.isFunction(fail) ? function () {
		        failed = true;
		        fail.apply(self, Array.toArray(arguments));
		    } : null);
		    var name = self.getInternal(name);
		    if (!name) {
		        _throwError(self, 0, "Invalid internal '" + name + "' parameter", fail);
		    }
		    else {
		        var value = self.getValue(name, null, onfail);
		        if (!failed) {
		            if (value && JSON)
		                value = JSON.parse(value);
		            if (Function.isFunction(success))
		                success.call(self, value);
		        }
		        return value;
		    }
		};

		function _setJSONValue(name, value, commit, success, fail) {
		    var name = self.getInternal(name);
		    if (!name)
		        _throwError(self, 0, "Invalid internal '" + name + "' parameter", fail);
		    else {
		        if (value && JSON)
		            value = JSON.stringify(value);
		        self.setValue(name, value, commit, success, fail);
		    }
		};

		function Invite(target) {
		    var _this = this,
		        _timer = 0;

		    this.id = ++_nextInviteId;
		    this.target = target || null;
		    this.accepted = false;
		    this.expires = 0;

		    this.msg = {
		        msg: "scorm-invite",
		        token: _token,
		        inviteId: this.id,
		        version: _scormVersion
		    };		    
		    
		    this.send = function (target) {
		        if (arguments.length > 0)
		            _this.target = target;

		        _this.accepted = false;
		        //_this.expires = Date.time() + 60000; //invite expires after 60 seconds

		        _timer = setInterval(function () {
		            try {
		                if (_this.expires && Date.time() >= _this.expires) {
		                    _this.dispose();
		                }
		                else {
		                    TRC.postMessage(_this.target, _this.msg, "*");
		                    _log("Invite #" + _this.id + ".send()");
		                }
		            }
		            catch (err) {
		                _log("Invite.send() error - " + TRC.getErrorMessage(err));
		           }
		        }, 100); // DEBUG, in release make sure value is in 250 ms range
		    };

		    this.cancel = function () {
		        if (_timer) {
		            clearInterval(_timer);
		            _timer = 0;
		        }
                _this.expires = 0;
		    };

		    this.dispose = function () {
		        _this.cancel();
		        try {
		            delete _invitePool[_this.id];
		        }
		        catch (err) {
		        }
		    };

		    this.accept = function (msg) {
		        _this.cancel();
		        _this.target = msg.source;
		        _this.origin = msg.origin;
		        _this.accepted = true;
		    };

		    this.formatUrl = function (url) {
		        return TRC.setUrlValues(url, { "scorm-invite": _token + "." + _this.id });
		    };

		    _invitePool[this.id] = this;
		}
        //#endregion

	    //#region Provider public members
		this.isProxy = function () {
		    return false;
		}

		this.getToken = function () {
		    return _token;
		};

		this.getVersion = function () {
		    return _scormVersion;
		}

		this.getTitle = function () {
		    return _title;
		};

		this.getAPI = function () {
		    return _api;
		};

		this.initialize = function (success, fail) {
		    if (arguments.length > 0) {
                self.onSuccess = success;
		        if (arguments.length > 1)
		            self.onError = fail;
		    }

		    if (!_attached) {
                if (_scormVersion)
		            attachAPI(_api);
		        else {
		            if (_manifest) // perhaps the manifest is still loading
		                _manifestSuccess = function () {
		                    attachAPI(_api);
		                }
		            else
		                _throwError(self, 101, "Unknown version of SCORM API.", self.onError);
		        }
		    }

		    if (self.initialized)
		        callOnce(self, "onSuccess");
		};

		this.isInitialized = function () {
		    return self.initialized;
		};

		this.getInternal = function (name, success, fail) {
		    switch (name) {
		        case "version":
		            return _return.call(self, success, _scormVersion);
		    }
		    _throwError(self, null, "SCORM Provider doesn't support 'getInternal' method.", fail);
		};

		this.getStudentId = function (success, fail) {
		    return _getValue("student_id", success, fail);
		};

		this.getStudentName = function (success, fail) {
		    return _getValue("student_name", success, fail);
		};

		this.getStatus = function (success, fail) {
		    return _getValue("status", success, fail);
		};

		this.setStatus = function (status, commit, success, fail) {
			if (typeof (status) !== "string" || !status)
				_throwError(self, 405, "Invalid status argument value", fail);
			else {
			    var ss = self.getInternal("supported_status"),
                    si = Array.indexOf(ss, status.toLowerCase());
			    if (si == -1)
			        _throwError(self, 405, "Unknown status value", fail);
                else
				    _setValue("status", ss[si], commit, success, fail);
			}
		};

		this.getScore = function (success, fail) {
		    return _getValue("raw_score", success, fail);
		};

		this.setScore = function (score, commit, success, fail) {
		    _setValue("raw_score", score, commit, success, fail);
		};

		this.getBookmark = function (success, fail) {
		    return _getJSONValue("bookmark", success, fail);
		};

		this.setBookmark = function (value, commit, success, fail) {
		    _setJSONValue("bookmark", value, commit, success, fail);
		};

		this.getSuspendData = function (success, fail) {
		    return _getJSONValue("suspend_data", success, fail);
		};

		this.setSuspendData = function (value, commit, success, fail) {
		    _setJSONValue("suspend_data", value, commit, success, fail);
		};

		this._terminator = null;
		this.terminate = function (success, fail) {
		    try {
		        stopListen();
		        if (!self.terminated) {
		            if (typeof(self._terminator) === "function")
		                self._terminator.apply(self, Array.toArray(arguments));
		            self.terminated = true;
		        }
		        if (typeof(success) === "function")
		            success.call(self);
		    }
		    catch (error) {
		        _throwError(self, null, TRC.getErrorMessage(error), fail);
		    }
		};

		this.newInvite = function () {
		    return arguments.length > 0 ? new Invite(arguments[0]) : new Invite();
		};

		this.isListening = function () {
		    return _listening ? true : false;
		};

		this.beginListen = beginListen;

		this.stopListen = stopListen;

		this.navigateTo = function (course) {
		    var target = Object.resolve(course, "target"),
                url = Object.resolve(course, "url"),
                meta = String.ifEmpty(Object.resolve(course, "meta"), "<meta http-equiv='X-UA-Compatible' content='IE=edge'/>"),
                method = Object.resolve(course, "method"),
		        invite = null;
            if (!target)
                throw new Error("Invalid target");
		    if (!url)
		        throw new Error("Invalid course url");

		    function scormPopupUrl() {
		        var popup = _path_ + "scormpopup" + (_config_.debug ? "" : ".min") + ".html",
		            params = { scormtoken: self.getToken(), url: url };
		        if (method)
		            params.method = method;
		        return TRC.setUrlValues(popup, params);
		    }

		    if (typeof (target) == "string") {
		        if (TRC.Browser.ie || TRC.Browser.safari || method == "post") { //&& TRC.Browser.ie < 10
		            target = window.open(scormPopupUrl(), "_blank", target, true);
		        }
		        else {
		            invite = new Invite();
		            target = window.open(invite.formatUrl(url), "_blank", target, true);
		            invite.send(target);
		        }
		    }
		    else {
		        if (TRC.isWindow(target)) {
		            if (TRC.Browser.ie && TRC.Browser.ie < 10) {
		                target.document.location = scormPopupUrl();
		                /*
		                function jsScript(src) {
		                    return "<script type=\"text/javascript\" src=\"" + src + "\"></script>\r\n";
		                }
                        var doc;
                        try {
                            doc = target.document.open();
                            doc.write("<!DOCTYPE html><html><head>" + meta + "\n" + jsScript(_path_ + "trc.js") + jsScript(_path_ + "trc.scorm.js") +
    "<script type=\"text/javascript\">function _err(step, err) {return alert(step + ' error: ' + TRC.getErrorMessage(err));}\n\
    function loadCourse() { try { var frame = document.getElementById('course'), scorm = new TRC.ScormProvider({version: \"" + self.getVersion() + "\"});\n\
    scorm.initialize(function () { debugger; try { var invite = scorm.newInvite(), url = invite.formatUrl(\"" + url + "\"); frame.src=url; invite.send(frame.contentWindow);} catch(err) { _err('SCORM Invite', err);} }, function (err) { _err(\"SCORM initialization\", err);} );\n\
    } catch(err) { _err('Popup Load', err); } }</script></head><body onload='loadCourse()'><iframe id='course' style='position:absolute;top:50px;width:100%;height:100%;border-style:none' frameBorder=1></iframe></body></html>");
                        }
                        finally {
                            if (doc)
                                doc.close();
                        }
                        */
		            }
		            else {
		                invite = new Invite();
		                invite.originalTarget = target;
		                target.document.location = invite.formatUrl(url);
		                invite.send(target);
		            }
		        }
		        else {
		            if (TRC.isFrame(target)) {
		                invite = new Invite();
		                invite.originalTarget = target;
		                target.src = invite.formatUrl(url);
                        invite.send(target.contentWindow);
		            }
		            else
		                throw new Error("Unsupported target type: " + target.toString());
		        }
		    }
		};

        // obsolete
		this.loadCourse = this.navigateTo;
        //#endregion

		if (!Object.isNull(config)) {
		    var relay = Object.resolve(config, "relay");
		    if (relay) {
		        _api = relay.getAPI();
		        _scormVersion = relay.getVersion();
		        self.initialized = relay.isInitialized();
		        relay.stopListen();
            }
		    else {
		        _scormVersion = String.ifEmpty(Object.resolve(config, "version"), null);
		        _manifestUrl = String.ifEmpty(Object.resolve(config, "manifest"), null);
		        _manifestFail = Function.isFunction(config["manifestFail"]) ? config["manifestFail"] : null;
		        _keepInvite = Boolean.parseBoolean(Object.resolve(config, "keepInvite"), false);
		    }
		}

		beginListen();

		if (!_scormVersion) {
		    _manifest = new ManifestFile(_manifestUrl,
                function () {
                    try {
                        if (this.responseXML && typeof (this.responseXML.getElementsByTagName) !== "undefined") {
                            var schemaVersion = this.responseXML.getElementsByTagName('schemaversion'),
                                org = this.responseXML.getElementsByTagName("organization");
                            if (schemaVersion && schemaVersion[0] && schemaVersion[0].childNodes[0])
                                _scormVersion = String.trim(schemaVersion[0].childNodes[0].nodeValue);
                            if (org && org[0] && org[0].childNodes) {
                                var org = org[0].childNodes[0];
                                while(org) {
                                    if (org.nodeName && org.nodeName.toLowerCase() == "title" && org.childNodes && org.childNodes.length > 0) {
                                        _title = String.trim(org.childNodes[0].nodeValue);
                                        break;
                                    }
                                    org = org.nextSibling;
                                }
                            }                            
                        }
                        if (!_scormVersion)
                            _throwError(self, 101, "Manifest file '" + _manifest.url + "' didn't provide SCORM API version.");
                        if (_manifestSuccess) {
                            _manifestSuccess.call(self);
                            _manifestSuccess = null;
                        }
                    }
                    catch (error) {
                        if (_manifestFail)
                            _manifestFail.call(self, error);
                        else
                            throw error;
                    }
                },
                function () {
                    var error = new Error(this.status, this.statusText);
                    if (_manifestFail)
                        _manifestFail.call(self, error);
                    else
                        throw error;
                }
            );
		    _manifest.load();
        }
	};

	trc.ScormProxy = function () {
	    var self = this,
            _domain = document.domain.toString(),
            _urlInfo = TRC.parseUrl("" + window.document.location),
            _scormInvite = String.ifEmpty(_urlInfo.query["scorm-invite"], ""),
            _parsedInvite = _scormInvite.split('.'),
            _token = String.ifEmpty(Array.pick(_parsedInvite, 0), null),
            _inviteId = Array.pick(_parsedInvite, 1, 0),
            _listening = false,
            _listerTarget = null,
            _scormProvider = null,
            _scormOrigin = "*",
            _scormVersion = undefined,
            _initialized = false,
	        _initSuccess = null,
            _initFail = null,
            _messageQueue = {},
	        _nextMessageId = 0,
            _studentId = undefined,
            _studentName = undefined,
	        _messageChannel = null;


	    //#region Proxy private members
	    function ProxyMessage(type, success, fail, method, args) {
	        this.mid = ++_nextMessageId;
	        this.type = type;
	        this.success = Function.isFunction(success) ? success : null;
	        this.fail = Function.isFunction(fail) ? fail : null;
	        if (method)
	            this.method = method;
	        if (arguments.length > 4)
	            this.args = args;
	        _messageQueue[this.mid] = this;
	    }

	    function postMessage(msg) {
	        if (!_scormProvider)
	            throw new Error("Invalid scorm provider window.");
	        var m = {
	            domain: _domain,
	            token: _token,
	            msg: msg.type,
	            mid: msg.mid
	        };
	        if (msg.method)
	            m.method = msg.method;
	        if (msg.args)
	            m.args = msg.args;
	        TRC.postMessage(_scormProvider, m, _scormOrigin);
	    }

	    function proxyListener(evt) {
	        var msg = TRC.acceptMessage(evt);
	        if (!msg || msg.data.token != _token)
	            return;

	        var m = msg.data;
	        switch (m.msg) {
	            case "scorm-invite":
	                if (!_scormProvider && m.inviteId == _inviteId) {
	                    _scormProvider = msg.source;
	                    _scormOrigin = msg.origin;
	                    _scormVersion = m.version;
	                    postMessage(new ProxyMessage("scorm-connect", _initSuccess, _initFail, null, {
	                        inviteId: _inviteId
	                    }));
	                }
	                break;

	            case "scorm-response":
	                if (_messageQueue) {
	                    try {
	                        var qm = _messageQueue[m.mid];
	                        if (qm) {
	                            if (m.status == 200) {
	                                if (qm.success)
	                                    qm.success.apply(msg, m.response);
	                            }
	                            else {
	                                if (qm.fail)
	                                    qm.fail.apply(msg, m.response);
	                            }
	                        }
	                    }
	                    catch (err) {
	                    }
	                    finally {
	                        delete _messageQueue[m.mid];
	                    }
	                }
	                break;
	        }
	    }

	    function proxyListener2(evt) {
	        if (evt) {
	            if (evt.data) {

	            }
	        }
	    }

	    function resetMessageQueue() {
	        _nextMessageId = 0;
	        _messageQueue = {};
	    }

	    function startProxyListen() {
	        if (!_listening) {
	            resetMessageQueue();
	            if (!_listerTarget)
	                _listerTarget = window;
	            TRC.addEventListener(_listerTarget, "message", proxyListener, false);
	            _listening = true;
	        }
	    }

	    function startProxyListen2() {
	        if (!_listening) {
	            resetMessageQueue();
	            _messageChannel = new MessageChannel();
	            _messageChannel.port1.onmessage = proxyListener2;
	            _listening = true;
	        }
	    }

	    function stopListen() {
	        if (_listening) {
	            _listening = false;
	            if (_listerTarget)
	                TRC.removeEventListener(_listerTarget, "message", proxyListener);
	        }
	    }

	    function _call(method, args, success, fail) {
	        postMessage(new ProxyMessage("scorm-call", success, fail, method, args));
	    }
	    //#endregion

	    //#region Proxy public members
	    this.isProxy = function () {
	        return true;
	    };

	    this.navigateTo = function (loc, onFail) {

	        if (!Function.isFunction(onFail))
	            onFail = null;

	        var url, method;
	        switch(typeof (loc)) {
	            case "string":
	                url = loc;
	                break;

                case "object":
	                url = Object.resolve(loc, "url");
	                method = Object.resolve(loc, "method");
	                break;
	        }

            method = String.isEmpty(method) ? "get" : String.toLowerCase(method);

	        postMessage(new ProxyMessage("scorm-invite", null, onFail, null, {
                method: method,
	            token: _token,
	            inviteId: _inviteId
	        }));

	        stopListen();

	        if (url) {
	            url = TRC.setUrlValues(url, { "scorm-invite": _scormInvite });
	            document.location = url;
	        }

	        return true;
	    };

	    this.getToken = function () {
	        return _token;
	    };

	    this.getVersion = function () {
	        return _scormVersion;
	    };

	    this.getScormInvite = function () {
	        return _scormInvite;
	    };

	    this.isInitialized = function () {
	        return _initialized;
	    };

	    this.getAPI = function () {
	        return null;
	    };

	    this.isListening = function () {
	        return _listening;
	    };

	    this.isInitialized = function () {
	        return self.initialized;
	    };

	    this.initialize = function (success, fail) {
	        if (typeof (success) == "function") {
	            if (_initialized) {
	                success.call(self);
	            }
	            else {
	                _initSuccess = (typeof (success) == "function") ? success : null;
	                _initFail = (arguments.length > 2 && typeof (fail) == "function") ? fail : null;
	            }
	        }
	        startProxyListen();
	    };

	    this.getInternal = function (name, success, fail) {
	        if (name == "version") {
	            return _return.call(self, success, _scormVersion);
	        }
	        _call("getInternal", [name], success, fail);
	    }

	    this.getLastError = function (success, fail) {
	        _call("getLastError", null, success, fail);
	    }

	    this.getErrorString = function (errorCode, success, fail) {
	        _call("getErrorString", [errorCode], success, fail);
	    }

	    this.terminate = function (success, fail) {
	        _call("terminate", null, function () {
	            stopListen();
	            resetMessageQueue();
	            if (Function.isFunction(success))
	                success.call(self);
	        },
            fail);
	    }

	    this.exit = function (exitMode, commit, success, fail) {
	        var a = _args4(arguments);
	        _call("exit", [a[0], a[1]], a[2], a[3]);
	    }

	    this.commit = function (success, fail) {
	        _call("commit", null, success, fail);
	    }

	    this.getValue = function (variable, success, fail) {
	        _call("getValue", [variable], success, fail);
	    }

	    this.setValue = function (variable, value, commit, success, fail) {
	        _call("setValue", [variable, value, commit], success, fail);
	    }

	    this.getStudentId = function (success, fail) {
	        if (_studentId == undefined)
	            _call("getStudentId", null, success, fail);
	        else {
	            if (success)
	                success.call(self, _studentId);
	        }
	        return _studentId;
	    }

	    this.getStudentName = function (success, fail) {
	        if (_studentName == undefined)
	            _call("getStudentName", null, success, fail);
	        else {
	            if (success)
	                success.call(self, _studentName);
	        }
	        return _studentName;
	    }

	    this.isBrowseMode = function (success, fail) {
	        _call("isBrowseMode", null, success, fail);
	    };

	    this.isNormalMode = function (success, fail) {
	        _call("isNormalMode", null, success, fail);
	    };

	    this.isReviewMode = function (success, fail) {
	        _call("isReviewMode", null, success, fail);
	    };

	    this.getStatus = function (success, fail) {
	        _call("getStatus", null, success, fail);
	    }

	    this.setStatus = function (status, commit, success, fail) {
	        var a = _args4(arguments);
	        _call("setStatus", [a[0], a[1]], a[2], a[3]);
	    }

	    this.getScore = function (success, fail) {
	        _call("getScore", null, success, fail);
	    }

	    this.setScore = function (score, commit, success, fail) {
	        var a = _args4(arguments);
	        _call("setScore", [a[0], a[1]], a[2], a[3]);
	    }

	    this.getBookmark = function (success, fail) {
	        _call("getBookmark", null, success, fail);
	    }

	    this.setBookmark = function (value, commit, success, fail) {
	        var a = _args4(arguments);
	        _call("setBookmark", [a[0], a[1]], a[2], a[3]);
	    }

	    this.getSuspendData = function (success, fail) {
	        _call("getSuspendData", null, success, fail);
	    }

	    this.setSuspendData = function (value, commit, success, fail) {
	        var a = _args4(arguments);
	        _call("setSuspendData", [a[0], a[1]], a[2], a[3]);
	    }
	    //#endregion
	};

	trc.ScormAPI = function () {
	    var url = TRC.parseUrl("" + window.location);
	    return (url && url.query.hasOwnProperty("scorm-invite")) ? new TRC.ScormProxy() : new TRC.ScormProvider((arguments.length > 0 ? Object.merge({}, arguments[0]) : null));
	};

	function FakeScorm(version) {
	    var self = this,
	        apiName = _apiName_[version.toString()];

	    if (!apiName)
	        return null;

	    window[apiName] = self;

	    //#region service methods
	    function _setCookie(name, value, days, hours, mins) {
	        if (self.cookiePrefix)
	            name = self.cookiePrefix + "." + name;
	        var cookie = TRC.formatCookie(name, value, null, days, hours, mins, !self.escapeData);
	        if (cookie != null) {
	            if (TRC.Browser.ie && cookie.length > 4080)
	                throw new Error(_FILE_ + ": cookie size exceeds 4096 character limit!\r\nYour progress can't be saved!\r\nKeep your browser open and contact technical support immediately.");
	            document.cookie = cookie;
	        }
	    };

	    function _getCookie(name) {
	        if (self.cookiePrefix)
	            name = self.cookiePrefix + "." + name;
	        return TRC.getCookie(name, !self.escapeData);
	    };
	    //#endregion

	    this.vendor = "TRC";
	    this.lastError = 0;
	    this.errors = {};
	    this.initialized = false;
	    this.dirty = false;

	    this.data = {
	        "cmi.core.student_id": "FAKE-STUDENT-ID",
	        "cmi.core.student_name": "FAKE-STUDENT-NAME",
	        "cmi.core.entry": "ab-initio",
	        "cmi.core.lesson_mode": "normal",
	        "cmi.core.lesson_status": "not attempted",
	        "cmi.core.score.raw": NaN,
	        "cmi.core.lesson_location": null,
	        "cmi.suspend_data": null
	    };

	    this.escapeData = !TRC.Browser.ie;
	    this.expirationDate = null;
	    this.commitOnly = ["cmi.core.score.raw", "cmi.core.lesson_status", "cmi.suspend_data", "cmi.core.lesson_location"];

	    this.LMSGetLastError = function () {
	        return self.lastError;
	    };

	    this.LMSGetErrorString = function (error) {
	        return self.errors.hasOwnProperty(error) ? self.errors[0] : "ErrorCode #" + error;
	    };

	    this.LMSInitialize = function (name) {
	        try {
	            if (ActiveXObject) {
	                var wsNet = new ActiveXObject("WScript.Network");
	                if (wsNet) {
	                    self.data["cmi.core.student_id"] = wsNet.ComputerName;
	                    self.data["cmi.core.student_name"] = wsNet.UserName;
	                }
	            }
	        }
	        catch (error) {
	        }
	        for (var name in self.data) {
	            if (name != "cmi.core.student_id" && name != "cmi.core.student_name") {
	                var value = _getCookie(name);
	                if (value != null)
	                    self.data[name] = value;
	            }
	        }

	        self.initialized = true;
	        return true;
	    };

	    this.LMSFinish = function (name) {
	        if (!self.initialized)
	            return false;
	        self.initialized = false;
	        return true;
	    };

	    this.LMSSetValue = function (name, value) {
	        self.data[name] = value;
	        self.dirty = true;
	        return true;
	    };

	    this.LMSGetValue = function (name) {
	        return self.data[name];
	    };

	    this.LMSCommit = function (arg) {
	        var co = self.commitOnly;
	        var data = self.data;
	        if (co && co.length > 0) {
	            for (var i = 0; i < co.length; i++) {
	                _setCookie.call(self, co[i], data[co[i]], 1);
	            }
	        }
	        else {
	            for (var name in data) {
	                _setCookie.call(self, name, data[name], 1);
	            }
	        }
	        self.dirty = false;
	        return "true";
	    }
	}

	var fakeScorm = _config_["fakeScorm"],
        startup = _config_["startup"];

	if (fakeScorm) {
	    var version = null, scorm = null;
	    switch (typeof (fakeScorm)) {
	        case "boolean":
	            version = 1.2;
	            break;
	        case "number":
	            version = fakeScorm;
	            break;
	        default:
	            version = parseFloat(fakeScorm.toString());
	    }
	    scorm = new FakeScorm(version);
	    if (!scorm) {
	        if (!window.confirm(_FILE_ + ": Unsupported fake scorm version " + version+ "!\r\nExit application?"))
	            window.close();
	    }
	}

	if (startup) {
	    (function () {
	        switch (typeof (startup)) {
	            case "function":
	                startup();
	                break;

	            case "string":
	                eval("(function(){" + startup + "})();");
	                break;
	        }
	    })();
	}
})(TRC);
