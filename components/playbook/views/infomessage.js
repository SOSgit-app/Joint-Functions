define(["knockout", "trc/trc.spa", "playbook/models/themes"],
function (ko, SPA, Themes) {

    return function () {
        var self = SPA.CreateView(this),
            _message = null,
            _theme = null,
            _audio = null,
            _defaultTheme = null;
            
        this.Themes = Themes;
        this.message = ko.observable();
        this.theme = ko.observable();
        this.images = ko.observableArray([]);
        this.audio = ko.observable();
        this.audioControls = ko.observable(true);
        this.audioLoop = ko.observable(false);
        this.audioAutoplay = ko.observable(true);

        this.message.subscribe(function (val) {
            self.stopAudio();
            if (!_message || _message != val) {
                _message = val;
                self.theme(Themes.resolveTheme(Object.resolve(_message, "theme"), _defaultTheme));
                var images = [];
                var imgs = (typeof (val.images) === "string") ? val.images.split(/[,;]/gi) : Array.toArray(val.images);
                Array.foreach(imgs, function (i) {
                    if (i) {
                        switch (typeof (i)) {
                            case "string":
                                images.push({ src: i });
                                break;
                            case "object":
                                images.push(i);
                                break;
                        }
                    }
                });
                self.images(images);
                self.audio(_getAudio(val));
                _mapAudioPlayer();
                _showMessage();
            }
        });
        
        this.theme.subscribe(function (val) {
            if (_theme != val) {
                _theme = val;
            }
        });

        this.audio.subscribe(function (val) {
            self.audioControls(!!Object.resolve(val, 'controls'));
            self.audioAutoplay(!!Object.resolve(val, 'autoplay'));
            self.audioLoop(!!Object.resolve(val, 'loop'));
        });

        function _getAudio(message) {
            if (message && message.audio) {
                switch (typeof (message.audio)) {
                    case "string":
                        return {
                            src: message.audio,
                            autoplay: true
                        };

                    case "object":
                        if (!String.isEmpty(message.audio)) {
                            var audio = Object.merge({}, message.audio);
                            if (!audio.hasOwnProperty("controls"))
                                audio.controls = true;
                            return audio;
                        }
                        break;
                }
            }
            return null;
        }

        function _mapAudioPlayer() {
            var e = self.elements || {};
            if (e.dialog) {
                e.audio = TRC.selectFirst("div.trc-pbce.audio", e.dialog);
                e.audioPlayer = TRC.selectFirst(".player", e.audio);
                if (!e.audioPlayer || (typeof (e.audioPlayer.play) !== "function")) {
                    e.audioPlayer = TRC.selectFirst(".player4", self.elements.audioPlayer);
                    self.isAudioPlaing = function () {
                        return (self.elements && self.elements.audioPlayer && typeof (self.elements.audioPlayer.playState) == "number" && self.elements.audioPlayer.playState == 2) ? true : false;
                    }
                }
            }
            self.elements = e;
        }
        
        function _showMessage() {
            if (_message) {                    
                Themes.call([_message, _theme], ["onShow"], [self, self.view, _message]);
                if (!_message.isVisited) {
                    _message.isVisited = true;
                    Themes.call([_message, _theme], ["onVisit", "onOpen"], [self, self.view, _message]);
                }
            }
        }

        this.isAudioPlaing = function () {
            return (!Object.isNull(self.elements.audioPlayer) && typeof (self.elements.audioPlayer.paused) == "boolean") ? !self.elements.audioPlayer.paused : false;
        };

        //#region view engine events
        this.activateView = function () {
            var parameters = self.getParameters(),
                message = Object.resolve(parameters, "message");

            _defaultTheme = Themes.resolveTheme(Object.resolve(parameters, "theme"), "playbook.infomessage");
            
            if (Object.isNull(message)) {
                message = null;
                self.trace("no message object passed.");
            }
            self.message(message);
            Themes.call([message, _theme], ["activateView"], [self, null, message]);
        };

        this.mapView = function (view) {
            var e = self.elements || {};
            e.dialog = TRC.selectFirst("div.trc-pbce.dialog", self.view);
            if (e.dialog) {
                e.html = TRC.selectFirst("div.trc-pbce.html", e.dialog);
                e.header = TRC.selectFirst("div.trc-pbce.header", e.dialog);
                e.title = TRC.selectFirst("div.trc-pbce.title", e.dialog);
                e.text = TRC.selectFirst("div.trc-pbce.text", e.dialog);
            }
            self.elements = e;
            _mapAudioPlayer();
        };


        this.bindView = function (view) {
            Themes.call([_message, _theme], ["bindView"], [self, self.view, _message]);
        };

        this.attachView = function (view) {
            Themes.call([_message, _theme], ["attachView"], [self, self.view, _message]);
            _showMessage();
        };

        this.completeView = function (view) {
            Themes.call([_message, _theme], ["completeView"], [self, view, _message]);
        };
        //#endregion

        
        this.hasAudio = function (audio) {
            _audio = audio;
            return _audio ? true : false;
        };

        this.getAudioAttr = function (attr, def) {
            return (_audio && _audio.hasOwnProperty(attr) && !String.isEmpty(_audio[attr])) ? _audio[attr] : def;
        };

        this.playAudio = function () {
            if (_audio && !self.isAudioPlaing()) {
                try {
                    self.elements.audioPlayer.play();
                }
                catch (err) {
                    self.logMethodError("playAudio", err);
                }
            }
        };

        this.pauseAudio = function () {
            try {
                if (_audio && self.isAudioPlaing())
                    self.elements.audioPlayer.pause();
            }
            catch (err) {
                self.logMethodError("pauseAudio", err);
                self.stopAudio();
            }
        };

        function _resetSound() {
            try {
                TRC.Utils.setAttr(self.elements.audioPlayer, "src", "");
                TRC.Utils.removeAttr(self.elements.audioPlayer, "autostart");
                TRC.Utils.setAttr(self.elements.audioPlayer, "src", _audio.src);
            }
            catch (err) {

            }
        }

        this.stopAudio = function () {
            try {
                if (_audio) {
                    if (self.isAudioPlaing()) {
                        if (self.elements.audioPlayer.stop)
                            self.elements.audioPlayer.stop();
                        else
                            _resetSound();
                    }
                    if (typeof (self.elements.audioPlayer.currentTime) == "number")
                        self.elements.audioPlayer.currentTime = 0;
                }
            }
            catch(err) {
                self.logMethodError("stopAudio", err);
                _resetSound();
            }
        };

        /*
        //not sure how to bind them to the player yet
        this.onPlayAudioClick = function (button) {
            if (self.isAudioPlaing())
                self.pauseAudio();
            else
                self.playAudio();
        };

        this.onStopAudioClick = function (button) {
            self.stopAudio();
        };
        */

        this.onButtonClick = function (button, evt) {
            try {
                Themes.call([_message, _theme], ["onButtonClick"], [self, button, evt || event], function () {
                    self.stopAudio();
                    if (self.close)
                        self.close();
                });
            }
            catch (err) {
                self.logMethodError("onButtonClick", err, true, false);
            }
        };
    };
});