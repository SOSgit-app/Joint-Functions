define(["knockout", "trc/trc.spa", "playbook/models/themes", "playbook/models/notesforsenior"],
    function (ko, SPA, Themes, NotesForSenior) {

        var _defaultTheme = Themes.resolveTheme("playbook.notesforsenior");

        return function () {
            var self = SPA.CreateView(this),
                activateTheme = null;

            this.Themes = Themes;
            this.theme = ko.observable({});

            this.name = "Notes for Senior";
            this.app = window.application;
            this.group = ko.observable();
            this.activeScenario = 0;
            this.userAnswers = ko.observableArray([]);
            this.currentView = ko.observable("Review Notes");
            this.openingDropdown = ko.observable("");
            this.isDropdownOpen = ko.observable("");

            // Review Notes Variables
            this.workpapers = ko.observableArray([]);
            this.workpapersIndex = ko.observable(0);
            this.reviewNotesIndex = ko.observable(0);
            this.reviewNotes = ko.observableArray([]);
            this.reviewDropdowns = ["workpapers", "locations", "notes", "reasons"];
            this.selected = ko.observable([]);

            // Coaching Notes Variables
            this.coachingWorkpapers = ko.observableArray([]);
            this.coachingWorkpapersIndex = ko.observable(0);
            this.coachingNotesIndex = ko.observable(0);
            this.coachingNotes = ko.observableArray([]);
            this.hideCoachingNotes = ko.observable(false);

            //component life cycle

            this.group.subscribe(function (doc) {
                self.theme(Themes.resolveTheme(activateTheme, Object.resolve(doc, "theme"), _defaultTheme));
                activateTheme = null;
            });

            this.activateView = function () {
                var parameters = self.getParameters(),
                    group = Object.resolve(parameters, "group"),
                    scenario = Object.resolve(parameters, "scenario");

                activateTheme = Object.resolve(parameters, "theme");
                self.theme(Themes.resolveTheme(activateTheme, _defaultTheme));

                self.group(group);
                self.activeScenario = scenario || 0;

                // Set the view to Review Notes if not already
                self.currentView("Review Notes");

                self.hideCoachingNotes(self.group().hideCoachingNotes || false);

                self.workpapers(self.group().workpapers[self.activeScenario]);
                self.coachingWorkpapers({ notes: [] });
                // Push the workpapers into the data-bound array

                if (self.group().reviewNotes.length) {
                    var workpaper = 0;
                    // Try and populate the name values from the reviewNotes and Coaching from the content
                    for (var reviewIndex in self.group().reviewNotes) {
                        if (reviewIndex != "indexOf") {
                            for (var workpapers in self.workpapers()) {
                                if (workpapers != "indexOf" &&
                                    self.group().reviewNotes[reviewIndex].workpaper.id == self.workpapers()[workpapers].id) {
                                    // Set Review and Coaching Notes workpapers
                                    self.group().reviewNotes[reviewIndex].workpaper.name = self.workpapers()[workpapers].name;
                                    workpaper = workpapers;
                                    break;
                                }
                            }
                            for (var notes in self.workpapers()[workpaper].notes) {
                                if (notes != "indexOf" &&
                                    self.group().reviewNotes[reviewIndex].note.id == self.workpapers()[workpaper].notes[notes].id) {
                                    self.group().reviewNotes[reviewIndex].note.name = self.workpapers()[workpaper].notes[notes].name;
                                    break;
                                }
                            }
                            for (var locations in self.workpapers()[workpaper].locations) {
                                if (locations != "indexOf" &&
                                    self.group().reviewNotes[reviewIndex].location.id == self.workpapers()[workpaper].locations[locations].id) {
                                    self.group().reviewNotes[reviewIndex].location.name = self.workpapers()[workpaper].locations[locations].name;
                                    break;
                                }
                            }
                            for (var reasons in self.workpapers()[workpaper].reasons) {
                                if (reasons != "indexOf" &&
                                    self.group().reviewNotes[reviewIndex].reason.id == self.workpapers()[workpaper].reasons[reasons].id) {
                                    self.group().reviewNotes[reviewIndex].reason.name = self.workpapers()[workpaper].reasons[reasons].name;
                                    break;
                                }
                            }
                        }
                    }
                    // Try and get the answers from the data persistence
                    for (var reviewIndex = 0; reviewIndex < self.group().reviewNotes.length; reviewIndex++) {
                        self.reviewNotes()[reviewIndex] =
                            new this.ObservableEntry(
                                new this.Entry(self.group().reviewNotes[reviewIndex].workpaper.id,
                                    self.group().reviewNotes[reviewIndex].workpaper.name),
                                new this.Entry(self.group().reviewNotes[reviewIndex].note.id,
                                    self.group().reviewNotes[reviewIndex].note.name),
                                new this.Entry(self.group().reviewNotes[reviewIndex].location.id,
                                    self.group().reviewNotes[reviewIndex].location.name),
                                new this.Entry(self.group().reviewNotes[reviewIndex].reason.id,
                                    self.group().reviewNotes[reviewIndex].reason.name)
                            );
                    }
                }
                // Now for Coaching Notes
                if (self.group().coachingNotes.length) {
                    for (var coachingIndex in self.group().coachingNotes) {
                        if (coachingIndex != "indexOf") {
                            for (var workpapers in self.group().coachingNotesData) {
                                if (workpapers != "indexOf") {
                                    if (self.group().coachingNotes[coachingIndex].workpaper.id == self.workpapers()[workpapers].id) {
                                        self.group().coachingNotes[coachingIndex].workpaper.name = self.workpapers()[workpapers].name;
                                        break;
                                    }
                                }
                            }

                            for (var notes in self.group().coachingNotesData) {
                                if (notes != "indexOf") {
                                    if (self.group().coachingNotes[coachingIndex].note.id == self.group().coachingNotesData[notes].id) {
                                        self.group().coachingNotes[coachingIndex].note.name = self.group().coachingNotesData[notes].name;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    for (var coachingIndex = 0; coachingIndex < self.group().coachingNotes.length; coachingIndex++) {
                        self.coachingNotes()[coachingIndex] =
                            new this.ObservableEntry(
                                new this.Entry(self.group().coachingNotes[coachingIndex].workpaper.id,
                                    self.group().coachingNotes[coachingIndex].workpaper.name),
                                new this.Entry(self.group().coachingNotes[coachingIndex].note.id,
                                    self.group().coachingNotes[coachingIndex].note.name)
                            );
                    }
                }

                roundNotes = [];
                for (var noteID = 0; noteID < self.group().coachingNotesData.length; noteID++) {
                    roundNotes.push(
                        new NotesForSenior.CoachingSelectable(
                            self.group().coachingNotesData[noteID].id,
                            self.group().coachingNotesData[noteID].workpaperID,
                            self.group().coachingNotesData[noteID].name
                        )
                    );
                }
                self.coachingWorkpapers().notes = roundNotes;
                // Build the selected array
                var selected = [];

                for (var workpaperIndex = 0; workpaperIndex < self.workpapers().length; workpaperIndex++) {
                    var selections = [];
                    selected[self.workpapers()[workpaperIndex].name] = [];
                    for (var selectionIndex in self.workpapers()[workpaperIndex].locations) {
                        selections[selectionIndex] = false;
                    }
                    selected[self.workpapers()[workpaperIndex].name]["locations"] = selections;

                    selections = [];
                    for (var selectionIndex in self.workpapers()[workpaperIndex].notes) {
                        selections[selectionIndex] = false;
                    }
                    selected[self.workpapers()[workpaperIndex].name]["notes"] = selections;

                    selections = [];
                    for (var selectionIndex in self.workpapers()[workpaperIndex].reasons) {
                        selections[selectionIndex] = false;
                    }
                    selected[self.workpapers()[workpaperIndex].name]["reasons"] = selections;

                    selections = [];
                    for (var selectionIndex in self.coachingWorkpapers().notes) {
                        selections[selectionIndex] = false;
                    }
                    selected[self.workpapers()[workpaperIndex].name]["coaching notes"] = selections;

                    for (var entryIndex in self.reviewNotes()) {
                        if (entryIndex != "indexOf") {
                            for (var selectionIndex in self.workpapers()[workpaperIndex].locations) {
                                if (self.workpapers()[workpaperIndex].locations[selectionIndex].id == self.reviewNotes()[entryIndex].location().id &&
                                    self.workpapers()[workpaperIndex].id == self.reviewNotes()[entryIndex].workpaper().id)
                                    selected[self.workpapers()[workpaperIndex].name]["locations"][selectionIndex] = true;
                            }
                            for (var selectionIndex in self.workpapers()[workpaperIndex].notes) {
                                if (self.reviewNotes()[workpaperIndex] &&
                                    self.workpapers()[workpaperIndex].notes[selectionIndex].id == self.reviewNotes()[entryIndex].note().id &&
                                    self.workpapers()[workpaperIndex].id == self.reviewNotes()[entryIndex].workpaper().id)
                                    selected[self.workpapers()[workpaperIndex].name]["notes"][selectionIndex] = true;
                            }
                            for (var selectionIndex in self.workpapers()[workpaperIndex].reasons) {
                                if (self.reviewNotes()[workpaperIndex] &&
                                    self.workpapers()[workpaperIndex].reasons[selectionIndex].id == self.reviewNotes()[entryIndex].reason().id &&
                                    self.workpapers()[workpaperIndex].id == self.reviewNotes()[entryIndex].workpaper().id)
                                    selected[self.workpapers()[workpaperIndex].name]["reasons"][selectionIndex] = true;
                            }
                        }
                    }

                    for (var entryIndex in self.coachingNotes()) {
                        if (entryIndex != "indexOf") {
                            var selections = [];
                            for (var selectionIndex in self.coachingWorkpapers().notes) {
                                if (self.coachingNotes()[workpaperIndex] &&
                                    self.coachingWorkpapers().notes[selectionIndex].id == self.coachingNotes()[entryIndex].note().id)
                                    selections[selectionIndex] = true;
                                else
                                    selections[selectionIndex] = false;
                            }
                            selected[self.workpapers()[workpaperIndex].name]["coaching notes"] = selections;
                        }
                    }
                }
                self.selected(selected);
            }

            this.bindingComplete = function () {
            }

            this.attached = function (view) {
                // Add initial entries
                if (self.reviewNotes().length == 0) {
                    self.addReviewEntry();
                }

                if (self.coachingNotes().length == 0) {
                    self.addCoachingEntry();
                }
            }

            this.onClose = function () {
                try {
                    // Close functionality goes here
                    // Push answers into RoundModel for printing and scorecard
                    for (var reviewIndex = 0; reviewIndex < self.reviewNotes().length; reviewIndex++) {
                        self.group().reviewNotes[reviewIndex] =
                            new NotesForSenior.Entry(
                                reviewIndex,
                                self.reviewNotes()[reviewIndex].workpaper(),
                                self.reviewNotes()[reviewIndex].note(),
                                self.reviewNotes()[reviewIndex].location(),
                                self.reviewNotes()[reviewIndex].reason()
                            );
                    }
                    for (var coachingIndex = 0; coachingIndex < self.coachingNotes().length; coachingIndex++) {
                        self.group().coachingNotes[coachingIndex] =
                            new NotesForSenior.Entry(
                                coachingIndex,
                                self.coachingNotes()[coachingIndex].workpaper(),
                                self.coachingNotes()[coachingIndex].note()
                            );
                    }
                    // Save app state
                    self.app.saveState();
                    return true;
                }
                catch (err) {
                    self.logMethodError("onClose", err, true);
                }
            };

            this.changeView = function (newView) {
                self.clearDropdowns();
                self.currentView(newView);
                TRC.Style.render();
            };

            this.addReviewEntry = function () {
                try {
                    // Do not let the user add a new entry until they have completed the previous one
                    var lastAnswer = self.reviewNotes()[self.reviewNotes().length - 1];
                    if (self.reviewNotes().length > 0 &&
                        (lastAnswer.location().name == "" ||
                        lastAnswer.note().name == "")) {
                        alert("You must complete location and note before you can add a new entry.")
                        return;
                    }

                    // Push a new entry into the user answers
                    var workpaper = (self.reviewNotes().length > 0 ? lastAnswer.workpaper() : { id: self.workpapers()[0].id, name: self.workpapers()[0].name });
                    self.reviewNotes.push(new this.ObservableEntry(
                        new this.Entry(workpaper.id, workpaper.name),
                        new this.Entry(0, ""),
                        new this.Entry(0, ""),
                        new this.Entry(0, "")
                        ));
                    self.workpapersIndex(0);

                    var entries = $("div.activity.senior-notes > div.dialog div.reviewNotesContainer div.notes > div.entry");
                    if (self.reviewNotes().length > 1) {
                        $(entries[entries.length - 2]).removeClass("last");
                    }
                    $(entries[entries.length - 1]).addClass("last");

                    //// Has to come after the push or it won't find the new element
                    TRC.Style.render();

                    // Scroll to the bottom entry
                    var container = "div.activity.senior-notes > div.dialog div.reviewNotesContainer div.notes";
                    $(container).parent().scrollTop($(container).height());

                    // Save state on new entry using onClose
                    self.onClose();
                }
                catch (err) {
                    self.logMethodError("addReviewEntry", err, true);
                }
            };

            this.deleteReviewEntry = function (index) {
                try {
                    if (self.reviewNotes().length <= 1)
                        return;

                    if (self.reviewNotesIndex() != index) {
                        self.reviewNotesIndex(index);
                    }

                    self.deselectDropdown();
                    self.reviewNotes.splice(index, 1);
                    self.group().reviewNotes.splice(index, 1);

                    // Save state on new entry using onClose
                    self.onClose();
                }
                catch (err) {
                    self.logMethodError("deleteReviewEntry", err, true);
                }
            }

            this.addCoachingEntry = function () {
                try {
                    // Do not let the user add a new entry until they have completed the previous one
                    var lastAnswer = self.coachingNotes()[self.coachingNotes().length - 1];
                    if (self.coachingNotes().length > 0 &&
                        (lastAnswer.workpaper().name == "" ||
                        lastAnswer.note().name == "")) {
                        alert("You must complete all entries before you can add a new one.")
                        return;
                    }
                    // Push a new entry into the user answers
                    var workpaper = (self.coachingNotes().length > 0 ? lastAnswer.workpaper() : { id: self.workpapers()[0].id, name: self.workpapers()[0].name });
                    self.coachingNotes.push(new this.ObservableEntry(
                        new this.Entry(workpaper.id, workpaper.name),
                        new this.Entry(0, "")));
                    self.coachingWorkpapersIndex(0);

                    var entries = $("div.activity.senior-notes > div.dialog div.coachingNotesContainer div.notes > div.entry");
                    if (self.coachingNotes().length > 1) {
                        $(entries[entries.length - 2]).removeClass("last");
                    }
                    $(entries[entries.length - 1]).addClass("last");

                    //// Has to come after the push or it won't find the new element
                    TRC.Style.render();

                    // Scroll to the bottom entry
                    var container = "div.activity.senior-notes > div.dialog div.coachingNotesContainer div.notes";
                    $(container).parent().scrollTop($(container).height());

                    // Save state on new entry using onClose
                    self.onClose();
                }
                catch (err) {
                    self.logMethodError("addCoachingEntry", err, true);
                }
            };

            this.deleteCoachingEntry = function (index) {
                try {
                    if (self.coachingNotes().length <= 1)
                        return;

                    if (self.coachingNotesIndex() != index) {
                        self.coachingNotesIndex(index);
                    }

                    self.deselectDropdown("coaching notes");
                    self.coachingNotes.splice(index, 1);
                    self.group().coachingNotes.splice(index, 1);

                    // Save state on new entry using onClose
                    self.onClose();
                }
                catch (err) {
                    self.logMethodError("deleteCoachingEntry", err, true);
                }
            }

            this.openDropdown = function (index, element, type) {
                //Open a dropdown
                if (self.currentView() == "Review Notes") {
                    self.reviewNotesIndex(index);
                    for (var workpaperIndex = 0; workpaperIndex < self.workpapers().length; workpaperIndex++) {
                        if (self.workpapers()[workpaperIndex].id == self.reviewNotes()[self.reviewNotesIndex()].workpaper().id) {
                            self.workpapersIndex(workpaperIndex);
                            break;
                        }
                    }
                }
                else {
                    self.coachingNotesIndex(index);
                    for (var workpaperIndex = 0; workpaperIndex < self.workpapers().length; workpaperIndex++) {
                        if (self.workpapers()[workpaperIndex].id == self.coachingNotes()[self.coachingNotesIndex()].workpaper().id) {
                            self.coachingWorkpapersIndex(workpaperIndex);
                            break;
                        }
                    }
                }
                self.openingDropdown(type);

                // Get elements and dimensions
                var dropdownElement = "div.dropdown." + (self.currentView() == "Review Notes" ? "reviewViewContainer" : "coachingViewContainer") + "." + type.toLowerCase();
                var container = "div." + (self.currentView() == "Review Notes" ? "reviewNotesContainer" : "coachingNotesContainer");
                var container2 = "div." + (self.currentView() == "Review Notes" ? "reviewViewContainer" : "coachingViewContainer");

                $(container).bind("mousewheel", function () {
                    return false;
                });

                var left = $(element).parent().position().left +
                    $(container).position().left + 4;
                var top = $(element).position().top +
                        $(container).position().top +
                        $(container2).position().top;

                var dropdownHeight = $(".dropdown-bar").height();

                // If more than halfway to the bottom
                if ($(element).position().top > ($(container).height() / 2)) {
                    if (element.className.indexOf("text-area") != -1) {
                        top -= dropdownHeight;
                    }
                    else {
                        top -= (($(element).height() * -1) - dropdownHeight);
                    }
                }
                else {
                    if (element.className.indexOf("text-area") == -1) {
                        top += dropdownHeight;
                    }
                }

                var width = $(element).parent().width();

                $(dropdownElement).css({
                    width: width + "px",
                    left: left + "px",
                    top: top + "px"
                }).scrollTop(0).show();

                self.isDropdownOpen(type);

                setTimeout(function () {
                    self.openingDropdown("");
                }, 10);


            };

            this.clearDropdowns = function () {
                // This hides all currently showing dropdowns. This is so multiple dropdowns don't display at once.
                var dropdowns = $("div.dropdown");
                dropdowns.scrollTop(0);
                var container = self.currentView() == "Review Notes" ? "div.reviewNotesContainer" : "div.coachingNotesContainer";

                for (var dropdownIndex = 0; dropdownIndex < dropdowns.length; dropdownIndex++) {
                    if (($(dropdowns[dropdownIndex]).css("display") != "none" &&
                        dropdowns[dropdownIndex].className.indexOf(self.openingDropdown()) == -1) ||
                        (self.openingDropdown() == "")) {
                        $(dropdowns[dropdownIndex]).hide();
                        $(container).unbind("mousewheel");
                        self.isDropdownOpen("");
                    }
                }
            };

            this.selectItem = function (index, type) {
                var selectedItem = "";
                // User selected an item from the dropdown
                switch (type) {
                    case "Review Notes Workpaper":
                        // If not the current workpaper, set the new index and clear the other dropdown fields
                        if (self.workpapersIndex() != index) {
                            // Clear the other dropdowns and return their entries to the dropdowns they belong in.
                            self.deselectDropdown();
                            self.reviewNotes()[self.reviewNotesIndex()].location(new this.Entry(0, ""));
                            self.reviewNotes()[self.reviewNotesIndex()].note(new this.Entry(0, ""));
                            self.reviewNotes()[self.reviewNotesIndex()].reason(new this.Entry(0, ""));

                            self.workpapersIndex(index);
                            var newSelection = new this.Entry(
                                self.workpapers()[self.workpapersIndex()].id,
                                self.workpapers()[self.workpapersIndex()].name);
                            self.reviewNotes()[self.reviewNotesIndex()].workpaper(newSelection);
                            selectedItem = "Review Notes - Workpaper: " + self.workpapers()[self.workpapersIndex()].name + ". Clearing other selections for the entry.";
                        }
                        break;
                    case "Review Notes Location":
                        // If it currently has a value, deselect it and select the new one
                        if (self.reviewNotes()[self.reviewNotesIndex()].location() &&
                            self.reviewNotes()[self.reviewNotesIndex()].location().id != 0)
                            self.deselectDropdown("location");

                        var newSelection = new this.Entry(
                            self.workpapers()[self.workpapersIndex()].locations[index].id,
                            self.workpapers()[self.workpapersIndex()].locations[index].name);
                        self.reviewNotes()[self.reviewNotesIndex()].location(newSelection);
                        self.selected()[self.workpapers()[self.workpapersIndex()].name]["locations"][index] = true;

                        selectedItem = "Review Notes - Location: " + self.workpapers()[self.workpapersIndex()].locations[index].name;
                        break;
                    case "Review Notes Note":
                        // If it currently has a value, deselect it and select the new one
                        if (self.reviewNotes()[self.reviewNotesIndex()].note() &&
                            self.reviewNotes()[self.reviewNotesIndex()].note().id != 0)
                            self.deselectDropdown("note");

                        var newSelection = new this.Entry(
                            self.workpapers()[self.workpapersIndex()].notes[index].id,
                            self.workpapers()[self.workpapersIndex()].notes[index].name);
                        self.reviewNotes()[self.reviewNotesIndex()].note(newSelection);
                        self.selected()[self.workpapers()[self.workpapersIndex()].name]["notes"][index] = true;

                        selectedItem = "Review Notes - Note: " + self.workpapers()[self.workpapersIndex()].notes[index].name;
                        break;
                    case "Review Notes Reason":
                        // If it currently has a value, deselect it and select the new one
                        if (self.reviewNotes()[self.reviewNotesIndex()].reason() &&
                                self.reviewNotes()[self.reviewNotesIndex()].reason().id != 0)
                            self.deselectDropdown("reason");

                        var newSelection = new this.Entry(
                            self.workpapers()[self.workpapersIndex()].reasons[index].id,
                            self.workpapers()[self.workpapersIndex()].reasons[index].name);
                        self.reviewNotes()[self.reviewNotesIndex()].reason(newSelection);
                        self.selected()[self.workpapers()[self.workpapersIndex()].name]["reasons"][index] = true;

                        selectedItem = "Review Notes - Reason: " + self.workpapers()[self.workpapersIndex()].reasons[index].name;
                        break;
                    case "Coaching Notes Workpaper":
                        // If it currently has a value, deselect it and select the new one
                        if (self.coachingNotes()[self.coachingNotesIndex()].workpaper() &&
                            self.coachingNotes()[self.coachingNotesIndex()].workpaper().id != 0) {
                            var currentIndex = 0;
                            for (var workpaperIndex = 0; workpaperIndex < self.coachingWorkpapers().length; workpaperIndex++) {
                                if (self.workpapers()[workpaperIndex].id == self.coachingNotes()[self.coachingNotesIndex()].workpaper().id) {
                                    currentIndex = workpaperIndex;
                                    break;
                                }
                            }
                        }
                        var newSelection = new this.Entry(
                            self.workpapers()[index].id,
                            self.workpapers()[index].name);
                        self.coachingNotes()[self.coachingNotesIndex()].workpaper(newSelection);

                        // Clear Coaching Notes Note for new workpaper
                        if (self.coachingNotes()[self.coachingNotesIndex()].note() &&
                            self.coachingNotes()[self.coachingNotesIndex()].note().id != 0) {
                            var currentIndex = 0;
                            for (var noteIndex = 0; noteIndex < self.coachingWorkpapers().length; noteIndex++) {
                                if (self.workpapers()[noteIndex].id == self.coachingNotes()[self.coachingNotesIndex()].note().id) {
                                    currentIndex = noteIndex;
                                    break;
                                }
                            }
                            self.selected()[self.workpapers()[self.workpapersIndex()].name]["coaching notes"][currentIndex] = false;
                        }
                        self.coachingNotes()[self.coachingNotesIndex()].note(new this.Entry(0, ""));

                        selectedItem = "Coaching Notes - Workpaper: " + self.workpapers()[index].name;
                        break;
                    case "Coaching Notes Note":
                        // If it currently has a value, deselect it and select the new one
                        if (self.coachingNotes()[self.coachingNotesIndex()].note() &&
                            self.coachingNotes()[self.coachingNotesIndex()].note().id != 0) {
                            var currentIndex = 0;
                            for (var noteIndex = 0; noteIndex < self.coachingWorkpapers().notes.length; noteIndex++) {
                                if (self.coachingWorkpapers().notes[noteIndex].id == self.coachingNotes()[self.coachingNotesIndex()].note().id) {
                                    currentIndex = noteIndex;
                                    break;
                                }
                            }
                            self.selected()[self.workpapers()[self.workpapersIndex()].name]["coaching notes"][currentIndex] = false;
                        }
                        var newSelection = new this.Entry(
                            self.coachingWorkpapers().notes[index].id,
                            self.coachingWorkpapers().notes[index].name);
                        self.coachingNotes()[self.coachingNotesIndex()].note(newSelection);
                        self.selected()[self.workpapers()[self.coachingWorkpapersIndex()].name]["coaching notes"][index] = true;

                        selectedItem = "Coaching Notes - Note: " + self.coachingWorkpapers().notes[index].name;
                        break;
                }
                self.isDropdownOpen("");
            };

            this.deselectDropdown = function (type) {
                // Clear dropdowns based on type
                if (!type || type == "location") {
                    var currentIndex = 0;
                    for (var locationIndex = 0; locationIndex < self.workpapers()[self.workpapersIndex()].locations.length; locationIndex++) {
                        if (self.workpapers()[self.workpapersIndex()].locations[locationIndex].id == self.reviewNotes()[self.reviewNotesIndex()].location.id) {
                            currentIndex = locationIndex;
                            break;
                        }
                    }
                    self.selected()[self.workpapers()[self.workpapersIndex()].name]["locations"][currentIndex] = false;
                }
                if (!type || type == "note") {
                    var currentIndex = -1;
                    for (var noteIndex = 0; noteIndex < self.workpapers()[self.workpapersIndex()].notes.length; noteIndex++) {
                        if (self.workpapers()[self.workpapersIndex()].notes[noteIndex].id == self.reviewNotes()[self.reviewNotesIndex()].note().id) {
                            currentIndex = noteIndex;
                            break;
                        }
                    }
                    if (currentIndex >= 0)
                        self.selected()[self.workpapers()[self.workpapersIndex()].name]["notes"][currentIndex] = false;
                }
                if (!type || type == "reason") {
                    var currentIndex = 0;
                    for (var reasonIndex = 0; reasonIndex < self.workpapers()[self.workpapersIndex()].reasons.length; reasonIndex++) {
                        if (self.workpapers()[self.workpapersIndex()].reasons[reasonIndex].id == self.reviewNotes()[self.reviewNotesIndex()].reason().id) {
                            currentIndex = reasonIndex;
                            break;
                        }
                    }
                    self.selected()[self.workpapers()[self.workpapersIndex()].name]["reasons"][currentIndex] = false;
                }

                if (!type || type == "coaching notes") {
                    var currentIndex = 0;
                    for (var noteIndex = 0; noteIndex < self.coachingWorkpapers().notes.length; noteIndex++) {
                        if (self.coachingWorkpapers().notes[noteIndex].id == self.coachingNotes()[self.coachingNotesIndex()].note().id) {
                            currentIndex = noteIndex;
                            break;
                        }
                    }
                    self.selected()[self.workpapers()[self.workpapersIndex()].name]["coaching notes"][currentIndex] = false;
                }
            };

            this.ObservableEntry = function (workpaper, note, location, reason) {
                var parent = self;
                var self = this;

                this.workpaper = ko.observable(workpaper);                         // Entry of the Workpaper
                this.note = ko.observable(note);                                   // Entry of the Note
                this.location = ko.observable(location);                           // Entry of the Location
                this.reason = ko.observable(reason);                               // Entry of the Reason
            };

            this.Entry = function (id, name) {
                var self = this;

                this.id = id;
                this.name = name;
            };

            this.notesCount = function (workpaperID) {
                var length = 0;
                Array.foreach(self.coachingWorkpapers().notes, function (note) {
                    if (note.workpaperID == workpaperID)
                        length++;
                });
                return length;
            };

            //close button in modal view

            this.onButtonClick = function (button, evt) {
                try {
                    Themes.call([self.group(), self.theme()], ["onButtonClick"], [self, button, evt || event],
                        function () {
                            self.close();
                        });
                } catch (err) {
                    self.logMethodError("onButtonClick", err, true);

                }
            };
        }
    });