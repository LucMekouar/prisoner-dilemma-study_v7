// js/instructions.js

var instructions = [];
var consent_promise = null;

// Ensure 'group' variable is defined before this script runs
if (typeof group === 'undefined') {
  console.error('group is undefined. Ensure group_assignment.js is included before instructions.js.');
}

// Load the consent form HTML
consent_promise = loadHTML('resources/consent_form.html').then(function(content) {
  var consent_trial = {
    type: 'html-button-response',
    stimulus: content,
    choices: ['I consent to take part in this study', 'I do not wish to participate'],
    button_html: '<button class="jspsych-btn consent-button">%choice%</button>',
    on_finish: function(data) {
      var choice = parseInt(data.button_pressed);
      if (choice === 0) {
        data.consent = true;
      } else {
        data.consent = false;
        jsPsych.endExperiment('<p>You have chosen not to take part in the experiment. Thank you for your time, you can now close this tab.</p>');
      }
    }
  };

  instructions.push(consent_trial);

  // Proceed with demographic collection
  var demographics_trial = {
    type: 'survey-html-form',
    html: `
      <p><b>Demographics:</b></p>
      <p>Age: <input name="age" type="number" min="18" max="99" ></p>
      <p>Gender: 
        <select name="gender" >
          <option value="">Select...</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </p>
      <p>If other, you can specify here if you wish: <input name="gender_other" type="text" ></p>
    `,
    button_label: 'Submit',
    on_finish: function(data) {
      console.log('Demographics data:', data);
      try {
        var responses = data.response || data.responses;
        if (typeof responses === 'string') {
          responses = JSON.parse(responses);
        }
        if (responses) {
          data.age = responses.age || null;
          data.gender = responses.gender || null;
          data.gender_other = responses.gender_other || null;
        } else {
          throw new Error('No responses found in data object');
        }
      } catch (e) {
        data.age = null;
        data.gender = null;
        data.gender_other = null;
        console.error('Error parsing demographics data:', e);
      }
    }
  };

  instructions.push(demographics_trial);

  // Determine partner identity and communication ability
  var partner_identity = 'a computer program'; // Always playing with a bot
  var communication_ability = group.includes('communication')
    ? 'You will have the ability to communicate with the bot during the game.'
    : 'You will not have the ability to communicate with the bot during the game.';

  // Add instruction pages
  var instruction_pages = {
    type: 'instructions',
    pages: [
      'Welcome to our study, titled "Playing a Cooperation/Defection Game with a Partner Online".',
      'In this study, you will be playing a game where you can choose to cooperate (A) or defect (B) in each round.',
      'You will receive in-game fictional rewards, depending on your decision and the decision made by your partner.',
      `
        <p>For example, if both you and your partner decide to cooperate (A), you will both receive a reward of 3 units shown as (3,3). If you both decide to defect (B), then you will both receive a reward of 1 unit shown as (1,1). However, if one cooperates (A) and the other defects (B), the one who defects gets a reward of 5 units, and the one who cooperates gets no reward.<p>
        <p>Thus if you select B and your partner selects A on a given round, you will together receive (5,0): meaning you receice 5 units and your partner will recieve 0 units.</p>
        <br>
        <table class="payoff-matrix">
              <tr>
                <th rowspan="2">Your Choice</th>
                <th colspan="2">Partner's Choice</th>
              </tr>
              <tr>
                <th>A</th>
                <th>B</th>
              </tr>
              <tr>
                <th>A</th>
                <td>(3,3)</td>
                <td>(0,5)</td>
              </tr>
              <tr>
                <th>B</th>
                <td>(5,0)</td>
                <td>(1,1)</td>
              </tr>
            </table>
      `,
      'Your goal is to maximize your earnings.',
      'You will have 3 practice rounds before the actual game begins.',
      `You will be playing with ${partner_identity}.`,
      communication_ability,
      'Press "Next" to begin the practice rounds.',
    ],
    show_clickable_nav: true,
    css_classes: ['centered-content']
  };

  instructions.push(instruction_pages);
}).catch(function(error) {
  console.error('Error loading consent form:', error);
});
