// js/group_assignment.js

// Randomly assign participant to one of four groups if not already assigned
if (typeof group === 'undefined') {
  var groups = [
    'communication_bot',
    'no_com_bot'
  ];
  var group = jsPsych.randomization.sampleWithoutReplacement(groups, 1)[0];
}

// Store group assignment in data
jsPsych.data.addProperties({ group: group });
