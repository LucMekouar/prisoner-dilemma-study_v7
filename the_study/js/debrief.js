// js/debrief.js

var debriefing = [];
var debrief_promise = null;

// Load the debrief form HTML
debrief_promise = loadHTML('resources/debrief_form.html').then(function(content) {
  var debrief_trial = {
    type: 'html-button-response',
    stimulus: content,
    choices: ['Finish'],
    button_html: '<button class="jspsych-btn debrief-button">%choice%</button>',
    on_finish: function(data) {
      // Optionally, handle data if participant chooses to withdraw
    }
  };

  debriefing.push(debrief_trial);
});
