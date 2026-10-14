/**
 * Build a printable paper copy of Joint Functions Map from editor scenario data.
 * Student copy has blanks; instructor copy includes the answer key.
 */
(function (root) {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function unique(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (item) {
      var text = String(item || "").trim();
      if (!text || seen[text]) return;
      seen[text] = true;
      out.push(text);
    });
    return out;
  }

  function getForceItems(data) {
    if (!data || !data.force) return [];
    if (Array.isArray(data.force.item)) return data.force.item.slice();
    if (Array.isArray(data.force.first)) return data.force.first.slice();
    return [];
  }

  function getAnswerForce(answer) {
    if (!answer) return "";
    if (typeof answer.force === "string") return answer.force;
    if (Array.isArray(answer.force)) return answer.force[0] || "";
    return "";
  }

  function scenarioNumber(id) {
    var n = parseInt(String(id || "").replace(/^scenario/i, ""), 10);
    return isNaN(n) ? id : n;
  }

  function collectChoices(scenarios, ids) {
    var functions = [];
    var joints = [];
    ids.forEach(function (id) {
      var data = scenarios[id];
      if (!data) return;
      functions = functions.concat((data.funct && data.funct.item) || []);
      joints = joints.concat(getForceItems(data));
    });
    return {
      functions: unique(functions),
      joints: unique(joints),
    };
  }

  function answerForTask(data, task) {
    var answers = (data && data.answers) || [];
    var i;
    for (i = 0; i < answers.length; i++) {
      if (answers[i] && answers[i].subtask === task) {
        return {
          funct: answers[i].funct || "",
          force: getAnswerForce(answers[i]),
        };
      }
    }
    return { funct: "", force: "" };
  }

  function stampDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function choiceBankHtml(title, items) {
    if (!items.length) return "";
    return (
      '<div class="bank">' +
      "<h3>" +
      escapeHtml(title) +
      "</h3>" +
      "<ul>" +
      items.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") +
      "</ul>" +
      "</div>"
    );
  }

  function taskHtml(task, index, key, includeAnswers) {
    var joint =
      '<div class="joint">Joint Function: <strong>' +
      escapeHtml(key.force || "(not set in answer key)") +
      "</strong></div>";
    var answerBlock = includeAnswers
      ? '<div class="key"><strong>Air Force Core Function:</strong> ' +
        escapeHtml(key.funct || "(missing)") +
        "</div>"
      : '<div class="write-in">' +
        "<div class=\"write-label\">Air Force Core Function</div>" +
        "<div class=\"lines\" aria-hidden=\"true\"></div>" +
        "<div class=\"lines\" aria-hidden=\"true\"></div>" +
        "<div class=\"lines\" aria-hidden=\"true\"></div>" +
        "</div>";
    return (
      '<article class="task">' +
      "<div class=\"num\">Task " +
      (index + 1) +
      "</div>" +
      '<p class="prompt">' +
      escapeHtml(task) +
      "</p>" +
      joint +
      answerBlock +
      "</article>"
    );
  }

  function scenarioHtml(id, data, includeAnswers) {
    var tasks = (data && data.subtask && data.subtask.item) || [];
    var functions = unique((data && data.funct && data.funct.item) || []);
    var body = tasks
      .map(function (task, index) {
        return taskHtml(task, index, answerForTask(data, task), includeAnswers);
      })
      .join("");
    if (!tasks.length) {
      body = "<p class=\"empty\">No scenario based tasks in this set.</p>";
    }
    return (
      '<section class="set">' +
      "<h2>Scenario Set " +
      escapeHtml(scenarioNumber(id)) +
      "</h2>" +
      choiceBankHtml("Air Force Core Functions for this set", functions) +
      body +
      "</section>"
    );
  }

  function documentCss() {
    return (
      "body{font-family:Calibri,Segoe UI,Arial,sans-serif;color:#1a2332;margin:24px;line-height:1.4}" +
      "h1{margin:0 0 6px;font-size:24px;color:#1f4c7f}" +
      ".meta,.note{color:#445060;font-size:13px;margin:0 0 14px}" +
      ".id-block{border:1px solid #c5ced8;padding:12px 14px;margin:0 0 18px;font-size:14px}" +
      ".id-block div{margin:10px 0}" +
      ".bank{border:1px solid #d5dbe3;background:#f7f8fa;padding:10px 14px;margin:0 0 14px}" +
      ".bank h3{margin:0 0 6px;font-size:14px}" +
      ".bank ul{margin:0;padding-left:1.2rem;font-size:13px}" +
      ".bank li{margin:2px 0}" +
      ".set{page-break-inside:avoid;margin:0 0 22px}" +
      "h2{font-size:18px;color:#1f4c7f;border-bottom:2px solid #d5dbe3;padding-bottom:4px}" +
      ".task{border:1px solid #d5dbe3;padding:12px 14px;margin:0 0 14px;page-break-inside:avoid}" +
      ".num{font-size:12px;font-weight:700;color:#5a6575;margin-bottom:4px}" +
      ".prompt{margin:0 0 10px;font-size:14px}" +
      ".joint{margin:0 0 10px;font-size:13px;background:#eaf3ed;border:1px solid #b7d0c0;padding:8px 10px}" +
      ".write-in{margin-top:4px}" +
      ".write-label{font-size:13px;font-weight:700;margin-bottom:6px}" +
      ".lines{border-bottom:1px solid #6b7785;height:28px;margin:0 0 4px}" +
      ".key{background:#eef3f8;border:1px solid #b7cbe0;padding:8px 10px;font-size:13px}" +
      ".empty{color:#5a6575;font-style:italic}" +
      ".actions{margin:0 0 16px}" +
      ".actions button{margin-right:8px;padding:6px 12px}" +
      "@media print{.actions{display:none}body{margin:12mm}}"
    );
  }

  function buildHtml(options) {
    var scenarios = options.scenarios || {};
    var ids = options.scenarioIds || Object.keys(scenarios);
    var includeAnswers = !!options.includeAnswers;
    var title = includeAnswers
      ? "Joint Functions Map — Paper Test Answer Key"
      : "Joint Functions Map — Paper Test";
    var identity = includeAnswers
      ? ""
      : '<div class="id-block">' +
        "<div>Name: ____________________________________________</div>" +
        "<div>Rank / Flight: ______________________ &nbsp; Date: ______________</div>" +
        "</div>";
    var note = includeAnswers
      ? "<p class=\"note\">Instructor copy. Students are scored on the Air Force Core Function. Each scenario set lists its Air Force Core Functions, and the Joint Function is already filled in on each task.</p>"
      : "<p class=\"note\">The joint function for each task is already filled in, the same way it autofills in the digital activity. Write the Air Force Core Function that best applies. Use only the Air Force Core Functions listed with that scenario set.</p>";
    var sets = ids
      .map(function (id) {
        return scenarioHtml(id, scenarios[id], includeAnswers);
      })
      .join("");
    var actions =
      '<div class="actions"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>';

    return (
      "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\" />" +
      "<title>" +
      escapeHtml(title) +
      "</title><style>" +
      documentCss() +
      "</style></head><body>" +
      actions +
      "<h1>" +
      escapeHtml(title) +
      "</h1>" +
      "<p class=\"meta\">Generated " +
      escapeHtml(stampDate()) +
      " · " +
      ids.length +
      " scenario set(s) · 5 tasks per set when fully populated</p>" +
      identity +
      note +
      sets +
      "</body></html>"
    );
  }

  function downloadHtml(html, filename) {
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadPaperTest(scenarios, scenarioIds) {
    var date = stampDate();
    downloadHtml(
      buildHtml({
        scenarios: scenarios,
        scenarioIds: scenarioIds,
        includeAnswers: false,
      }),
      "Joint_Functions_Map_Paper_Test_" + date + ".html"
    );
    downloadHtml(
      buildHtml({
        scenarios: scenarios,
        scenarioIds: scenarioIds,
        includeAnswers: true,
      }),
      "Joint_Functions_Map_Paper_Test_Answer_Key_" + date + ".html"
    );
  }

  var api = {
    buildHtml: buildHtml,
    downloadPaperTest: downloadPaperTest,
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.Jnt601bPaperTest = api;
})(typeof window !== "undefined" ? window : this);
