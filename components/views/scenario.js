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
          self.incorrectEl = ko.observable();
          self.hoverTimeout = ko.observable();
          self.staticFeedback = ko.observable();
          self.dynamicFeedback = ko.observableArray();
          self.feedbackResult = ko.observable();

          this.buildExplanation = function () {
              var prog = shell.getScenarioProgress();
              var prefix = "Scenario " + prog.current + " of " + prog.total + ". ";
              return prefix + shell.content.gameInstruction;
          };

          this.activateView = function () {
              var params = self.getParameters();
              self.populateFunctionLibrary();
              self.populateElementLibrary();
              self.populateSubtasks();
              self.explanation(self.buildExplanation());
          };

          this.reinitializeScenario = function () {
              self.isContinueClicked(false);
              self.functionLibrary.removeAll();
              self.elementLibrary.removeAll();
              self.subtasks.removeAll();
              self.answers.removeAll();
              self.feedbackInPercents(undefined);
              self.incorrectFunc(0);
              self.incorrectEl(0);
              self.staticFeedback("");
              self.dynamicFeedback.removeAll();
              self.feedbackResult("");
              $(".functionDrop").find(".functionEl").remove();
              $(".elementDrop").find(".element").each(function () {
                  $(".thirdColumn").append($(this));
              });
              self.populateFunctionLibrary();
              self.populateElementLibrary();
              self.populateSubtasks();
              self.explanation(self.buildExplanation());
              shell.tutorial.hasPlayed(false);
              shell.tutorial.hide();
              $(".thirdColumn").scrollTop(0);
              window.setTimeout(function () {
                  self.isActive(true);
              }, 100);
          };

          this.submit = function () {
              self.isContinueClicked(true);
              self.allowDragAndDrop();
              shell.tutorial.view = 'scenario';
              if (shell.content.tutorial) shell.tutorial.show();
          };


          this.populateFunctionLibrary = function () {
              ko.utils.arrayForEach(shell.scenario().funct.item, function (val) {
                  self.functionLibrary.push(val);
              });
          };

          this.populateElementLibrary = function () {
              var forceList;
              if (shell.scenarioIndexes[1] == 0) {
                  forceList = shell.scenario().force.first;
              }
              else {
                  forceList = shell.scenario().force.second;
              }

              ko.utils.arrayForEach(forceList, function (val) {
                  self.elementLibrary.push(val);
              });
          };

          this.populateSubtasks = function () {
              var subtasks = self.shuffleArray(shell.scenario().subtask.item);
              ko.utils.arrayForEach(subtasks, function (val) {
                  self.subtasks.push(val);
              });
          };

          this.scrollDown = function () {
              $(".thirdColumn").animate({
                  scrollTop: "+=" + 70 + "px"
              });
          };

          this.scrollUp = function () {
              $(".thirdColumn").animate({
                  scrollTop: "-=" + 70 + "px"
              });
          };

          // #region Drag and drop
          self.allowDragAndDrop = function () {
              var dropzone1 = $(".functionDrop div");
              var dropzone2 = $(".elementDrop div");
              var dropzone3 = $(".thirdColumn");
              var dropzone4 = $(".firstColumn");

              self.bindDraggable(".functionEl", '.container');
              self.bindDraggable(".element", '.container');

              self.bindDroppable(dropzone1);
              self.bindDroppable(dropzone2);
              self.bindDroppable(dropzone3);
              self.bindDroppable(dropzone4);
          };

          this.bindDraggable = function (el, appendTo) {
              $(el).draggable({
                  appendTo: appendTo,
                  helper: 'clone',
                  stop: self.dragStop,
                  start: function (ev, ui) {
                      // $(".title").remove();
                      self.addTooltip(ev, ui);                     
                  }
              });
          };

          this.bindDroppable = function (el) {
              $(el).droppable({
                  drop: self.drop
              });
          };

          this.drop = function (ev, ui) {
              $(".title").remove();
              if (ev) {
                  var dropElement = $(ev.target);
                  ev.preventDefault();

                  var el = $(ui.draggable);

                  if (dropElement.parent().attr('class').indexOf("functionDrop") >= 0 && el.attr("class").indexOf("functionEl") >= 0) {
                      if (dropElement.find("div").length > 0) {
                          dropElement.find("div").remove();
                      }
                      if (el.parents(".functionDrop").length <= 0) {
                          el = el.clone();
                          el.css('top', '-5px');
                          el.css('margin', '0');
                      }
                      dropElement.append(el);
                      self.bindDraggable(el, '.container');
                  }
                  if (dropElement.attr('class').indexOf("firstColumn") >= 0 && el.attr("class").indexOf("functionEl") >= 0 && el.parents(".functionDrop").length > 0) {
                      el.remove();
                  }

                  if (dropElement.parent().attr('class').indexOf("elementDrop") >= 0 && el.attr("class").indexOf("element") >= 0) {
                      if (dropElement.find("div").length > 0) {
                          var item = dropElement.find("div");
                          $(".thirdColumn").append(item);
                      }
                      el.css('top', '-5px');
                      el.css('margin', '0');
                      dropElement.append(el);
                  }

                  if (dropElement.attr('class').indexOf("thirdColumn") >= 0 && el.attr("class").indexOf("element") >= 0) {
                      $(dropElement).append(el);
                  }
              };
          };

          this.dragover = function (ev) {
              if (ev) {
                  ev.preventDefault();
                  if (ev.target.getAttribute("draggable") == "true")
                      ev.originalEvent.dataTransfer.dropEffect = "none"; // dropping is not allowed
                  else
                      ev.originalEvent.dataTransfer.dropEffect = "all"; // drop it like it's hot
              }
          };

          this.dragStop = function (ev, ui) {
              if (ev) {
                  ev.stopPropagation();
              }
          };
          // #endregion

          this.reset = function () {
              $('.functionDrop').find(".functionEl").remove();
              var droppedElements = $('.elementDrop').find(".element");
              droppedElements.each(function (index, item) {
                  $(".thirdColumn").append(item);
              });
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
                      .replace("[functIC]", self.incorrectFunc())
                      .replace("[eleIC]", self.incorrectEl());

                  self.dynamicFeedback.push(self.incorrectFunc());
                  self.dynamicFeedback.push(self.incorrectEl());
              }
              if (self.feedbackInPercents() < 80) {
                  //if (shell.allowedAttempts() != 1) {
                      var attempts = shell.allowedAttempts() - 1;
                      shell.allowedAttempts(attempts);
                      var subtasks = "</br>";
                      ko.utils.arrayForEach(self.answers(), function (item) {
                          if (!item.isCorrectFunc || !item.isCorrectEl) {
                              self.dynamicFeedback.push(item.subtask);
                              subtasks += "<li>" + item.subtask + "</li>"
                          }
                      });
                      self.staticFeedback(shell.content.feedbacks[2].text);
                      feedback = shell.content.feedbacks[2].text
                          .replace("[subtasks]", subtasks)
                          .replace("[currentStrikesLeft]", attempts)
                          .replace("[allowedStrikes]", 3);
                      back = true;
                      title = "TRY AGAIN";
                  //}
                  //else {
                  //    self.staticFeedback(shell.content.feedbacks[3].text);
                  //    feedback = shell.content.feedbacks[3].text;
                  //    end = true;
                  //}
              }

              var passed = self.feedbackInPercents() >= 80;
              if (passed && shell.hasMoreScenariosAfterCurrent()) {
                  title = "NEXT SCENARIO";
              }

              self.feedbackResult(feedback);
              if ($.isFunction(window.openModalView)) {
                  window.openModalView('feedback', {
                      feedback: self.feedbackResult(),
                      back: back,
                      end: end,
                      title: title,
                      callBack: function () {
                          if (passed && shell.advanceToNextScenario()) {
                              self.reinitializeScenario();
                              return;
                          }
                          self.close();
                          shell.startPlayVideo('JF504_7', function () { window.openView("endActivity"); });
                      }
                  });
              }
          };

          this.getAnswers = function () {
              self.answers.removeAll();
              var counter = 0;
              var rigthAnswers = 0;
              var incorrectFunc = 0;
              var incorrectEl = 0;
              var functionsContainer = $('.functionDrop .el');
              var elementsContainer = $('.elementDrop .el');
              ko.utils.arrayForEach(self.subtasks(), function (task) {
                  var answer = { choosedFunction: "", subtask: task, element: "" };
                  if ($(functionsContainer[counter]).has('.functionEl').length > 0) {
                      answer.choosedFunction = $(functionsContainer[counter]).find('.functionEl').text();
                  }
                  if ($(elementsContainer[counter]).has('.element').length > 0) {
                      answer.element = $(elementsContainer[counter]).find('.element').attr('title');
                  }
                  answer.isCorrectFunc = self.isItRightFunction(answer);
                  answer.isCorrectEl = self.isItRightElement(answer);
                  if (answer.isCorrectFunc && answer.isCorrectEl) {
                      rigthAnswers++;
                  }
                  if (!answer.isCorrectFunc) {
                      incorrectFunc++;
                  }
                  if (!answer.isCorrectEl) {
                      incorrectEl++;
                  }
                  self.answers.push(answer);
                  counter++
              });
              self.countPercentage(incorrectFunc, incorrectEl);

          };

          this.countPercentage = function (incorrectFunc, incorrectEl) {
              var total = self.subtasks().length || 1;
              self.feedbackInPercents(
                  (((total - incorrectFunc) + (total - incorrectEl)) * 100) / (total * 2)
              );
              self.incorrectFunc(incorrectFunc);
              self.incorrectEl(incorrectEl);
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


          this.isItRightElement = function (answer) {
              var match = ko.utils.arrayFirst(shell.scenario().answers, function (item) {
                  return answer.subtask === item.subtask && jQuery.inArray(answer.element, item.force) >= 0;
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
          }

          this.showTootips = function () {
              $(".more_info").click(function (e) {
                  self.addTooltip(e);
              });
          };

          this.addTooltip = function (ev, ui) {
              if (is_touch_device()) {
                  clearTimeout(self.hoverTimeout());
                  var cuurentEl = $(ev.target);

                  //var offset = $(this).offset();

                  $(".element").css("z-index", "initial");
                  $(".title").remove();
                  var $title = cuurentEl.find(".title");
                  if (!$title.length && cuurentEl.hasClass("element")) {
                      cuurentEl.append('<div class="title">' + cuurentEl.attr("title") + '</div>');
                      //$(".title").css("left", offset.left - $(window).scrollLeft() - 50);
                      //$(".title").css("top", offset.top - $(window).scrollTop() + 20);

                  } else {
                      $title.remove();
                  }
                  var timer = setTimeout(function () { $(".title").remove(); $(".element").css("z-index", 1); }, 1500);
                  self.hoverTimeout(timer);
             }
              
          };

          function is_touch_device() {
              return 'ontouchstart' in window        // works on most browsers 
                  || navigator.maxTouchPoints;       // works on IE10/11 and Surface
          };

          this.compositionComplete = function (view) {
              window.setTimeout(function () { self.isActive(true); }, 500); //find another call after view is loaded
          };

          this.bindingComplete = function () {
              self.showTootips();
          };

      };
  });
