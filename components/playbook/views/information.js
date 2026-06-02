define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/information", "playbook/views/imgr", "playbook/views/flipbook"],
    function (ko, SPA, Themes, Information) {

        var _defaultTheme = Themes.resolveTheme("playbook.information");

        function buildImage(data, root) {

            var toggle = (data.toggle) ? 'data-imgToggle="true"' : '',
                descToggle = (data.toggle) ? 'style="display:none;"' : '',
                container = '<div ' + toggle + ' class="imgContainer">',
                img = '<img src="' + root + data.path + '">',
                desc = (data.description) ? '<div ' + descToggle + ' class="imgPanel">' + data.description + '</div>' : '',
                title = (data.title) ? '<h2>' + data.title + '</h2>' : '',
                containerClose = '</div>';

            if (img && desc || title) return container + img + title + desc + containerClose;
            return img;
        }

        function buildImgr(data, root) {
            var markup = '<div class="imgr">';

            for (var i = 0; i < data.images.length; i++) {
                var style = (i >= 1) ? 'style="display: none"' : '';
                markup += '<img ' + style + ' src="' + root + data.images[i].path + '" />';
            }

            return markup += '</div>';
        }

        function buildFlipbook(data) {
            var markup = '<div class="flipbook">';
            for (var i = 0; i < data.panels.length; i++) {
                if (!data.panels[i] instanceof Information.Content) throw 'Panels can only contain the Content type (panel ' + i + ')';
                var style = (i >= 1) ? 'style="display: none"' : '';
                markup += '<div class="pagePanel panel' + i + '" ' + style + '>' + data.panels[i].html + '</div>';
            }
            return markup;
        }

        function buildVideo(data) {
            var auto = (data.autoplay) ? 'autoplay' : '',
                markup = '<video ' + auto + ' controls>'
            for (var i = 0; i < data.paths.length; i++) {
                markup += '<source src="' + data.paths[i] + '" type="video/mp4">'
            }

            return markup += '</video>';
        }

        return function () {
            'use strict';
            var self = SPA.CreateView(this),
                activateTheme = null;

            this.theme = ko.observable();
            this.sections = [];
            this.hasAudio = false;
            this.cssprefix = '';
            this.complete = false;
            this.required = ko.observableArray();

            this.activateView = function () {
                var parameters = self.getParameters(),
                sections = Object.resolve(parameters.content, "sections"),
                imgroot = Object.resolve(parameters.content, "imageroot");

                activateTheme = Object.resolve(parameters, "theme");
                self.theme(Themes.resolveTheme(activateTheme, _defaultTheme));
                Array.foreach(sections, function (section) { self.render(section, imgroot); }, 0);
                self.hasAudio = parameters.content.audio;
                self.cssprefix = parameters.content.cssprefix;
                self.required(parameters.content.steps);
            };

            this.render = function (section, imgroot) {
                var html;
                if (section instanceof Information.Content) html = section.html;
                if (section instanceof Information.Image) html = buildImage(section, imgroot);
                if (section instanceof Information.ImageRotator) html = buildImgr(section, imgroot);
                if (section instanceof Information.Flipbook) html = buildFlipbook(section);
                if (section instanceof Information.Video) html = buildVideo(section);
                self.sections.push(html);
            }

            this.mapView = function (view) {
                $('.imgr').imgr({ speed: '5000' });
                $('.flipbook').flipbook();
                $('[data-required]').on('click', function () {
                    var item = $(this).attr('data-required'),
                        index = self.required().indexOf(item);

                    if (index > -1) {
                        self.required().splice(index, 1);
                    }
                    if (self.required().length === 0) {
                        self.complete = true;
                    }
                });
                $('.imgPanel').on('click', function () { $(this).toggle() });
                $('[data-imgtoggle]').each(function () {
                    var img = $(this),
                        handle = $('<div class="handle"></div>'),
                        panel = img.find('.imgPanel');

                    handle.on('click', function () {
                        panel.toggle();
                    });
                    panel.parent().append(handle);
                });

            };

            //close button in modal view
            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.theme()], ["onButtonClick"], [self, button, evt || event],
                        function () {
                            self.close();
                        });
                } catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };
        };
    });
