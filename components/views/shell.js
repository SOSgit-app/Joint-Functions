define(["knockout", "trc/trc.spa", , "scripts/jquery-ui-1.11.4.min.js", "durandal/plugins/router", "content/jf504"],
    function (ko, SPA, jqueryUI, router, content) {

        ko.bindingHandlers.toggleResources = {
            init: function (element, valueAccessor) { },
            update: function (element, valueAccessor, allbindings, viewmodel) {
                var value = valueAccessor();

                if (ko.unwrap(value)) {
                    $('.footer').css('z-index', 5);
                    $('.stack-blanket-shell').css({ display: 'block', 'z-index': 1 });
                    $(element).find('.r-content').css('opacity', 1);
                    $(element).find('.close').show();
                    $(element).stop().animate({ bottom: -10 });
                } else {
                    $(element).stop().animate({ bottom: -383 }, function () {
                        $('.stack-blanket-shell').css({ display: 'none', 'z-index': -1 });
                        $(element).find('.r-content').css('opacity', 0);
                        $(element).find('.close').hide();
                        $('.footer').css('z-index', 4);
                    });

                }
            }
        };

        ko.bindingHandlers.scenarioUp = {
            init: function (element, valueAccessor) { },
            update: function (element, valueAccessor, allbindings, viewmodel) {
                var value = valueAccessor();

                if (ko.unwrap(value)) {
                    $(element).stop().animate({ top: -30 }, 500);
                }
            }
        };

        ko.bindingHandlers.truncatedText = {
            update: function (element, valueAccessor, allBindingsAccessor) {
                var originalText = ko.utils.unwrapObservable(valueAccessor()),
                    // 10 is a default maximum length
                    length = ko.utils.unwrapObservable(allBindingsAccessor().maxTextLength) || 20,
                    truncatedText = originalText.length > length ? originalText.substring(0, length) + "[...]" : originalText;
                // updating text binding handler to show truncatedText
                ko.bindingHandlers.text.update(element, function () {
                    return truncatedText;
                });
            }
        };

        var dataModel = application.dataModel;
        var shell = new SPA.Shell({
            viewMap: {
                splash: { moduleId: "components/views/splash" },
                mission: { moduleId: "components/views/mission" },
                scenario: { moduleId: "components/views/scenario" },
                video: { moduleId: "components/views/video" },
                videoResources: { moduleId: "components/views/videoResources" },
                feedback: { moduleId: "components/views/feedback" },
                endActivity: { moduleId: "components/views/endActivity" },
            },
            elements: { stackView: null }
        });

        //shell globals
        shell.content = dataModel.content;
        shell.scenarioPlan = dataModel.content.getScenarioPlan();
        shell.scenarioStepIndex = 0;

        // Dev: force one scenario with ?scenario=0..N and optional &force=0|1
        (function () {
            var match = /[?&]scenario=(\d+)(?:&|$)/i.exec(window.location.search);
            if (match) {
                var scenarioIndex = parseInt(match[1], 10);
                var maxIndex = dataModel.content.scenarios.length - 1;
                if (scenarioIndex >= 0 && scenarioIndex <= maxIndex) {
                    var forceMatch = /[?&]force=([0-1])(?:&|$)/i.exec(window.location.search);
                    shell.scenarioPlan = [
                        [
                            scenarioIndex,
                            forceMatch ? parseInt(forceMatch[1], 10) : 0
                        ]
                    ];
                    shell.scenarioStepIndex = 0;
                }
            }
        })();

        shell.scenarioIndexes = shell.scenarioPlan[shell.scenarioStepIndex];
        // first index = scenario number; second index = force list (0 = first, 1 = second)
        var scenario = dataModel.content.scenarios[shell.scenarioIndexes[0]];
        shell.scenario = ko.observable(scenario);

        shell.getScenarioProgress = function () {
            return {
                current: shell.scenarioStepIndex + 1,
                total: shell.scenarioPlan.length
            };
        };

        shell.hasMoreScenariosAfterCurrent = function () {
            return shell.scenarioStepIndex < shell.scenarioPlan.length - 1;
        };

        shell.advanceToNextScenario = function () {
            if (!shell.hasMoreScenariosAfterCurrent()) {
                return false;
            }
            shell.scenarioStepIndex++;
            shell.scenarioIndexes = shell.scenarioPlan[shell.scenarioStepIndex];
            shell.scenario(dataModel.content.scenarios[shell.scenarioIndexes[0]]);
            shell.allowedAttempts(3);
            return true;
        };

        shell.missionText = dataModel.content.mission;
        shell.showVideo = dataModel.content.playVideo; //turn of video for debugging
        shell.watchedVideo = ko.observable(false);
        shell.videoPlaying = ko.observable(false);
        shell.autoplay = ko.observable(false);
        shell.audioTutorial = ko.observable();
        shell.mainVideo = ko.observable();
        shell.resources = {};
        shell.resources.isOpen = ko.observable(false);
        shell.allowedAttempts = ko.observable(3);
        

        shell.resources.handleClick = function () {
            var open = shell.resources.isOpen() ? false : true;
            shell.resources.isOpen(open);
            if (open) {
                $(".video-modal").css("z-index", "1");
                $(".header").css("z-index", "1");
                var v = document.getElementById("video-container");
                if (v) {
                    v.pause();
                }
                if (shell.audioTutorial()) {
                    shell.audioTutorial().pause();
                    shell.tutorial.skip();
                }
            }
            else {
                $(".video-modal").css("z-index", "4");
                $(".header").css("z-index", "4");
                var v = document.getElementById("video-container");
                if (v) {
                    v.play();
                }
                if (shell.audioTutorial() && shell.audioTutorial().currentTime != 0 && !shell.audioTutorial().ended) {
                    shell.audioTutorial().play();
                }
            }

            $(".blue-link").click(function (el) {
                $(".r-content .wrap").removeClass("active");
                $(el.target).parent().addClass("active");
            });

            $(".resources-link").click(function (el) {
                $(".r-content .wrap").removeClass("active");
                $(el.target).parent().addClass("active");
            });
        }

        shell.tutorial = {};
        shell.tutorial.count = 0;
        shell.tutorial.timer;
        shell.tutorial.hasPlayed = ko.observable(false);
        shell.tutorial.playing = ko.observable(false);
        shell.tutorial.bubble;
        shell.tutorial.handleClick = function () {
            (shell.tutorial.playing()) ? shell.tutorial.skip() : shell.tutorial.play();
        }

        shell.tutorial.show = function () {
            window.clearTimeout(shell.tutorial.timer);
            $('.tutorial').css({ opacity: 1, visibility: 'visible', top: 0 });
            if (!shell.tutorial.hasPlayed()) shell.tutorial.play();
        }

        shell.tutorial.hide = function () {
            window.clearTimeout(shell.tutorial.timer);
            $('.tutorial').css({ opacity: 0, visibility: 'hidden', top: '-40px' });
            shell.tutorial.skip();
        }

        shell.tutorial.view;
        shell.tutorial.filter = function () {
            return (shell.tutorial.view) ? _.filter(dataModel.content.tutorial, function (t) {
                return t.view === shell.tutorial.view;
            }) : dataModel.content.tutorial;
        }

        shell.tutorial.play = function () {
            window.clearTimeout(shell.tutorial.timer);
            shell.tutorial.timer = setTimeout(function () {
                var tut = shell.tutorial.filter();
                shell.tutorial.playing(true);
                shell.tutorial.hasPlayed(true);

                if (tut.length && shell.tutorial.count < tut.length) {
                    var options = tut[shell.tutorial.count];
                    shell.tutorial.bubble
                        .html(options.text)
                        .css({ "top": options.y, "left": options.x })
                        .removeClass("left right")
                        .addClass(options.arrow)
                        .fadeIn(1000)
                        .delay(options.dwellTime || 1000) //looks for tutorial text dwellTime override in json, otherwise uses default
                        .fadeOut(1000, function () {
                            if (shell.tutorial.playing()) {
                                shell.tutorial.count++
                                if (shell.tutorial.count < tut.length) {
                                    shell.tutorial.play();
                                } else {
                                    shell.tutorial.count = 0;
                                    shell.tutorial.playing(false);
                                }
                            }
                        });

                }
            }, dataModel.content.tutorialTiming);
        }

        shell.tutorial.skip = function (next) {
            window.clearTimeout(shell.tutorial.timer);
            shell.tutorial.playing(false);
            shell.tutorial.bubble.hide().stop(true, true).end();
            shell.tutorial.count = 0;
            if (next) next();
        }




        shell.loaded = ko.observable(false);
        shell.loaded.subscribe(function (loaded) {
            window.setTimeout(function () {
                try {
                    var a = new Audio(dataModel.content.guidance.voiceover)
                    if (a) {
                        shell.audioTutorial(a);
                    }
                }
                catch (err) {
                }
            }, 2000);

        });

        shell.videoLoaded = ko.observable(false);


        shell.addSourceToVideo = function (element, src, type) {
            var source = document.createElement('source');
            source.src = src;
            source.type = type;
            element.appendChild(source);
        }

        shell.startPlayVideo = function (name, callBack) {

            if (shell.showVideo) {
                window.openModalView('video', {
                    video: name, callBack: callBack
                });

                window.setTimeout(function () {
                    shell.mainVideo(document.getElementById("video-container"));
                    if (shell.mainVideo() && Object.prototype.toString.call(shell.mainVideo().play) === '[object Function]') {
                        shell.mainVideo().play();
                    }
                }, 1000);

            } else {
                window.openView('mission');
            }
        };

        shell.startPlayVideoJF504_2 = function (callBack) {
            if (shell.resources.isOpen()) {
                window.openModalView('videoResources', {
                    video: "JF504_2", isFromResources: true, callBack: callBack
                });
                window.setTimeout(function () {
                    var v = document.getElementById("recources-container");
                    if (Object.prototype.toString.call(v.play) === '[object Function]') {
                        v.play();
                    }
                }, 1000);
            }
        };

        shell.startPlayVideoJF504_7 = function (isShow, callBack) {
            if (shell.resources.isOpen() || isShow) {
                window.openModalView('videoResources', {
                    video: "JF504_7", callBack: callBack, isShow: isShow
                });
                window.setTimeout(function () {
                    var v = document.getElementById("recources-container");
                    v.play();
                }, 1000);
            }
        };



        shell.activateShell = function () {
        };

        shell.mapShell = function (v, p, c) {
            shell.tutorial.bubble = $('.bubble');
        }

        shell.router = function () {
            router.map([
              { route: 'casestudy', title: 'Case Study', moduleId: 'casestudy', nav: true }
            ]).buildNavigationModel();
            return router.activate();
        }

        shell.activityListOpened = ko.observable(true);

        shell.hideShowActivityList = function () {
            $(".r-content .wrap").removeClass("active");
            $(".res-link").addClass("active");
            if (shell.activityListOpened()) {
                shell.activityListOpened(false);
                $("#activityList").slideUp();
                $("#resoursesArrow").attr({ "src": "assets/images/BTN_ResourceArrow_Side.png" });
            }
            else {
                shell.activityListOpened(true);
                $("#activityList").slideDown();
                $("#resoursesArrow").attr({ "src": "assets/images/BTN_ResourceArrow_Down.png" });
            }
        }

        shell.getMobileOperatingSystem = ko.computed(function () {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;

            if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
                return 'iOS';

            }
            else if (userAgent.match(/Android/i)) {

                return 'Android';
            }
            else {
                return '';
            }
        });

        shell.playAudio = function () {
            shell.audioTutorial().play();
            $('.play-audio').css({ "background": "grey", "color": "black" });
            $('.play-audio').prop("disabled", true)
        };

        shell.showPlayAudio = function () {
            $('.play-audio').css({ opacity: 1, visibility: 'visible' });
        }
        shell.hidePlayAudio = function () {
            $('.play-audio').css({ opacity: 1, visibility: 'hidden' });
        }


        return shell;
    });
