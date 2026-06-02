define(["knockout", "client/lodash.min.js", "trc/trc.spa", "components/playbook/models/roundlib", "content/jf504"],
  function (ko, _, SPA, RoundLib, content) {

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
                window.openModalView("splash");
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
