define([],
function () {

    var Module = new function () {
        this.Round = function (
			name,           /* unique round name */
			title,          /* round title */
			description,    /* round description */
			tasks,          /* round tasks, array */
			overrides)       /* optional round overrides, object */
		{
            var self = this;

            this.app = null;
            this.name = name;
            this.title = title;
            this.description = description;
            this.currentTask = null;
            this.completed = false; //ko.observable(false);
            this.tasks = tasks || [];

            Array.foreach(this.tasks, function (task, index) {
                if (task)
                    task.round = self;
            });

            this.startup = function (app) {
                self.app = app;
                Array.foreach(self.tasks, function (task, index) {
                    if (task) {
                        task.app = app;
                        if (Object.isFunction(task.startup))
                            task.startup.call(task, app);
                    }
                });
            }

            this.activate = function (task) {
                var onactivate = Object.ifNull(self.onActivate, self.onactivate);
                if (Object.isFunction(onactivate))
                    onactivate.call(self, task);
                if (task)
                    self.setCurrentTask(task);
            };

            this.completeTask = function (task, noTriggers) {
                var taskIndex = -1;
                switch (typeof (task)) {
                    case "object":
                        taskIndex = self.tasks.indexOf(task);
                        break;

                    case "number":
                        taskIndex = Math.round(task);
                        task = (taskIndex > -1 && taskIndex < self.tasks.length) ? self.task[taskIndex] : null;
                        break;

                    case "string":
                        taskIndex = Array.lookupIndexBy(tasks, "name", task);
                        task = (taskIndex > -1 && taskIndex < self.tasks.length) ? self.task[taskIndex] : null;
                        break;
                }

                if (!task)
                    throw new Error("State.completeTask: Task '" + task + "' in round '" + self.title + "' not found.");
                    
                var da = true;
                try {
                    if (!noTriggers && Object.isFunction(self.onTaskComplete))
                        da = Object.ifNull(self.onTaskComplete.call(self, task), true);
                }
                catch (error) {
                    da = false;
                    alert(TRC.getErrorMessage(error));
                }
                if (!da)
                    return false;

                // test for next task                    
                for (var task; ++taskIndex < self.tasks.length;) {
                    task = self.tasks[taskIndex];
                    if (task && task.inTaskList) {
                        break;
                    }
                }

                if (taskIndex < self.tasks.length) // set next task
                    self.setCurrentTask(self.tasks[taskIndex]);
                else
                    da = Object.ifNull(self.complete(), true); // complete round
                return da;
            };

            this.resolveTask = function (task) {
                switch (typeof (task)) {
                    case "number":
                        var t = Math.round(task);
                        if (t < 0 || t >= self.tasks.length)
                            throw new Error("Round.setCurrentTask: Invalid task index " + t + " round " + self.title);
                        for (; t < self.tasks.length; t++) {
                            if (self.tasks[t].inTaskList) {
                                return self.tasks[t];
                            }
                        }
                        break;

                    case "object":
                        return task;

                    case "string":
                        return Array.lookupBy(self.tasks, "name", task);
                }
                throw new Error("Round.setCurrentTask: Invalid task " + t + " Round " + self.title);
            };

            this.setCurrentTask = function (task) {
                task = self.resolveTask(task);
                if (!task)
                    throw new Error("Round.setCurrentTask: Invalid task '" + t + "' Round " + self.title);

                if (self.currentTask != task) {
                    self.currentTask = task;

                    var da = true;
                    try {
                        var handler = Object.ifNull(task.onActivate, task.onactivate);
                        if (Object.isFunction(handler))
                            da = Object.ifNull(handler.call(task), true);

                        if (da) {
                            handler = Object.ifNull(self.onTaskActivate, self.ontaskactivate);
                            if (Object.isFunction(handler))
                                da = Object.ifNull(handler.call(self, task), true);
                        }
                    }
                    catch (error) {
                        da = false;
                        alert(TRC.getErrorMessage(error));
                    }
                }
            };

            this.complete = function () {
                var da = true;
                if (!self.completed) {
                    try {
                        da = Function.invoke(self, "onComplete");
                        if (da !== false)
                            da = self.completed = true;
                    }
                    catch (error) {
                        da = false;
                        alert(TRC.getErrorMessage(error));
                    }
                }
                return da;
            };

            this.getState = function () {
                var state = { done: (self.completed ? 1 : 0) };
                if (self.tasks) {
                    var taskStates = null;
                    Array.foreach(self.tasks, function (task) {
                        if (task && Object.isFunction(task.getState)) {
                            var ts = task.getState.call(task);
                            if (ts) {
                                taskStates = taskStates || {};
                                taskStates[task.name] = ts;
                            }
                        }
                    });
                    if (taskStates)
                        state.tasks = taskStates;
                }
                return state;
            };

            this.setState = function (state) {
                if (state) {
                    self.completed = Boolean.parseBoolean(state.done, false);
                    if (state.tasks) {
                        Array.foreach(self.tasks, function(task) {
                            if (task && Object.isFunction(task.setState)) {
                                task.setState.call(task, state.tasks[task.name]);
                            }
                        });
                    }
                }
            };

            Object.merge(this, overrides);
        };

        this.RoundTask = function (
			name,           /* task name must be unique with a round */
			instructions,   /* task instructions, html */
			activities,     /* a list of activities associated with the task */
			overrides)      /* optional task overrides | object;  inTaskList - true/false lists task on the task list */
		{
            var self = this;

            this.round = null;
            this.name = name;
            this.instructions = instructions;
            this.activities = activities || [];
            this.inTaskList = true;
            this.completed = false;
            this.decisions = {};

            this.showView = function (viewPath) {
                if (!self.completed) {
                    document.location = viewPath;
                }
            };

            this.createLinkButton = function (text, onclick, onCompletion) {
                if ((!onCompletion && self.completed) || (onCompletion && !self.completed))
                    return text;

                var scope = window.$callbacks = (window.$callbacks || { next: 0});
                var func = "cb" + scope.next++;
                scope[func] = function (evt) {
                    try {
                        if (!evt && typeof(event) !== "undefined") // so Firefox doesn't fail
                            evt = event;
                        onclick.call(self, evt);
                    }
                    catch (error) {
                        alert(TRC.getErrorMessage(error));
                    }
                };
                return "<span class='link" + (onCompletion ? " ontaskcomplete" : "") + "' onclick=\"window.$callbacks." + func + "(event)\">" + text + "</span>";
            };

            this.isLastTask = function() {
                if (self.hasOwnProperty("lastTask"))
                    return Boolean(self.lastTask);
                if (self.round && self.round.tasks) {
                    var roundTasks = self.round.tasks;
                    var index = roundTasks.indexOf(self);
                    if (index != -1) {
                        while (++index < roundTasks.length) {
                            var task = roundTasks[index];
                            if (task && task.inTaskList) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            }

            this.getNextTask = function () {
                if (self.round && self.round.tasks && !self.lastTask) {
                    var index = self.round.tasks.indexOf(self);
                    if (index != -1) {
                        while (++index < self.round.tasks.length) {
                            var task = self.round.tasks[index];
                            if (task && task.inTaskList && !task.lastTask) {
                                return task;
                            }
                        }
                    }
                }
                return null;
            }

            this.complete = function () {
                var da = true;
                try {
                    if (Object.isFunction(self.onComplete))
                        da = Object.ifNull(self.onComplete.call(self), true);
                    if (da) {
                        if (Object.isFunction(self.round.completeTask)) {
                            da = Object.ifNull(self.round.completeTask(self), true);
                            if (da)
                                self.completed = true;
                        }
                        else 
                            self.completed = true;
                    }
                }
                catch (error) {
                    da = false;
                    alert(TRC.getErrorMessage(error));
                }
                return da;
            };


            function _getState() {
                var state = { done: (self.completed ? 1 : 0) };
                if (self.decisions) {
                    Object.foreach(self.decisions, function (decision, index) {
                        if (!state.decisions)
                            state.decisions = {};
                        state.decisions[index] = Object.clone(decision);
                    }, true);
                }
                var activityState = [];
                Array.foreach(self.activities, function (a) {
                    if (a && a.visible && Array.indexOf(activityState, a.activity) == -1)
                        activityState.push(a.activity);
                });
                if (activityState.length > 0)
                    state.activities = activityState;
                return state;
            };

            function _setState(state) {
                if (state) {
                    self.completed = Boolean.parseBoolean(state.done, false);

                    if (state.hasOwnProperty("decisions")) {
                        if (typeof (self.decisions) != "object")
                            self.decisions = {};
                        Object.foreach(state.decisions, function (d, i) {
                            self.decisions[i] = Object.isNull(d) ? null : Object.clone(d);
                        });
                    }

                    if (!Array.isNullOrEmpty(state.activities)) {
                        var activityState = state.activities;
                        Array.foreach(self.activities, function (a) {
                            if (a && activityState.indexOf(a.activity) != -1) {
                                a.visible = true;
                            }
                        });
                    }
                }
            };

            this.getState = _getState;
            this.setState = _setState;

            Object.merge(this, overrides);

            this.base = {
                getState: _getState,
                setState: _setState
            };
        };

        this.injectRounds = function (app,
            rounds,         // array of rounds
            firstRound,     // first round number, used by round indicator
            lastRound,      // last round number, used by round indicator
            timeRemaining   // in seconds. if preset then Time Remaining count down appears
        ) {
            app.rounds = [];
            app.currentRound = null;

            Array.foreach(rounds, function (r, index) {
                if (!r)
                    throw new Error("Invalid round #" + index.toString());
                if (Array.isArray(r))
                    Array.append(app.rounds, r);
                else
                    app.rounds.push(r);
            });

            Array.foreach(app.rounds, function (round, index) {
                if (round) {
                    round.app = app;
                    if (Object.isFunction(round.startup))
                        round.startup.call(round, app);
                }
            });

            if (typeof (firstRound) !== "undefined")
                app.firstRound = Number.parse(firstRound);

            if (typeof (lastRound) !== "undefined")
                app.lastRound = Number.parse(lastRound);

            if (typeof (timeRemaining) !== "undefined")
                app.courseTime = Number.parse(timeRemaining);

            app.resolveRound = function (round, noException) {
                if (!Object.isNull(round)) {
                    var r;
                    switch (typeof (round)) {
                        case "number":
                            r = Math.round(round);
                            if (r < 0 || r >= app.rounds.length || !app.rounds[r]) {
                                if (noException)
                                    break;
                                throw new Error("roundlib.js: app.resolveRound - Invalid round index " + round);
                            }
                            return app.rounds[r];

                        case "string":
                            r = Array.lookupBy(app.rounds, "name", round);
                            if (!r) {
                                if (noException)
                                    break;
                                throw new Error("roundlib.js: app.resolveRound - Invalid round name '" + round + "'");
                            }
                            return r;

                        case "object":
                            if (round instanceof Module.Round)
                                return round;
                            break;
                    }
                }
                return null;
            };

            app.setCurrentRound = function (round, task) {
                try {
                    round = app.resolveRound(round);
                    if (round) {

                        // if round complete then goto the next one
                        while (round && round.completed) {
                            var ri = app.rounds.indexOf(round);
                            if (ri != -1 && ri < app.rounds.length - 1) {
                                round = app.rounds[ri + 1];
                                task = null;
                            }
                            else
                                break;
                        }

                        // set and activate current round
                        if (app.currentRound != round) {
                            app.currentRound = round;
                            if (round) {
                                if (task)
                                    task = round.resolveTask(task);
                                if ((!task || task.completed) && round.tasks.length > 0) {
                                    Array.foreach(round.tasks, function (t) {
                                        if (t && t.inTaskList && !t.completed) {
                                            task = t;
                                            return -1;
                                        }
                                    });
                                    if (!task)
                                        task = round.tasks[0]; // actualy we need to grab first isTask instance
                                }
                                round.activate(task);
                            }
                        }
                    }
                }
                catch (error) {
                    alert(TRC.getErrorMessage(error));
                }
            };

            app.getRoundState = function () {
                var rounds = {}, rs;
                Array.foreach(app.rounds, function (round) {
                    if (round && Object.isFunction(round.getState)) {
                        rs = round.getState.call(round);
                        if (rs)
                            rounds[round.name] = rs;
                    }
                });
                return {
                    cr: app.currentRound ? app.currentRound.name : null,
                    ct: (app.currentRound && app.currentRound.currentTask ? app.currentRound.currentTask.name : null),
                    rs: rounds
                };
            };

            app.setRoundState = function (state) {
                state = state || {};
                if (state.rs) {
                    var round;
                    Object.foreach(state.rs, function (rs, r) {
                        round = Array.lookupBy(app.rounds, "name", r);
                        if (round && Object.isFunction(round.setState))
                            round.setState.call(round, rs);
                    }, true);
                }
            };

            app.completeTask = function (task) {
                if (task && !task.completed && !task.__pendingTaskComplete__) {
                    if (task.isLastTask())
                        return true;

                    task.completed = true;

                    if (!app.saveState)
                        return true;

                    task.__pendingTaskComplete__ = true;
                    var t = task;
                    app.saveState(null,
                        function () { // success
                            t.completed = true;
                            delete t["__pendingTaskComplete__"];

                            var nextTask = t.getNextTask();
                            if (nextTask)
                                t.round.setCurrentTask(nextTask);

                            Function.invoke(app.taskList, "updateTasklist");
                        },
                        function (error) { // fail
                            delete t["__pendingTaskComplete__"];
                            alert("Current progress can't be saved.\r\nError details: " + TRC.getErrorMessage(error) + "\r\n\r\nPlease click 'OK' wait for 10 seconds and then try again.");
                        },
                        function () { // before save
                            t.completed = false;
                        }
                    );
                }
                return false;
            };

            app.completeRound = function (r, t, data) {
                var round = app.resolveRound(r);
                var task = (arguments.length > 1 && t) ? t : (round ? round.currentTask : null);

                if (!round)
                    round = task ? task.round : app.currentRound;

                if (!round)
                    throw new Error("Invalid completeRound argument(s): invalid round");

                var ri = app.rounds.indexOf(round), nextRound = null;
                if (ri != -1 && ri < app.rounds.length - 1)
                    nextRound = app.rounds[ri + 1];

                var origRoundState = null, origTaskState = null;

                origRoundState = round.completed;
                if (task) {
                    origTaskState = task.completed;
                    task.completed = true;
                }
                round.completed = true;

                function _commit() {
                    if (task)
                        task.completed = true;
                    if (round)
                        round.completed = true;

                    if (Function.invoke(round, "onCompleted") == false)
                        return;

                    if (nextRound)
                        app.setCurrentRound(nextRound);
                }

                if (!Object.isFunction(app.saveState)) {
                    try {
                        _commit();
                    }
                    catch (error) {
                        alert("Error in completeRound(" + round.name + "): " + TRC.getErrorMessage(error));
                        return false;
                    }
                    return true;
                }

                function _rollback() {
                    if (task && origTaskState != null)
                        task.completed = origTaskState;

                    if (origRoundState != null)
                        round.completed = origRoundState;
                }

                function _retry(error, step) {
                    alert("Server error occured " + (step ? step : "") + "!\r\nError details: " + TRC.getErrorMessage(error) +
                        "\r\n\r\nPlease click 'OK' wait for 10 seconds and then try again.");
                }

                if (Array.isNullOrEmpty(data))
                    data = null;
                else {
                    if (app.rounds && data.indexOf(app.rounds) == -1) {
                        data = Array.append([app.rounds], data);
                    }
                }

                var _completeCount = 3;
                function _completeRoundCommand() {
                    Simgate.executeCommand("CompleteRound",
                        function (result, okReponse) {
                            _commit();
                        },
                        function (error, errResponse) {
                            var msg = TRC.getErrorMessage(error);
                            if (msg.toLowerCase().indexOf(":state changed") != -1 && (--_completeCount) > 0) {
                                setTimeout(_completeRoundCommand, 1500);
                            }
                            else {
                                // _rollback(); // i don't think we can actually roll the completion back at this stage
                                alert("We were unable to advance you to next round for the following reason\r\n" + TRC.getErrorMessage(error) +
                                    "\r\n\r\nPlease click 'OK' and contact your facilitator/administrator to manually advance you to next round.\r\n\r\nWe apologize for inconvenience.");
                            }
                        });
                }

                app.saveState(
                    data,
                    function (result, saveResponse) {
                        var ctx = (typeof (Simgate) == "object" && Simgate.context) ? Simgate.context : null;
                        if (ctx && ctx.simId && !Array.isNullOrEmpty(ctx.simStateCommands) && ctx.simStateCommands.indexOf("CompleteRound") != -1) {
                            setTimeout(_completeRoundCommand, 1500);
                        }
                        else {
                            _commit();
                        }
                    },
                    function (error) {
                        _rollback();
                        _retry(error, "while saving user progress");
                    },
                    function () {
                        _rollback();
                    }
                );
                return false;
            }

            return app;
        };
    };
    return Module;
});

