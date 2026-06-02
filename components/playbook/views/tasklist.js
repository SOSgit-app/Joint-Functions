define(["knockout", "trc/trc.spa", "playbook/models/themes"],
    function (ko, SPA, Themes) {

        return function() {
            var self = SPA.CreateView(this);
            this.Themes = Themes;
            this.scroller = null;
            var _scrollTimer = 0;

            this.theme = ko.observable({});
            this.roundTitle = ko.observable();
            this.roundDescription = ko.observable();
            this.tasksList = ko.observableArray([]);

            function _mapView(view) {
                if (arguments.length > 0)
                    self.view = view;
                var e = self.elements = {};
                if (self.view) {
                    e.dialog = TRC.$("div.trc-pbe.dialog", self.view);
                    if (e.dialog) {
                        e.title = TRC.$("div.trc-pbe.title", e.dialog);
                        e.list = TRC.$("div.trc-pbe.list", e.dialog);
                    }
                }
            }

            this.activateView = function () {
                var parameters = self.getParameters(),
                    theme = Themes.resolveTheme(Object.resolve(parameters, "theme"), "playbook.tasklist");

                self.theme(theme);
                Themes.call(theme, ["activateView"], [self]);
            };

            this.bindView = function (view) {
                _mapView(view);
                if (Themes.call(self.theme(), ["activateView"], [self], true))
                    self.updateTasklist();
            };

            this.attachView = function (view) {
                Themes.call(self.theme(), ["attachView"], [self, view]);
            };

            this.completeView = function (view) {
                Themes.call(self.theme(), ["completeView"], [self, view]);
            };

            this.onButtonClick = function (a, evt) {
                try {
                    Themes.call([self.theme()], ["onButtonClick"], [self, a, evt], function () {
                        if (self.closeView)
                            self.closeView();
                    });
                }
                catch (err) {
                    self.logMethodError("onButtonClick", err, true);
                }
            };

            var _updateTimer = 0;
            this.updateTasklist = function () {
                self.tasksList([]);
                var list = [];
                var app = window.application;
                var round = Object.resolve(app, "currentRound");
                if (!round) {
                    if (!_updateTimer) {
                        _updateTimer = setInterval(self.updateTasklist, 500);
                    }
                }
                else {
                    if (_updateTimer) {
                        clearInterval(_updateTimer);
                        _updateTimer = 0;
                    }
                    self.roundTitle(round.title);
                    self.roundDescription(round.description);

                    Array.foreach(round.tasks, function(task) {
                        if (task && task.inTaskList) {
                            list.push(task);
                            task.visible = true;
                            if (!task.completed) {
                                if (!round.currentTask)
                                    round.currentTask = task;
                                return -1;
                            }
                        }
                    });
                }
                self.tasksList(list);

                // auto scroll task list to the very bottom of it
                if (self.scroller) {
                    if (_scrollTimer) {
                        clearTimeout(_scrollTimer);
                        _scrollTimer = 0;
                    }
                    _scrollTimer = setTimeout(function () {
                        try  {
                            if (self.scroller.scrollTop + self.scroller.clientHeight < self.scroller.scrollHeight) {
                                self.scroller.scrollTop = self.scroller.scrollHeight - self.scroller.clientHeight;
                            }
                        }
                        finally {
                            _scrollTimer = 0;
                        }
                    }, 300);
                }
            };

            this.getTaskCompleteAttr = function (task) { // obsolete
                return (task && task.completed) ? "complete" : null;
            };

            this.getTaskListActionCss = function (task) { // obsolete
                return (task && task.completed) ? "complete" : "done";
            };

            this.getTaskListButtonText = function (task) {
                return (task && task.completed) ? String.ifEmpty(self.resolve([self.theme(), task], 'buttonCompleteTask'), "Complete") :
                    ((task.isLastTask() ? String.ifEmpty(self.resolve([self.theme(), task], "buttonDoneWithRound"), "Done with Round") : String.ifEmpty(self.resolve([self.theme(), task], "buttonDoneWithTask"), "Done with Task")));
            };

            this.taskListRendered = function () {
            };

            this.onTaskDoneClick = function (task) {
                try {
                    var app = window.application;
                    if (app && task && !task.completed) {
                        var da = true;
                        if (Object.isFunction(task.complete))
                            da = Object.ifNull(task.complete.call(task), true);
                        if (da) {
                            var round = task.round;
                            if (!round.completed) {
                                if (round.currentTask != task) {
                                    self.tasksList.push(round.currentTask); // next task
                                }
                            }
                            else {
                                var appRounds = app.rounds;
                                var roundIndex = appRounds.indexOf(round);

                                if (roundIndex != -1 && roundIndex + 1 < appRounds.length) {
                                    app.setCurrentRound(appRounds[roundIndex + 1]);
                                }
                            }
                        }
                        // do not rely on observables since any task can be changed 
                        self.updateTasklist();
                    }
                }
                catch (error) {
                    alert(TRC.getErrorMessage(error));
                }
            };
        };
    }
);
