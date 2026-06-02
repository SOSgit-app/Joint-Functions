define(['QUnit', 'knockout', 'scenarioView', 'content/scenario1', 'content/scenario2', 'content/scenario3', 'content/scenario4'],
function (QUnit, ko, scenarioView, scenario1, scenario2, scenario3, scenario4) {

    QUnit.module("Scenario view tests");


    QUnit.test("Base scenario create test", function (assert) {

        window.application = {};
        window.application.shell = {
            selectedItems: ko.observableArray(),
        };

        var scenario = new scenarioView();
        console.log(scenario);

        assert.ok(scenario != null, "Scenario view exists");
    });

});
