define([], function () {
    var NotesForSenior = new function () {
        this.WorkpaperGroup = function (id, workpapers, coachingNotesData, config) {
            this.id = id;                                       // ID of the group
            this.workpapers = workpapers;                       // Array of Workpapers, sorted by scenario
            this.coachingNotesData = coachingNotesData;         // This is an array of coaching note Selectables associated with the workpaper
            this.activeScenario = null;                         // This is the index of the array with the set of workpapers used by the user

            this.reviewNotes = [];                              // Stores Review Notes for printing and scoring
            this.coachingNotes = [];                            // Stores Coaching Notes for printing and scoring

            // Localization/Customizable Strings
            this.strings = {};

            // Menu Links
            this.strings.reviewNotes = "Review Notes";
            this.strings.coachingNotes = "Coaching Notes";

            // Headers
            this.strings.workpaper = "Workpaper";
            this.strings.location = "Location";
            this.strings.note = "Note";
            this.strings.reason = "Reason";
            this.strings.addNewEntry = "Add New Entry";

            // Dropdown text
            this.strings.selectOne = "Select One";
            this.strings.selectToEdit = "Select to Edit";

            this.getState = function () {
                rN = [];
                cN = [];

                if (this.reviewNotes.length) {
                    for (var e in this.reviewNotes) {
                        if (e != "indexOf") {
                            rN[e] = {
                                w: this.reviewNotes[e].workpaper.id,
                                n: this.reviewNotes[e].note.id,
                                l: this.reviewNotes[e].location.id,
                                r: this.reviewNotes[e].reason.id
                            };
                        }
                    }
                }
                if (this.coachingNotes.length) {
                    for (var e in this.coachingNotes) {
                        if (e != "indexOf") {
                            cN[e] = {
                                w: this.coachingNotes[e].workpaper.id,
                                n: this.coachingNotes[e].note.id
                            }
                        }
                    }
                }
                return {
                    aS: this.activeScenario,
                    rN: Array.append([], rN),
                    cN: Array.append([], cN)
                };
            };

            this.setState = function (state) {
                if (state.hasOwnProperty("aS"))
                    this.activeScenario = state.aS;
                if (state.hasOwnProperty("rN")) {
                    for (e in state.rN) {
                        this.reviewNotes[e] = {
                            workpaper: { id: state.rN[e].w, name: "" },
                            note: { id: state.rN[e].n, name: "" },
                            location: { id: state.rN[e].l, name: "" },
                            reason: { id: state.rN[e].r, name: "" }
                        };
                    }
                }
                if (state.hasOwnProperty("cN")) {
                    for (e in state.cN) {
                        this.coachingNotes[e] = {
                            workpaper: { id: state.cN[e].w, name: "" },
                            note: { id: state.cN[e].n, name: "" }
                        };
                    }
                }
            };

            Object.merge(this, config);
        };

        this.Workpaper = function(id, name, locations, notes, reasons, config) {
            var self = this;

            this.id = id;                                               // This is the ID of the Selectable
            this.name = name;                                           // This is the name of the workpaper
			this.locations = locations;                                 // This is an array of location Selectables associated with the workpaper
			this.notes = notes;                                         // This is an array of note Selectables associated with the workpaper
			this.reasons = reasons;                                     // This is an array of reason Selectables associated with the workpaper

            // Retrieves the appropriate CSS for the element
			this.getCSS = function (answer) {
			    var css = "";
			    if (answer) {
	                css = (answer.workpaper().id == self.id ? "selected" : "");
			    }

			    return ('selection ' + css);
			};

			Object.merge(this, config);
        };

        this.Selectable = function(id, name, correctAnswers, distractions, config) {
            var self = this;

            this.id = id;                                               // This is the ID of the Selectable
            this.name = name;                                           // This is the name/text of the Selectable
            this.answers = correctAnswers;                              /* This is one-dimensional array for Locations
                                                                           with 2 elements: the ID's for the corresponding
                                                                           Note and Reason Selectables to specify
                                                                           the correct answer combination */
            this.distractions = distractions;                           /* This is one-dimensional array for Locations
                                                                           with 2 elements: the ID's for the corresponding
                                                                           Note and Reason Selectables to specify
                                                                           a distraction answer combination */

            // Retrieves the appropriate CSS for the element
            this.getCSS = function (type, dataIndex, answer, selected, config) {
                var css = ""

                if (answer &&  (type == "coaching workpaper" ||
                    selected[answer.workpaper().name])) {
                    switch (type) {
                        case "location":
                            css = (answer.location().id == self.id ? "selected" : "");
                            break;
                        case "note":
                            css = (answer.note().id == self.id ? "selected" :
                                (selected[answer.workpaper().name]["notes"][dataIndex] ? "hidden" : ""));
                            break;
                        case "reason":
                            css = (answer.reason().id == self.id ? "selected" :
                                (selected[answer.workpaper().name]["reasons"][dataIndex] ? "hidden" : ""));
                            break;
                        case "coaching workpaper":
                            css = (answer.workpaper().id == self.id ? "selected" : "");
                            break;
                    }
                }

                return ('selection ' + css);
            };

            Object.merge(this, config);            
        };

        this.CoachingSelectable = function (id, workpaperID, name, correctAnswers, config) {
            var self = this;

            this.id = id;                                               // This is the ID of the Selectable
            this.workpaperID = workpaperID                              // The ID of the workpaper this coaching note belongs to
            this.name = name;                                           // This is the name/text of the Selectable
            this.correctAnswers = correctAnswers;                       // This is true/false, depending on if it is a correct answer or not

            // Retrieves the appropriate CSS for the element
            this.getCSS = function (dataIndex, answer, selected) {
                var css = ""

                if (answer) {
                    if (self.workpaperID != answer.workpaper().id)
                        css = "hidden";
                    else if (selected[answer.workpaper().name]) {
                        css = (answer.note().id == self.id ? "selected" :
                            (selected[answer.workpaper().name]["coaching notes"][dataIndex] ? "hidden" : ""));
                    }
                }

                return ('selection ' + css);
            };

            Object.merge(this, config);
        };
        
        this.Entry = function (id, workpaper, note, location, reason, config) {
            var self = this;

            this.id = id;                                       // ID of entry
            this.note = note;                                   // ID of the Note
            this.location = location;                           // ID of the Location
            this.reason = reason;                               // ID of the Reason
            this.workpaper = workpaper || null;                 // ID of workpaper, filled in by parent

            this.getState = function () {
                return {
                    id: self.id,
                    w: self.workpaper,
                    n: self.note,
                    l: self.location,
                    r: self.reason
                };
            };

            this.setState = function (state) {
                if (state) {
                    if (state.hasOwnProperty("id"))
                        this.id = state.id;
                    if (state.hasOwnProperty("w"))
                        this.id = state.workpaper;
                    if (state.hasOwnProperty("n"))
                        this.note = state.n;
                    if (state.hasOwnProperty("l"))
                        this.location = state.l;
                    if (state.hasOwnProperty("r"))
                        this.reason = state.r;
                }
            };

            Object.merge(this, config);
        };
        
    }
    return NotesForSenior;
});