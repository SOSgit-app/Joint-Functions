define(['QUnit', 'jquery', 'knockout', 'scenarioView', 'content/scenario1', 'content/scenario2', 'content/scenario3', 'content/scenario4', 'content/jf504'],
function (QUnit, jquery, ko, scenarioView, scenario1, scenario2, scenario3, scenario4, content) {

    QUnit.module("Feedback tests");

    //Check static feedback

    QUnit.test("Select all correct answers for scenario1 ", function (assert) {
        var expectedResult = content.feedbacks[0].text;

        var scenario = setupView(0);

        var functionsToSelect = [
               "Command and Control",
               "Command and Control",
               "Intelligence",
               "Fires",
               "Fires",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Protection",
               "Sustainment"];
        var subtaskList = scenario1.subtask.item;
        var elementsToSelect = [
               "Amphibious Command Ship (LC)",
               "Division HQ (3rd Marine)",
               "E-3 (elements of 962nd Air Control Squadron)",
               "A-10 Thunderbolt II",
               "SAG (USS VICKSBURG)",
               "IBCT Airborne capable (82nd Airborne Div)",
               "SBCT (2nd Infantry Div)",
               "3rd MEB (Maritime Prepositioning Force)",
               "EC-130H Compass Call",
               "Sustainment Brigade (Army)"];

        selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect);
        //passing number of correct and incorrect answers
        scenario.countPercentage(0, 0);
        scenario.evaluate();


        assert.equal(scenario.feedbackInPercents(), 100, "100%");
        assert.equal(scenario.staticFeedback(), expectedResult, "Feedback is match");
    });

    QUnit.test("Select 4 incorrect answers for scenario1 ", function (assert) {
        var expectedResult = content.feedbacks[1].text;

        var scenario = setupView(0);

        var functionsToSelect = [
               "Command and Control",
               "Command and Control",
               "Intelligence",
               "Fires",
               "Fires",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Fires",
               "Fires"];
        var subtaskList = scenario1.subtask.item;
        var elementsToSelect = [
               "Amphibious Command Ship (LC)",
               "Division HQ (3rd Marine)",
               "E-3 (elements of 962nd Air Control Squadron)",
               "A-10 Thunderbolt II",
               "SAG (USS VICKSBURG)",
               "IBCT Airborne capable (82nd Airborne Div)",
               "SBCT (2nd Infantry Div)",
               "3rd MEB (Maritime Prepositioning Force)",
               "Sustainment Brigade (Army)",
               "EC-130H Compass Call"];

        selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect);
        //passing number of incorrect functions and elements
        scenario.countPercentage(2, 2);
        scenario.evaluate(true);


        assert.equal(scenario.feedbackInPercents(), 80, "80%");
        assert.equal(scenario.staticFeedback(), expectedResult, "Feedback is match");
    });

    QUnit.test("Select 5 incorrect answers for scenario1 ", function (assert) {
        var expectedResult = content.feedbacks[2].text;

        var scenario = setupView(0);

        var functionsToSelect = [
               "Command and Control",
               "Command and Control",
               "Fires",
               "Fires",
               "Fires",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Fires",
               "Fires"];
        var subtaskList = scenario1.subtask.item;
        var elementsToSelect = [
               "Amphibious Command Ship (LC)",
               "Division HQ (3rd Marine)",
               "E-3 (elements of 962nd Air Control Squadron)",
               "A-10 Thunderbolt II",
               "SAG (USS VICKSBURG)",
               "IBCT Airborne capable (82nd Airborne Div)",
               "SBCT (2nd Infantry Div)",
               "3rd MEB (Maritime Prepositioning Force)",
               "Sustainment Brigade (Army)",
               "EC-130H Compass Call"];

        selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect);
        //passing number of incorrect functions and elements
        scenario.countPercentage(3, 2);
        scenario.evaluate(true);


        assert.equal(scenario.feedbackInPercents(), 75, "75%");
        assert.equal(scenario.staticFeedback(), expectedResult, "Feedback is match");
    });

    //Check dynamic feedback

    QUnit.test("Select 4 incorrect answers for scenario1 for dynamic feeedback", function (assert) {
        // Dynamic feedback should include number of incorrect elements and functions
        var expectedResult = [2, 2];

        var scenario = setupView(0);

        var functionsToSelect = [
               "Command and Control",
               "Command and Control",
               "Intelligence",
               "Fires",
               "Fires",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Fires",
               "Fires"];
        var subtaskList = scenario1.subtask.item;
        var elementsToSelect = [
               "Amphibious Command Ship (LC)",
               "Division HQ (3rd Marine)",
               "E-3 (elements of 962nd Air Control Squadron)",
               "A-10 Thunderbolt II",
               "SAG (USS VICKSBURG)",
               "IBCT Airborne capable (82nd Airborne Div)",
               "SBCT (2nd Infantry Div)",
               "3rd MEB (Maritime Prepositioning Force)",
               "Sustainment Brigade (Army)",
               "EC-130H Compass Call"];

        selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect);
        //passing number of incorrect functions and elements
        scenario.countPercentage(2, 2);
        scenario.evaluate(true);


        assert.equal(scenario.feedbackInPercents(), 80, "80%");
        assert.equal(scenario.dynamicFeedback().toString(), expectedResult.toString(), "Feedback is match");
    });


    QUnit.test("Select all incorrect answers for scenario1 ", function (assert) {
        //if all incorrect answers dynamic feedback shuld include all subtasks
        var expectedResult = ["Provide capability to execute communications and all necessary C2 architecture from the maritime domain as needed",
               "Provide integrated planning and execution guidance to all joint land forces",
               "Monitor all Ravenna air operations in AOR",
               "Provide CAS to joint\/coalition ground forces",
               "Destroy all Ravenna maritime forces that advance on US forces or friendly lines of supply",
               "Conduct Airborne operations along Ravenna line of advance to slow/disrupt enemy ground operations",
               "Deploy ground forces capable of rapid movement to positions of advantage and\/or to conduct urban operations as needed",
               "Deploy amphibious forces capable of independent movement, self-sustainment, and integrated combined arms to maximize freedom of maneuver in fluid situation.",
               "Conduct IO in theater via messages on Ravenna TV and radio",
               "Establish and manage ground lines of supply"];

        var scenario = setupView(0);

        var functionsToSelect = [
               "Fires",
               "Fires",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Movement and Maneuver",
               "Fires",
               "Fires",
               "Fires",
               "Command and Control",
               "Command and Control", ];
        var subtaskList = scenario1.subtask.item;
        var elementsToSelect = [
               "Amphibious Command Ship (LC)",
               "Division HQ (3rd Marine)",
               "E-3 (elements of 962nd Air Control Squadron)",
               "A-10 Thunderbolt II",
               "SAG (USS VICKSBURG)",
               "IBCT Airborne capable (82nd Airborne Div)",
               "SBCT (2nd Infantry Div)",
               "3rd MEB (Maritime Prepositioning Force)",
               "Sustainment Brigade (Army)",
               "EC-130H Compass Call"];

        selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect);
        //passing number of incorrect functions and elements
        scenario.countPercentage(0, 9);
        scenario.evaluate(true);

        assert.equal(scenario.dynamicFeedback().toString(), expectedResult.toString(), "Feedback is match");
    });

    function selectElements(scenario, functionsToSelect, subtaskList, elementsToSelect) {

        for (var i = 0; i < subtaskList.length; i++) {
            var item = { choosedFunction: functionsToSelect[i], subtask: subtaskList[i], element: elementsToSelect[i] };
            scenario.answers.push(item);
        }
    };


    //base view  setup
    function setupView(scenarioIndex) {
        window.application = {};
        window.application.shell = {
            content: content,
            allowedAttempts: ko.observable(5)
        };
        var scenario = new scenarioView();

        return scenario;
    };

});
