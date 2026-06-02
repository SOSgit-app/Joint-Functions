define(['QUnit', 'jquery', 'knockout', 'scenarioView', 'content/scenario1', 'content/scenario2', 'content/scenario3', 'content/scenario4', 'content/jf504'],
function (QUnit, jquery, ko, scenarioView, scenario1, scenario2, scenario3, scenario4, content) {

    QUnit.module("Attempts tests");


    QUnit.test("3 allowed attemps to complete scenario, after wrong selection attemts count should be 2 for scenario1 ", function (assert) {
        var expectedResult = 2;

        var scenario = setupView(0, 3);
        scenario.feedbackInPercents(75);
        scenario.evaluate(true);

        assert.equal(window.application.shell.allowedAttempts(), expectedResult, "Attempts are match");
    });

    QUnit.test("2 allowed attemps to complete scenario, after wrong selection attemts count should be 1 for scenario1 ", function (assert) {
        var expectedResult = 1;

        var scenario = setupView(0, 2);
        scenario.feedbackInPercents(75);
        scenario.evaluate(true);

        assert.equal(window.application.shell.allowedAttempts(), expectedResult, "Attempts are match");
    });

    QUnit.test("1 allowed attemps to complete scenario, after wrong selection - final feedback  for scenario1 ", function (assert) {
        var expectedResult = content.feedbacks[3].text;

        var scenario = setupView(0, 1);
        scenario.feedbackInPercents(75);
        scenario.evaluate(true);

        assert.equal(scenario.staticFeedback(), expectedResult, "Feedback is match");
    });

    QUnit.test("1 allowed attemps to complete scenario, after wrong selection - positive feedback  for scenario1 ", function (assert) {
        var expectedResult = content.feedbacks[0].text;

        var scenario = setupView(0, 1);
        scenario.feedbackInPercents(100);
        scenario.evaluate(true);

        assert.equal(scenario.staticFeedback(), expectedResult, "Feedback is match");
    });

    
    function selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect) {

        for (var i = 0; i < subtaskList.length; i++) {
            var item = { choosedFunction: functionsToSelect[i], subtask: subtaskList[i], element: elementsToSelect[i] };
            scenario.answers.push(item);
        }
    };

    //base view  setup
    function setupView(scenarioIndex, attempts) {
        window.application = {};
        window.application.shell = {
            content: content,
            allowedAttempts: ko.observable(attempts)
        };
        var scenario = new scenarioView();

        return scenario;
    };


});
