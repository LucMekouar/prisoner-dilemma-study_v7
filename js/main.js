var timeline = [];

function initializeExperiment() {
  // Initialization of connection with Pavlovia at the start of the timeline ***
  var pavlovia_init = {
    type: "pavlovia",
    command: "init"
  };
  timeline.push(pavlovia_init);

  // Wait for promises to resolve
  Promise.all([consent_promise, debrief_promise]).then(function() {
    // Add instructions
    timeline = timeline.concat(instructions);

    // Add practice trials
    timeline = timeline.concat(practice_timeline);

    // Add experimental trials
    timeline = timeline.concat(experiment_timeline);

    // Add debriefing
    timeline = timeline.concat(debriefing);

    // Finish the experiment and save data
    var pavlovia_finish = {
      type: "pavlovia",
      command: "finish"
    };
    timeline.push(pavlovia_finish);

    // Add the prize draw trial after the experiment has finished
    var prize_draw_trial = {
      type: 'html-button-response',
      stimulus: `
        <h3>Prize Draw</h3>
        <p>If you wish to be included in the prize draw for the £20 Amazon voucher, please click the link below to enter your name and email address:</p>
        <p><a href="https://warwickpsych.qualtrics.com/jfe/form/SV_ac86Ai856EF0xL0" target="_blank">Enter prize draw</a></p>
        <p>The prize draw will take place on the 24th of February, after which your email will be deleted.</p>
      `,
      choices: ['Close'],
      button_html: '<button class="jspsych-btn">%choice%</button>',
      on_finish: function(data) {
        // Optionally, redirect or close the window
      }
    };
    timeline.push(prize_draw_trial);

    // Initialize jsPsych
    jsPsych.init({
      timeline: timeline,
      display_element: 'jspsych-target'
    });
  }).catch(function(error) {
    console.error('Error initializing experiment:', error);
  });
}

// Start the experiment
initializeExperiment();
