define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/itemsanddecisions"],
    function (ko, SPA, Themes, ItemsAndDecisions) {

        var _defaultTheme = Themes.resolveTheme("playbook.itemsanddecisions");

        return function () {
            var self = SPA.CreateView(this),
                activateTheme = null;

            this.Themes = Themes;
            this.theme = ko.observable({});

            this.name = "Items and Decisions";
            this.app = window.application;
            this.module = ko.observable();
            this.sortedItems = null;

            this.userAnswers = ko.observableArray([]);
            this.openingDropdown = ko.observable("");
            this.isDropdownOpen = ko.observable(false);

            // Items and Decisions Variables
            this.answerIndex = ko.observable(0);
            this.entryDropdowns = ["decisions"];

            //component life cycle

            this.module.subscribe(function (doc) {
                self.theme(Themes.resolveTheme(activateTheme, Object.resolve(doc, "theme"), _defaultTheme));
                activateTheme = null;
            });

            this.activateView = function () {
                var parameters = self.getParameters(),
                    module = Object.resolve(parameters, "module");

                activateTheme = Object.resolve(parameters, "theme");
                self.theme(Themes.resolveTheme(activateTheme, _defaultTheme));

                self.module(module);

                self.sortedItems = self.module().items.sort(function (a, b) {
                    if (a.text.toLowerCase() > b.text.toLowerCase())
                        return 1;
                    if (a.text.toLowerCase() < b.text.toLowerCase())
                        return -1;
                    return 0;
                });

                // Preset all the data to any user entries saved in the data model
                self.userAnswers([]);
                for (var iadDataIndex in self.sortedItems) {
                    if (iadDataIndex != "indexOf")
                        self.userAnswers.push(
                        {
                            id: self.sortedItems[iadDataIndex].id,
                            identified: ko.observable(self.sortedItems[iadDataIndex].userIdentified),
                            item: ko.observable(iadDataIndex),
                            decision: ko.observable(Array.lookupIndexBy(self.module().decisions, "id", self.sortedItems[iadDataIndex].userDecision)),
                            include: ko.observable(self.sortedItems[iadDataIndex].userIncluded)
                        });
                }
            }

            this.bindingComplete = function () {
            }

            this.canCloseView = function () {
                var decision = -1;
                // Close functionality goes here
                for (var iadDataIndex in self.sortedItems) {
                    if (iadDataIndex != "indexOf") {
                        for (var entry in self.module().items) {
                            if (entry != "indexOf" &&
                                self.module().items[entry].id == self.userAnswers()[iadDataIndex].id) {
                                decision = (self.userAnswers()[iadDataIndex].decision() >= 0 ?
                                    self.module().decisions[self.userAnswers()[iadDataIndex].decision()].id : -1);
                                self.module().items[entry].userIdentified = self.userAnswers()[iadDataIndex].identified(),
                                self.module().items[entry].userDecision = decision,
                                self.module().items[entry].userIncluded = self.userAnswers()[iadDataIndex].include()
                            }
                        }
                    }
                }
                return true;
            };

            this.openDropdown = function (index, element, type) {
                //Open a dropdown
                self.answerIndex(index);
                // If Identified checkbox is not checked, do not open
                if (!self.userAnswers()[self.answerIndex()].identified())
                    return;

                self.openingDropdown(true);

                // Get elements and dimensions
                var dropdownElement = "div.dropdown.trc-pbce." + type.toLowerCase();
                var container = "div.iadContainer";
                var left = $(element).parent().position().left +
                    $(container).position().left +
                    ($(element).parent()[0].className.indexOf("workpaper") == -1 ? 9 : 4);
                /* If the entry is < halfway from the top of notesContainer, open downwards as normal,
                   or else open upwards */
                var top = $(element).position().top +
                        $(container).position().top -
                        ($(element).position().top > ($(container).height() / 2) ?
                        $(dropdownElement).height() + (element.className.indexOf("text-area") == -1 ? 0 : ($(".dropdown-bar").height())) :
                        (element.className.indexOf("text-area") == -1 ? ($(element).height() * -1) : 0));
                var width = $(element).parent().width();

                $(dropdownElement).css({
                    width: width + "px",
                    left: left + "px",
                    top: top + "px"
                }).show();

                self.isDropdownOpen(true);

                setTimeout(function () {
                    self.openingDropdown(false);
                }, 10);
            };

            this.clearDropdowns = function () {
                if (!self.openingDropdown()) {
                    $("div.dropdown.decisions").hide();
                    self.isDropdownOpen(false);
                }
            };

            this.selectItem = function (index) {
                var selectedItem = "";
                // User selected an item from the dropdown
                self.userAnswers()[self.answerIndex()].decision(index);
                self.isDropdownOpen(false);
            };

            this.toggleValue = function (index, value) {
                switch (value) {
                    case 'identified':
                        self.userAnswers()[index].identified(!self.userAnswers()[index].identified());
                        self.userAnswers()[index].decision(-1);
                        self.userAnswers()[index].include(false);

                        var includes = $("div.text-area.include div.checkbox");
                        // Add disabled CSS for include if not checked
                        if (self.userAnswers()[index].identified()) {
                            $(includes[index]).removeClass("disabled");
                        }
                        else {
                            $(includes[index]).addClass("disabled");
                        }
                        break;
                    case 'include':
                        if (self.userAnswers()[index].identified()) {
                            self.userAnswers()[index].include(!self.userAnswers()[index].include());
                        }
                        break;
                }
            };

            //close button in modal view

            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.module(), self.theme()], ["onButtonClick"], [self, button, evt || event],
                        function () {
                            self.close();
                        });
                } catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };
        };
    });