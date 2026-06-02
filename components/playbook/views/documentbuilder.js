define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/documentbuilder", "jqueryui"],
    function (ko, SPA, Themes, DocumentBuilder) {

        var _defaultTheme = Themes.resolveTheme("playbook.documentbuilder");

        return function () {
            var self = SPA.CreateView(this), activateTheme = null;

            this.document = ko.observable();
            this.theme = ko.observable();
            this.currentState = ko.observableArray();


            this.createOptions = function (callback) {

                var options = self.document().options(), sections = $('[data-section]'), sectionList = '';
                sections.each(function (index, s) {
                    var section = $(this).attr('data-section').split("|");
                    if (section.length > 1) {
                        sectionList += '<li data-select="' + section[0] + '">' + section[1] + '</li>';
                    }
                });

                Array.foreach(options, function (opt, index) {
                    var option = $("<div data-option='" + opt.id + "'><span>" + opt.content + "</span><a class='doc-builder-add' href='#'>" + self.document().addHtml + '<ul class="doc-builder-group-panel">' + sectionList + "</ul></a><a class='doc-builder-remove' data-optid='" + opt.id + "' href='#'>" + self.document().removeHtml + "</a></div>"),
                      section = $("#" + opt.group);
                    section.append(option);
                    self.currentState().push({ id: opt.id, section: opt.group });
                }, 0);

                if (typeof callback === 'function') callback();
            }

            this.move = function (opt, groupId) {
                var section = document.getElementById(groupId);
                opt.detach().appendTo(section);
                self.update(opt.attr('data-option'), groupId);
            }

            this.update = function (optid, sectionid) {
                var option = Array.lookupBy(self.currentState(), 'id', optid);
                option.section = sectionid;
                $('.doc-builder-group-panel').hide();
            }

            this.document.subscribe(function (doc) {
                self.theme(Themes.resolveTheme(activateTheme, Object.resolve(doc, "theme"), _defaultTheme));
                activateTheme = null;
            });

            this.activateView = function () {
                var parameters = self.getParameters(),
                    document = Object.resolve(parameters, "document");

                if (!document && self.parent)
                    document = Object.resolve(Object.resolve(parameters, "content"), "body");

                self.currentState(document.selections());

                activateTheme = Object.resolve(parameters, "theme");
                this.document(document);

                Themes.call(self.theme(), ["activateView"], [self]);
            }

            this.bindView = function (view) {
                Themes.call(self.theme(), ["bindView"], [self, view]);
            };

            this.attachView = function (view) {
                Themes.call(self.theme(), ["attachView"], [self, view]);
            };

            this.completeView = function (view) {
                Themes.call(self.theme(), ["completeView"], [self, view]);
            };

            this.bindingComplete = function () {
                self.createOptions(self.bindDragNDrop());
                $('.doc-builder').on('click', '[data-select]', function () {
                    var opt = $(this).parents('[data-option]');
                    self.move(opt, $(this).attr('data-select'));
                }).on('click', '.doc-builder-remove', function () {
                    var opt = $(this).parents('[data-option]');
                    self.move(opt, '0');
                }).on('click', '.doc-builder-add', function () {
                    $('.doc-builder-group-panel').hide();
                    $(this).find('.doc-builder-group-panel').show();
                });
            }


            //drag and drop
            this.bindDragNDrop = function () {
                $('[data-section]')
                    .sortable({
                        connectWith: "[data-section]",
                        cursor: "move",
                        placeholder: 'doc-builder-placeholder',
                        //cursorAt: {
                        //    left: 2,
                        //    top: 2
                        //},
                        update: function (event, ui) {
                            if (this === ui.item.parent()[0]) {
                                self.update(ui.item.attr('data-option'), $(this).attr('id'));
                            }
                        }
                    })
                    .disableSelection();
            }

            //close button in modal view

            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.document(), self.theme()], ["onButtonClick"], [self, button, evt || event], function () { self.close(); });
                } catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };

            this.debugInfo = function () {
                return Function.invoke(self.document(), 'getState');
            }
        };
    });
