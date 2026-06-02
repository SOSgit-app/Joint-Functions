define(['QUnit', 'knockout', 'content/scenario1', 'content/scenario2', 'content/scenario3', 'content/scenario4'],
function (QUnit, ko, scenario1, scenario2, scenario3, scenario4) {

    QUnit.module("Content tests");

    //TODO: Expand to test scenario specifics.

    QUnit.test("Scenario 1 content test", function (assert) {
        validateScenarioDataShape(assert, scenario1);
    });

    QUnit.test("Scenario 2 content test", function (assert) {
        validateScenarioDataShape(assert, scenario2);
    });

    QUnit.test("Scenario 3 content test", function (assert) {
        validateScenarioDataShape(assert, scenario3);
    });

    QUnit.test("Scenario 4 content test", function (assert) {
        validateScenarioDataShape(assert, scenario4);
    });


    function validateScenarioDataShape(assert, scenario) {

        //Expand to test other properties 
        assert.ok(scenario.funct, "Functions exists");
        assert.ok(scenario.subtask, "Subtask exists");
        assert.ok(scenario.force, "Force exists");
        assert.ok(scenario.funct, "Answers exists");
       
    }
});
