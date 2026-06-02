define(["knockout", "trc/trc.spa", "playbook/models/themes"],
function (ko, SPA, Themes) {

    return function () {
        var self = SPA.CreateView(this),
            _message = null,
            _theme = null,
            _defaultTheme = null,
            _contact = null,
            _isActivating = false;

        this.message = ko.observable();
        this.theme = ko.observable();
        this.from = ko.observable();
        this.video = ko.observable();
        this.videoSource = ko.observable();
        this.videoControls = ko.observable("controls");
        this.videoLoop = ko.observable();
        this.videoAutoplay = ko.observable("autoplay");

        this.message.subscribe(function (val) {
            if (_message != val) {
                _message = val;
                try {
                    var from = self.resolve(_message, "from");
                    self.theme(Themes.resolveTheme(Object.resolve(_message, "theme"), _defaultTheme));
                    self.from(((Object.hasProperty(from, "name") || Object.hasProperty(from, "title")) ? from : {}));
                    var video = Object.resolve(_message, "video");
                    if (video) {
                        if (typeof (video) === "string") {
                            video = {
                                src: video,
                                controls: true,
                                autoplay: true,
                                loop: false
                            };
                        }
                    }
                    else {
                        video = {};
                    }
                    self.video(video);
                    _mapView();
                }
                catch (error) {
                    self.logMethodError("message", error);
                }
            }
        });

        this.video.subscribe(function (val) {
            self.videoSource(Object.resolve(val, "src"));

            var autoplay = Object.resolve(val, "autoplay");
            autoplay = (typeof (autoplay) == "boolean") ? (autoplay ? "autoplay" : null) : (autoplay ? autoplay : null);
            self.videoAutoplay(autoplay);

            var controls = Object.resolve(val, "controls");
            controls = (typeof (controls) == "boolean") ? (controls ? "controls" : null) : (controls ? controls : (autoplay ? null : "controls"));
            self.videoControls(controls);


            var loop = Object.resolve(val, "loop");
            loop = (typeof (loop) == "boolean") ? (loop ? "loop" : null) : (loop ? loop : null);
            self.videoLoop(loop);
        });

        function _mapView(view) {
            if (_isActivating)
                return;
            var e = {};
            if (arguments.length > 0 && self.view != view)
                self.view = view;
            if (self.view) {
                e.dialog = TRC.selectFirst("div.dialog", self.view);
                if (e.dialog) {
                    e.title = TRC.selectFirst("div.title", e.dialog);
                    e.fromHeader = TRC.selectFirst("div.from > div.header", e.dialog);
                    e.transcriptHeader = TRC.selectFirst("div.transcript > div.header", e.dialog);
                }
            }
            self.elements = e;
        };

        this.activateView = function () {
            try {
                _isActivating = true;

                var parameters = self.getParameters(),
                    message = Object.resolve(parameters, "message"),
                    theme = Object.resolve(parameters, "theme");

                _defaultTheme = Themes.resolveTheme(theme, "playbook.videomessage");

                self.message(message);
                Themes.call([message, theme], ["activateView"], [self, null, message]);
            }
            finally {
                _isActivating = false;
            }
        };

        this.bindView = function (view) {
            _mapView(view);
            Themes.call(_theme, ["bindView"], [self, view, _message]);
        };

        this.attachView = function (view) {
            Themes.call(_theme, ["attachView"], [self, view, _message]);
        };

        this.completeView = function (view) {
            Themes.call(_theme, ["completeView"], [self, view, _message]);
        };

        this.onButtonClick = function (a, evt) {
            try {
                Themes.call([_message, _theme], ["onButtonClick"], [self, a, evt], function () {
                    if (self.close)
                        self.close();
                });
            }
            catch (err) {
                self.logMethodError("onButtonClick", err, true);
            }
        };
    };
});