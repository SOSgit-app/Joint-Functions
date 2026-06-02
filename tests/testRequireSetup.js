
require.config({
    paths: {
        'client': '../client',
        'content': '../content',
        'QUnit': '../client/qunit',
        'knockout': '../scripts/knockout-3.4.0',
        'lodash': '../client/lodash.min',
        'jquery': '../scripts/jquery-2.0.2',
        'touchPunch': "../scripts/jquery.ui.touch-punch",
        'trc': '../scripts/trc',
        'scenarioView': '../components/views/scenario',
        'summaryView': '../components/views/summary',
    },
    shim: {
        'QUnit': {
            exports: 'QUnit',
            init: function () {
                QUnit.config.autostart = false;
            }
        }
    }
});

define([
    //Load system requirements
    'QUnit', 'trc/trc',
    //Load test files
    '../tests/content/scenarioTests',
    '../tests/content/feedbackTests',
    '../tests/views/scenarioTests',
    '../tests/content/attemptsTests'
],
function (QUnit) {

    QUnit.load();
    QUnit.start();

});
