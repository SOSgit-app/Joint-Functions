define(["knockout", "trc/trc.spa", "client/lodash.min.js"],
  function (ko, SPA, _) {

      return function () {

          var self = SPA.CreateView(this);
          var shell = window.application.shell;
          var dataModel = window.application.dataModel;

          self.isActive = ko.observable(false);
          self.congratulationText = ko.observable("CONGRATULATIONS!");
          self.feedback = ko.observable(dataModel.content.endActivityText);
          self.showCompletionConfirm = ko.observable(false);
          self.learnerName = ko.observable("");
          self.completionDateTime = ko.observable("");
          self.nameFieldFocused = ko.observable(false);
          self.certificateDownloaded = ko.observable(false);

          self.canDownload = ko.computed(function () {
              return String(self.learnerName() || "").trim().length > 0;
          });

          self.canConfirm = ko.computed(function () {
              return self.canDownload() && !!self.certificateDownloaded();
          });

          this.formatCompletionStamp = function (date) {
              try {
                  return date.toLocaleString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit"
                  });
              } catch (e) {
                  return date.toString();
              }
          };

          this.escapeHtml = function (value) {
              return String(value == null ? "" : value)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;");
          };

          this.safeFilePart = function (value) {
              return String(value || "learner")
                  .trim()
                  .replace(/[^a-zA-Z0-9-_ ]+/g, "")
                  .replace(/\s+/g, "_")
                  .slice(0, 40) || "learner";
          };

          this.buildCertificateHtml = function (name, stamp) {
              var activityTitle = (dataModel.content && (dataModel.content.mission || dataModel.content.title)) ||
                  "Joint Functions Map";
              return (
                  "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\" />" +
                  "<title>Certificate of Completion — " + self.escapeHtml(activityTitle) + "</title>" +
                  "<style>" +
                  "@page{size:landscape;margin:0.4in}" +
                  "*{box-sizing:border-box}" +
                  "body{margin:0;background:#1b2430;font-family:Georgia,'Times New Roman',serif;color:#1a2332;}" +
                  ".toolbar{position:sticky;top:0;z-index:5;display:flex;gap:10px;justify-content:center;padding:12px;background:#0f1419;font-family:'Segoe UI',Arial,sans-serif;}" +
                  ".toolbar button{border:0;border-radius:6px;padding:10px 16px;font-size:14px;font-weight:600;cursor:pointer}" +
                  ".toolbar .print{background:#1f4c7f;color:#fff}" +
                  ".toolbar .close{background:#3d4f66;color:#fff}" +
                  ".page{min-height:calc(100vh - 56px);display:flex;align-items:center;justify-content:center;padding:24px;}" +
                  ".cert{width:1050px;max-width:100%;aspect-ratio:11 / 8.5;background:linear-gradient(180deg,#fffdf8 0%,#f7f1e4 100%);border:14px solid #1f4c7f;outline:3px solid #c9a227;outline-offset:-22px;padding:42px 56px;text-align:center;position:relative;box-shadow:0 16px 40px rgba(0,0,0,.45);}" +
                  ".corner{position:absolute;width:54px;height:54px;border:3px solid #c9a227}" +
                  ".corner.tl{top:18px;left:18px;border-right:0;border-bottom:0}" +
                  ".corner.tr{top:18px;right:18px;border-left:0;border-bottom:0}" +
                  ".corner.bl{bottom:18px;left:18px;border-right:0;border-top:0}" +
                  ".corner.br{bottom:18px;right:18px;border-left:0;border-top:0}" +
                  ".seal{width:78px;height:78px;margin:0 auto 10px;border-radius:50%;border:4px solid #c9a227;background:radial-gradient(circle at 35% 30%,#2f6fb2,#143a63);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}" +
                  ".eyebrow{letter-spacing:.28em;text-transform:uppercase;font-size:13px;color:#6b7280;margin:0 0 8px;font-family:'Segoe UI',Arial,sans-serif;}" +
                  "h1{margin:0 0 6px;font-size:44px;color:#1f4c7f;letter-spacing:.02em;}" +
                  ".activity{margin:0 0 18px;font-size:22px;color:#243044;font-style:italic;}" +
                  ".ornament{margin:0 auto 18px;width:220px;height:2px;background:linear-gradient(90deg,transparent,#c9a227,transparent);position:relative}" +
                  ".ornament:before,.ornament:after{content:'';position:absolute;top:-3px;width:8px;height:8px;border-radius:50%;background:#c9a227}" +
                  ".ornament:before{left:0}.ornament:after{right:0}" +
                  ".presented{margin:0 0 8px;font-size:16px;color:#5a6575;}" +
                  ".name{margin:0 0 6px;font-size:40px;font-weight:700;color:#132033;border-bottom:2px solid #c9a227;display:inline-block;padding:0 18px 6px;min-width:42%;}" +
                  ".statement{margin:18px auto 24px;max-width:720px;font-size:18px;line-height:1.55;color:#243044;}" +
                  ".meta{font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#445060;margin-top:8px}" +
                  ".footer{margin-top:34px;display:flex;justify-content:space-between;gap:24px;font-family:'Segoe UI',Arial,sans-serif;}" +
                  ".sig{flex:1;text-align:center}" +
                  ".sig .line{border-top:1px solid #6b7785;margin:28px 18px 8px;height:0}" +
                  ".sig .label{font-size:12px;color:#5a6575;text-transform:uppercase;letter-spacing:.06em}" +
                  "@media print{body{background:#fff}.toolbar{display:none}.page{padding:0;min-height:auto}.cert{box-shadow:none;width:100%;max-width:none}}" +
                  "</style></head><body>" +
                  "<div class=\"toolbar\">" +
                  "<button class=\"print\" type=\"button\" onclick=\"window.print()\">Print / Save as PDF</button>" +
                  "<button class=\"close\" type=\"button\" onclick=\"window.close()\">Close</button>" +
                  "</div>" +
                  "<div class=\"page\"><div class=\"cert\">" +
                  "<div class=\"corner tl\"></div><div class=\"corner tr\"></div><div class=\"corner bl\"></div><div class=\"corner br\"></div>" +
                  "<div class=\"seal\">SOS</div>" +
                  "<p class=\"eyebrow\">Certificate of Completion</p>" +
                  "<h1>" + self.escapeHtml(activityTitle) + "</h1>" +
                  "<p class=\"activity\">Joint Functions Activity</p>" +
                  "<div class=\"ornament\"></div>" +
                  "<p class=\"presented\">This certifies that</p>" +
                  "<p class=\"name\">" + self.escapeHtml(name) + "</p>" +
                  "<p class=\"statement\">has successfully completed the Joint Functions activity and demonstrated the ability to apply Air Force core functions to scenario-based operational tasks.</p>" +
                  "<p class=\"meta\"><strong>Date &amp; time of completion</strong><br />" +
                  self.escapeHtml(stamp) +
                  "</p>" +
                  "<div class=\"footer\">" +
                  "<div class=\"sig\"><div class=\"line\"></div><div class=\"label\">Learner</div></div>" +
                  "<div class=\"sig\"><div class=\"line\"></div><div class=\"label\">Instructor / Proctor</div></div>" +
                  "</div>" +
                  "</div></div></body></html>"
              );
          };

          this.downloadCertificate = function () {
              if (!self.canDownload()) {
                  return;
              }
              var name = String(self.learnerName() || "").trim();
              var stamp = self.completionDateTime() || self.formatCompletionStamp(new Date());
              if (!self.completionDateTime()) {
                  self.completionDateTime(stamp);
              }
              var html = self.buildCertificateHtml(name, stamp);
              var filename =
                  "Joint_Functions_Certificate_" +
                  self.safeFilePart(name) +
                  "_" +
                  new Date().toISOString().slice(0, 10) +
                  ".html";

              // Open a real certificate window (avoids replacing the activity page with a blank/dark view).
              var certWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=850");
              if (certWindow) {
                  certWindow.document.open();
                  certWindow.document.write(html);
                  certWindow.document.close();
                  try {
                      certWindow.document.title = "Certificate of Completion — " + name;
                      certWindow.focus();
                  } catch (e) { }
              }

              // Also offer a file download for saving/emailing.
              try {
                  var blob = new Blob([html], { type: "text/html;charset=utf-8" });
                  var a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  a.rel = "noopener";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.setTimeout(function () {
                      URL.revokeObjectURL(a.href);
                  }, 1000);
              } catch (e2) { }

              self.certificateDownloaded(true);
              shell.completionRecord = {
                  name: name,
                  completedAt: stamp,
                  completedAtIso: new Date().toISOString(),
                  certificateDownloaded: true
              };
          };

          this.activateView = function () {
              var params = self.getParameters();
              if (params && params.feedback) {
                  self.feedback(params.feedback);
              }
              self.showCompletionConfirm(false);
              self.learnerName("");
              self.completionDateTime("");
              self.certificateDownloaded(false);
          };

          this.openCompletionConfirm = function () {
              self.completionDateTime(self.formatCompletionStamp(new Date()));
              self.certificateDownloaded(false);
              self.showCompletionConfirm(true);
              window.setTimeout(function () {
                  self.nameFieldFocused(true);
              }, 50);
          };

          this.cancelCompletionConfirm = function () {
              self.showCompletionConfirm(false);
          };

          this.confirmCompletion = function () {
              if (!self.canConfirm()) {
                  return;
              }
              var name = String(self.learnerName() || "").trim();
              var stamp = self.completionDateTime() || self.formatCompletionStamp(new Date());
              shell.completionRecord = {
                  name: name,
                  completedAt: stamp,
                  completedAtIso: new Date().toISOString(),
                  certificateDownloaded: !!self.certificateDownloaded()
              };
              self.showCompletionConfirm(false);
              self.finishActivity();
          };

          this.finishActivity = function () {
              self.isActive(false);
              shell.startPlayVideo("JF504_7", function () {
                  var scorm = window.application.scorm;
                  window.setTimeout(function () {
                      scorm.setScore(100, true, function () {
                          scorm.setStatus("completed", true, function () {
                              var closed = self.close();
                              self.closeActivity();
                          }, function (data) {
                              alert(data);
                          });
                      }, function (data) {
                          alert(data);
                      });
                  });
              });
          };

          this.closeActivity = function () {
              window.close();
          };

          this.compositionComplete = function (view) {
              window.setTimeout(function () { self.isActive(true); }, 500);
          };
      };
  });
