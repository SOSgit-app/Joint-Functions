define(["knockout", "trc/trc.spa"],
  function (ko, SPA) {

      return function () {

          var self = SPA.CreateView(this);
          var shell = window.application.shell;
          var dataModel = window.application.dataModel;

          self.isActive = ko.observable(false);
          self.explanation = ko.observable();
          self.isContinueClicked = ko.observable(false);
          self.functionLibrary = ko.observableArray();
          self.elementLibrary = ko.observableArray();
          self.subtasks = ko.observableArray();
          self.answers = ko.observableArray();
          self.feedbackInPercents = ko.observable();
          self.incorrectFunc = ko.observable();
          self.hoverTimeout = ko.observable();
          self.staticFeedback = ko.observable();
          self.dynamicFeedback = ko.observableArray();
          self.feedbackResult = ko.observable();

          this.buildExplanation = function () {
              var prog = shell.getScenarioProgress();
              var prefix = "Scenario " + prog.current + " of " + prog.total + ". ";
              var attemptsLeft = shell.allowedAttempts();
              var allowed = shell.content.allowedStrikes || 5;
              return prefix + shell.content.gameInstruction
                  .replace("[attemptsRemaining]", attemptsLeft + " of " + allowed);
          };

          this.isDebugBuild = function () {
              return (window.TRC && TRC.config && TRC.config.debug) ||
                  /index-debug\.html/i.test(window.location.pathname || "");
          };

          this.bindDebugShortcuts = function () {
              if (!self.isDebugBuild()) {
                  return;
              }
              $(document).off("keydown.scenarioDebug", self.onDebugKeydown);
              $(document).on("keydown.scenarioDebug", self.onDebugKeydown);
          };

          this.activateView = function () {
              var params = self.getParameters();
              self.functionLibrary.removeAll();
              self.elementLibrary.removeAll();
              self.subtasks.removeAll();
              self.populateFunctionLibrary();
              self.populateElementLibrary();
              self.populateSubtasks();
              self.explanation(self.buildExplanation());
              self.bindDebugShortcuts();
          };

          this.reinitializeScenario = function () {
              self.teardownDragAndDrop();
              self.isContinueClicked(false);
              self.functionLibrary.removeAll();
              self.elementLibrary.removeAll();
              self.subtasks.removeAll();
              self.answers.removeAll();
              self.feedbackInPercents(undefined);
              self.incorrectFunc(0);
              self.staticFeedback("");
              self.dynamicFeedback.removeAll();
              self.feedbackResult("");
              self.populateFunctionLibrary();
              self.populateElementLibrary();
              self.populateSubtasks();
              self.explanation(self.buildExplanation());
              shell.tutorial.hide();
              window.setTimeout(function () {
                  self.isActive(true);
                  self.startScenarioBoard();
              }, 150);
          };

          this.teardownDragAndDrop = function () {
              var $root = $(".scenario");
              $root.find(".functionEl").each(function () {
                  var $el = $(this);
                  if ($el.data("ui-draggable")) {
                      $el.draggable("destroy");
                  }
              });
              $root.find(".functionDrop div, .firstColumn").each(function () {
                  var $el = $(this);
                  if ($el.data("ui-droppable")) {
                      $el.droppable("destroy");
                  }
              });
          };

          this.startScenarioBoard = function () {
              self.isContinueClicked(true);
              window.setTimeout(function () {
                  self.teardownDragAndDrop();
                  self.allowDragAndDrop();
                  shell.tutorial.view = "scenario";
                  if (shell.content.tutorial) {
                      shell.tutorial.show();
                  }
              }, 0);
          };

          this.submit = function () {
              self.startScenarioBoard();
          };

          this.getAnswerElement = function (subtask) {
              var match = ko.utils.arrayFirst(shell.scenario().answers, function (item) {
                  return item.subtask === subtask;
              });
              if (!match) {
                  return "";
              }
              if (typeof match.force === "string") {
                  return match.force;
              }
              if (Array.isArray(match.force)) {
                  return match.force[0] || "";
              }
              return "";
          };

          this.truncateElementLabel = function (text, maxLen) {
              maxLen = maxLen || 17;
              if (!text || text.length <= maxLen) {
                  return text;
              }
              return text.substring(0, maxLen) + "[...]";
          };

          this.autofillElementForRow = function (rowIndex, subtask) {
              var force = self.getAnswerElement(subtask);
              var $elementSlot = $(".scenario .elementDrop .el").eq(rowIndex);
              $elementSlot.empty();
              if (force) {
                  $elementSlot.append(
                      $('<div class="element autofilled more_info"></div>')
                          .attr("title", force)
                          .text(self.truncateElementLabel(force))
                  );
              }
          };

          this.populateElementLibrary = function () {
              var seen = {};
              var items = shell.scenario().force && shell.scenario().force.item
                  ? shell.scenario().force.item
                  : [];
              ko.utils.arrayForEach(items, function (val) {
                  if (!val || seen[val]) {
                      return;
                  }
                  seen[val] = true;
                  self.elementLibrary.push(val);
              });
          };

          this.populateFunctionLibrary = function () {
              ko.utils.arrayForEach(shell.scenario().funct.item, function (val) {
                  self.functionLibrary.push(val);
              });
          };

          this.populateSubtasks = function () {
              // Shuffle row order once per scenario set; keep it fixed across retries.
              if (!shell.currentSubtaskOrder || !shell.currentSubtaskOrder.length) {
                  shell.currentSubtaskOrder = self.shuffleArray(shell.scenario().subtask.item.slice());
              }
              self.subtasks.removeAll();
              ko.utils.arrayForEach(shell.currentSubtaskOrder, function (val) {
                  self.subtasks.push(val);
              });
          };

          this.prepareRetry = function () {
              self.isActive(true);
              self.reset();
              self.explanation(self.buildExplanation());
          };

          // #region Drag and drop
          self.allowDragAndDrop = function () {
              var $root = $(".scenario");
              var dropzone1 = $root.find(".functionDrop div");
              var dropzone4 = $root.find(".firstColumn");

              self.bindDraggable($root.find(".functionEl"), ".chart-board");
              self.bindDroppable(dropzone1);
              self.bindDroppable(dropzone4);
          };

          this.resetFunctionDropStyles = function ($el) {
              if ($el.closest(".functionDrop").length) {
                  $el.css({
                      position: "absolute",
                      top: "30px",
                      left: "0",
                      margin: "0"
                  });
              }
          };

          this.bindDraggable = function (el, appendTo) {
              $(el).each(function () {
                  var $target = $(this);
                  if ($target.data("ui-draggable")) {
                      $target.draggable("destroy");
                  }
                  $target.draggable({
                      appendTo: appendTo,
                      helper: "clone",
                      cursorAt: { left: 57, top: 20 },
                      stop: function (ev, ui) {
                          self.resetFunctionDropStyles($(this));
                          self.dragStop(ev, ui);
                      },
                      start: function (ev, ui) {
                          ui.helper.css({
                              margin: 0,
                              top: "auto",
                              left: "auto"
                          });
                          self.addTooltip(ev, ui);
                      }
                  });
              });
          };

          this.bindDroppable = function (el) {
              $(el).each(function () {
                  var $target = $(this);
                  if ($target.data("ui-droppable")) {
                      $target.droppable("destroy");
                  }
                  $target.droppable({
                      drop: self.drop
                  });
              });
          };

          this.drop = function (ev, ui) {
              $(".title").remove();
              if (ev) {
                  var dropElement = $(ev.target);
                  ev.preventDefault();

                  var el = $(ui.draggable);

                  if (dropElement.parent().attr("class").indexOf("functionDrop") >= 0 && el.attr("class").indexOf("functionEl") >= 0) {
                      if (dropElement.find("div").length > 0) {
                          dropElement.find("div").remove();
                      }
                      if (el.parents(".functionDrop").length <= 0) {
                          el = el.clone();
                          el.css("margin", "0");
                      }
                      dropElement.append(el);
                      self.resetFunctionDropStyles(el);
                      self.bindDraggable(el, ".chart-board");

                      var rowIndex = dropElement.parent().children(".el").index(dropElement);
                      var subtask = self.subtasks()[rowIndex];
                      if (subtask) {
                          self.autofillElementForRow(rowIndex, subtask);
                      }
                  }
                  if (dropElement.attr("class").indexOf("firstColumn") >= 0 && el.attr("class").indexOf("functionEl") >= 0 && el.parents(".functionDrop").length > 0) {
                      var $row = el.closest(".el");
                      var fromRow = $row.parent().children(".el").index($row);
                      el.remove();
                      if (fromRow >= 0) {
                          $(".scenario .elementDrop .el").eq(fromRow).empty();
                      }
                  }
              }
          };

          this.dragStop = function (ev, ui) {
              if (ev) {
                  ev.stopPropagation();
              }
          };
          // #endregion

          this.reset = function () {
              self.teardownDragAndDrop();
              $(".scenario .functionDrop").find(".functionEl").remove();
              $(".scenario .elementDrop .el").empty();
              self.allowDragAndDrop();
          };

          this.evaluate = function (isTest) {
              if (shell.tutorial) {
                  shell.tutorial.hide();
              }
              var back = false;
              var end = false;
              self.isActive(false);
              if (isTest != true) {
                  self.getAnswers();
              }
              var feedback = "";
              var title = "";
              if (self.feedbackInPercents() == 100) {
                  feedback = shell.content.feedbacks[0].text;
                  self.staticFeedback(feedback);
              }
              if (self.feedbackInPercents() >= 80 && self.feedbackInPercents() < 100) {
                  self.staticFeedback(shell.content.feedbacks[1].text);
                  feedback = shell.content.feedbacks[1].text
                      .replace("[functIC]", self.incorrectFunc());

                  self.dynamicFeedback.push(self.incorrectFunc());
              }
              if (self.feedbackInPercents() < 80) {
                  var attempts = shell.allowedAttempts() - 1;
                  shell.allowedAttempts(attempts);
                  var allowedStrikes = shell.content.allowedStrikes || 5;
                  var subtasks = "</br>";
                  ko.utils.arrayForEach(self.answers(), function (item) {
                      if (!item.isCorrectFunc) {
                          self.dynamicFeedback.push(item.subtask);
                          subtasks += "<li>" + item.subtask + "</li>";
                      }
                  });
                  if (attempts > 0) {
                      self.staticFeedback(shell.content.feedbacks[2].text);
                      feedback = shell.content.feedbacks[2].text
                          .replace("[subtasks]", subtasks)
                          .replace("[currentStrikesLeft]", attempts)
                          .replace("[allowedStrikes]", allowedStrikes);
                      back = true;
                      title = "TRY AGAIN";
                  } else {
                      self.staticFeedback(shell.content.feedbacks[3].text);
                      feedback = shell.content.feedbacks[3].text
                          .replace("[allowedStrikes]", allowedStrikes);
                      back = false;
                      end = true;
                      title = "ATTEMPTS EXHAUSTED";
                      if (shell && window.application && window.application.scorm) {
                          window.application.scorm.setStatus("failed", true);
                      }
                  }
              }

              var passed = self.feedbackInPercents() >= 80;
              if (passed && shell.hasMoreScenariosAfterCurrent()) {
                  title = "NEXT SCENARIO";
              }

              self.feedbackResult(feedback);
              if ($.isFunction(window.openModalView)) {
                  window.openModalView("feedback", {
                      feedback: self.feedbackResult(),
                      back: back,
                      end: end,
                      title: title,
                      retryCallBack: back ? function () { self.prepareRetry(); } : null,
                      callBack: function () {
                          if (passed && shell.advanceToNextScenario()) {
                              self.reinitializeScenario();
                              return;
                          }
                          self.close();
                          window.openView("endActivity");
                      }
                  });
              }
          };

          this.getAnswers = function () {
              self.answers.removeAll();
              var counter = 0;
              var incorrectFunc = 0;
              var functionsContainer = $(".functionDrop .el");
              ko.utils.arrayForEach(self.subtasks(), function (task) {
                  var answer = { choosedFunction: "", subtask: task, element: self.getAnswerElement(task) };
                  if ($(functionsContainer[counter]).has(".functionEl").length > 0) {
                      answer.choosedFunction = $(functionsContainer[counter]).find(".functionEl").text();
                  }
                  answer.isCorrectFunc = self.isItRightFunction(answer);
                  if (!answer.isCorrectFunc) {
                      incorrectFunc++;
                  }
                  self.answers.push(answer);
                  counter++;
              });
              self.countPercentage(incorrectFunc);
          };

          this.countPercentage = function (incorrectFunc) {
              var total = self.subtasks().length || 1;
              self.feedbackInPercents(((total - incorrectFunc) * 100) / total);
              self.incorrectFunc(incorrectFunc);
          };

          this.isItRightFunction = function (answer) {
              var match = ko.utils.arrayFirst(shell.scenario().answers, function (item) {
                  return answer.subtask === item.subtask && answer.choosedFunction == item.funct;
              });

              if (match) {
                  return true;
              }
              else {
                  return false;
              }
          };

          this.shuffleArray = function (array) {
              for (var i = array.length - 1; i > 0; i--) {
                  var j = Math.floor(Math.random() * (i + 1));
                  var temp = array[i];
                  array[i] = array[j];
                  array[j] = temp;
              }
              return array;
          };

          this.showTootips = function () {
              $(".more_info").click(function (e) {
                  self.addTooltip(e);
              });
          };

          this.addTooltip = function (ev, ui) {
              if (is_touch_device()) {
                  clearTimeout(self.hoverTimeout());
                  var cuurentEl = $(ev.target);

                  $(".element").css("z-index", "initial");
                  $(".title").remove();
                  var $title = cuurentEl.find(".title");
                  if (!$title.length && cuurentEl.hasClass("element")) {
                      cuurentEl.append('<div class="title">' + cuurentEl.attr("title") + '</div>');
                  } else {
                      $title.remove();
                  }
                  var timer = setTimeout(function () { $(".title").remove(); $(".element").css("z-index", 1); }, 1500);
                  self.hoverTimeout(timer);
             }
          };

          function is_touch_device() {
              return "ontouchstart" in window
                  || navigator.maxTouchPoints;
          }

          this.debugSkipToNextScenario = function () {
              if (!self.isDebugBuild()) {
                  return;
              }
              shell.tutorial.hide();
              if (shell.hasMoreScenariosAfterCurrent()) {
                  shell.advanceToNextScenario();
                  self.reinitializeScenario();
                  return;
              }
              self.close();
              window.openView("endActivity");
          };

          this.onDebugKeydown = function (event) {
              if (!self.isDebugBuild()) {
                  return;
              }
              if (!event.ctrlKey || !event.shiftKey) {
                  return;
              }
              var isF = event.key === "f" || event.key === "F" || event.keyCode === 70 || event.code === "KeyF";
              if (!isF) {
                  return;
              }
              event.preventDefault();
              self.debugSkipToNextScenario();
          };

          this.compositionComplete = function (view) {
              window.setTimeout(function () { self.isActive(true); }, 500);
              self.bindDebugShortcuts();
          };

          this.bindingComplete = function () {
              self.showTootips();
          };

      };
  });
