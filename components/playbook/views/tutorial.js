define(["knockout", "trc/trc.spa", "playbook/models/tutoriallib", "playbook/models/themes"],
   function (ko, SPA, TL, Themes) {

       var _defaultTheme = Themes.resolveTheme("playbook.tutorial");

       return function () {
           var self = SPA.CreateView(this),
              activateTheme = null,
              _scene = null,
              _bubble = null,
              _audio = null;

           this.tutorial = ko.observable();
           this.theme = ko.observable();
           this.skin = ko.observable();
           this.scenes = ko.observableArray([]);
           this.currentScene = ko.observable({});
           this.bubbles = ko.observableArray([]);
           this.currentBubble = ko.observable({});
           this.buttonText = ko.observable("Start");

           this.audio = ko.observable();
           this.audioControls = ko.observable(true);
           this.audioLoop = ko.observable(false);
           this.audioAutoplay = ko.observable(true);

           this.tutorial.subscribe(function (val) {
               var tutorial = val,
                   theme = Themes.resolveTheme(activateTheme, Object.resolve(val, "theme"), _defaultTheme),
                   skin = String.ifEmpty(self.resolve([tutorial, theme], "skin"), "") + (Object.resolve(tutorial, "completed") ? " completed" : "");

               self.theme(theme);
               self.skin(skin);
       
               var scenes = Object.resolve(val, "scenes");
               self.scenes(scenes);

               var currentScene = Array.pick(scenes, 0, "unknown");
               self.currentScene(currentScene);

               _audio = null;
               self.currentBubble(null);
           });


           this.currentScene.subscribe(function (val) {

               if (_scene != val) {
                   _scene = val;
                   if (_scene) {
                       Object.resolve(_scene, "visited", [true]);
                   }
               }

               if (_bubble) {
                   self.stopAudio();
                   self.audio(null);
                   self.audio(_getAudio(_bubble));
                   _mapAudioPlayer();
               }
           });

           this.currentBubble.subscribe(function (val) {
               if (_bubble != val) {
                   _bubble = val;
                   if (_bubble)
                       Object.resolve(_bubble, "visited", [true]);
               }
           });

           this.audio.subscribe(function (val) {
               self.audioControls(!!Object.resolve(val, 'controls'));
               self.audioAutoplay(!!Object.resolve(val, 'autoplay'));
               self.audioLoop(!!Object.resolve(val, 'loop'));
           });

           this.activateView = function () {
               var parameters = self.getParameters(),
                   tutorial = Object.resolve(parameters, "content"),
                   activateTheme = Object.resolve(parameters, "theme");

               self.tutorial(tutorial);

               if (!tutorial.completed) {
                   var bubbles = Object.resolve(self.currentScene(), "bubbles");
                   self.bubbles(bubbles);
               }

               Themes.call(self.theme(), ["activateView"], [self, null, self.tutorial()]);
           };


           this.mapView = function (view) {
               var e = self.elements || {};
               if (self.view) {
                   e.dialog = TRC.selectAll("div.trc-pbce.dialog", self.view)[0];
                   if (e.dialog) {
                       e.sceneContainer = TRC.selectAll("div.trc-pbce.scene", e.dialog)[0];
                       e.closeTutorial = TRC.selectAll("div.trc-pbce.close-tutorial", e.sceneContainer)[0];
                       e.bubbleContainer = TRC.selectAll("div.trc-pbce.bubble-list", e.sceneContainer)[0];
                       e.nextBubble = TRC.selectAll("div.trc-pbce.next-bubble", e.sceneContainer)[0];
                   }
               }
               self.elements = e;
               _mapAudioPlayer();
           };

           this.bindView = function (view) {
               Themes.call(self.theme(), ["bindView"], [self, view, self.tutorial()]);
           };

           this.attachView = function (view) {
               Themes.call(self.theme(), ["attachView"], [self, view, self.tutorial()]);
           };

           this.completeView = function (view) {
               Themes.call(self.theme(), ["completeView"], [self, view, self.tutorial()]);
           };

           this.renderBubble = function (elements, bubble) {
               var container = Array.pick(Array.filter(elements, function (e) {
                   return TRC.Utils.hasClass(e, "bubble");
               }), 0, null);

               if (container && bubble) {
                   if (bubble.hasOwnProperty("left"))
                       container.style.left = bubble.left;

                   else if (bubble.hasOwnProperty("right"))
                       container.style.right = bubble.right;

                   if (bubble.hasOwnProperty("bottom"))
                       container.style.bottom = bubble.bottom;

                   else if (bubble.hasOwnProperty("top"))
                       container.style.top = bubble.top;


                   setTimeout(function () {
                       TRC.Style.render(container);
                   }, 250);
               }
           };

           this.nextBubble = function () {
               var current = self.currentBubble();
               var bubbleDiv = null;
               var bubble = null;
               var scene = self.currentScene();
               var buttonText = "Next";
               if (current) {
                   var currentIndex = Array.indexBy(self.bubbles(), "id", current.id);
                   bubble = Array.pick(self.bubbles(), currentIndex + 1, "unknown");
                   if (!bubble || bubble == "unknown") {
                       var sceneIndex = Array.indexBy(self.scenes(), "id", self.currentScene().id);
                       scene = Array.pick(self.scenes(), sceneIndex + 1, "unknown");
                       if (scene && scene != "unknown") {
                           var bubbles = Object.resolve(scene, "bubbles");
                           bubble = Array.pick(bubbles, 0, "unknown");
                           self.bubbles(bubbles);
                       }
                       else
                           buttonText = null;
                   }
               }
               else
                   bubble = Array.pick(self.bubbles(), 0, "unknown");

               bubbleDiv = document.getElementById(bubble.id);
               if (bubbleDiv) {
                   self.buttonText(buttonText);
                   self.currentBubble(bubble);
                   bubble.visited = true;
                   bubbleDiv.style.display = "block";
                   self.currentScene(scene);
               }
           };

           function _getAudio(bubble) {
               if (bubble.audio) {
                   switch (typeof (bubble.audio)) {
                       case "string":
                           return {
                               src: bubble.audio,
                               autoplay: true
                           };

                       case "object":
                           if (!String.isEmpty(bubble.audio)) {
                               var audio = Object.merge({}, bubble.audio);
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
               if (e.sceneContainer) {
                   e.audio = TRC.selectFirst("div.trc-pbce.audio", e.sceneContainer);
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

           this.isAudioPlaing = function () {
               return (!Object.isNull(self.elements.audioPlayer) && typeof (self.elements.audioPlayer.paused) == "boolean") ? !self.elements.audioPlayer.paused : false;
           };

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
                   var bubble = self.currentBubble();
                   if (!String.isEmpty(bubble.audio.src))
                       _audio.src = bubble.audio.src;
                   else
                       _audio.src = "";

                   TRC.Utils.setAttr(self.elements.audioPlayer, "src", _audio.src);
               }
               catch (err) {

               }
           };

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
               catch (err) {
                   self.logMethodError("stopAudio", err);
                   _resetSound();
               }
           };

           this.closeTutorial = function () {
               self.close();
           };

       }
   }
)