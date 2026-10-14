define(["knockout", "client/lodash.min.js", "trc/trc.spa", "components/playbook/models/roundlib", "content/jf504"],
  function (ko, _, SPA, RoundLib, content) {

      var ACCESS_CODE = "8476";

      function showAccessGate(onUnlocked) {
          if (document.getElementById("jf-access-gate")) {
              onUnlocked();
              return;
          }

          var gate = document.createElement("div");
          gate.id = "jf-access-gate";
          gate.setAttribute("role", "dialog");
          gate.setAttribute("aria-modal", "true");
          gate.setAttribute("aria-label", "Access code required");
          gate.style.cssText = [
              "position:fixed",
              "inset:0",
              "z-index:2147483646",
              "display:flex",
              "align-items:center",
              "justify-content:center",
              "background:rgba(0,0,0,0.82)",
              "font-family:Lato,Arial,sans-serif"
          ].join(";");

          var panel = document.createElement("div");
          panel.style.cssText = [
              "width:420px",
              "max-width:92vw",
              "box-sizing:border-box",
              "padding:28px 30px 24px",
              "background:#132033",
              "border:2px solid #7eb6d4",
              "box-shadow:0 16px 40px rgba(0,0,0,0.55)",
              "color:#e8eef4",
              "text-align:left"
          ].join(";");

          var title = document.createElement("div");
          title.textContent = "Access Required";
          title.style.cssText = "font-size:22px;font-weight:700;color:#b2c8f6;margin:0 0 10px;line-height:1.3;";

          var copy = document.createElement("div");
          copy.textContent = "Enter the access code to begin the Joint Functions activity.";
          copy.style.cssText = "font-size:15px;line-height:1.45;color:#d7e3ee;margin:0 0 18px;";

          var label = document.createElement("label");
          label.htmlFor = "jf-access-code";
          label.textContent = "Access code";
          label.style.cssText = "display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#9aabb9;margin:0 0 6px;";

          var input = document.createElement("input");
          input.id = "jf-access-code";
          input.type = "password";
          input.maxLength = 12;
          input.autocomplete = "off";
          input.inputMode = "numeric";
          input.placeholder = "Enter code";
          input.style.cssText = [
              "display:block",
              "width:100%",
              "box-sizing:border-box",
              "padding:12px 14px",
              "margin:0 0 12px",
              "font-size:20px",
              "letter-spacing:0.18em",
              "border:1px solid #3d4f66",
              "border-radius:4px",
              "background:#0f1419",
              "color:#fff",
              "font-family:inherit"
          ].join(";");

          var error = document.createElement("div");
          error.textContent = "Incorrect access code. Try again.";
          error.style.cssText = "display:none;font-size:13px;color:#f59e0b;margin:0 0 12px;";

          var button = document.createElement("button");
          button.type = "button";
          button.textContent = "Unlock";
          button.style.cssText = [
              "border:1px solid #7eb6d4",
              "border-radius:20px",
              "padding:10px 20px",
              "font-size:14px",
              "font-weight:700",
              "cursor:pointer",
              "background:#1f4c7f",
              "color:#fff",
              "font-family:inherit"
          ].join(";");

          function unlock() {
              var entered = String(input.value || "").trim();
              if (entered === ACCESS_CODE) {
                  if (gate.parentNode) {
                      gate.parentNode.removeChild(gate);
                  }
                  onUnlocked();
                  return;
              }
              error.style.display = "block";
              input.value = "";
              input.focus();
          }

          button.addEventListener("click", unlock);
          input.addEventListener("keydown", function (evt) {
              if (evt.key === "Enter" || evt.keyCode === 13) {
                  evt.preventDefault();
                  unlock();
              }
          });

          panel.appendChild(title);
          panel.appendChild(copy);
          panel.appendChild(label);
          panel.appendChild(input);
          panel.appendChild(error);
          panel.appendChild(button);
          gate.appendChild(panel);
          document.body.appendChild(gate);

          window.setTimeout(function () {
              try { input.focus(); } catch (e) { }
          }, 50);
      }

      var isScormReady = false,
        scormError = null,
        isDataReady = false,
        app = new SPA.Application({
            title: content.title,
            dataModel: { content : content},
            scorm: new TRC.ScormAPI({
                manifestFail: function (err) {
                    scormError = err;
                }
            }),
            //dataModelStartup: false, // when some parts of the dataModel object could require round information at the startup time
            shellModuleId: "components/views/shell", // this is self-explanatory
            //launchDuration: 10, // seconds, default value is 10
            //launchPulse: 200, // milliseconds, default value is 200
            launchSequence: function () {
                return (this.base.launchSequence() && isScormReady && isDataReady);
            },
            launchAborted: function () {
                var err = "The following modules didn't initialize on time:";
                if (!this.isShellReady)
                    err += "\n\t- Shell view";
                if (!isScormReady)
                    err += "\n\t- SCORM API" + (scormError ? (": " + scormError) : "");
                if (!isDataReady)
                    err += "\n\t- Data server";
                err += "\n\nPlease wait one minute and try again.";
                throw new Error(err);
            },
            launch: function () {
                showAccessGate(function () {
                    window.openModalView("splash");
                });
            }
        });

      //inject round information here
      //RoundLib.injectRounds(app, [Round1, Round2, Round3], 1, 3);

      // manual dataModel start up here if needed
      // app.dataModel.startup();

      //#region Debug Code trc.fakelms only
      if (typeof (API) !== "undefined" && API.vendor == "TRC") {
          API.expirationDate = new Date("1/1/2020");
          API.commitOnly = ["cmi.suspend_data"];
          API.escapeData = false;
      }
      //#endregion

      // initialize scorm api
      app.scorm.initialize(
        function () {
            isScormReady = true;
            // when app is initialized we send a status of 'incomplete' and score of zero.  IMPORTANT: when user successfully completes activity you need to send status of 'complete' and score of '100'.  This should be placed at the end or in a userworkflow model that is managing next steps for the user within the app - inclusive of completion. For example, see summary.js of this project.  

            this.setStatus("incomplete", true, function () {
                //Success for setStatus
                this.setScore(0, true, function () {
                    //Success for setScore
                }, function() {
                    //Failure for setScore
                    alert(data);
                });
            }, function (data) {
                //Failure for setStatus
                alert(data);
            });
           

            var suspendData = this.getSuspendData(function (suspendData) {
                if (suspendData) {
                    if (typeof (suspendData) != "object")
                        suspendData = JSON.parse(suspendData);

                    // apply JSON state saved in the suspendData to the application data model and/or rounds
                    /*
                                app.setRoundState(suspendData.rounds);
        
                                for (var dm in app.dataModel) {
                                    if (suspendData.hasOwnProperty(dm)) {
                                        var module = app.dataModel[dm];
                                        if (module && Object.isFunction(module.setState)) {
                                            module.setState.call(module, suspendData[dm]);
                                        }
                                    }
                                }
        
                                if (suspendData.rounds) {
                                    currentRound = suspendData.rounds.cr;
                                    currentTask = suspendData.rounds.ct;
                                }
                                */
                }
                isDataReady = true;
            });
        }
      );

      return app;
  });
