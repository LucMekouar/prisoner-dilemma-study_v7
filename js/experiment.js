// js/experiment.js 

// Ensure 'group' and 'bot' variables are defined before this script runs
if (typeof group === 'undefined') {
  console.error('group is undefined. Ensure group_assignment.js is included before experiment.js.');
}

if (typeof bot === 'undefined') {
  console.error('bot is undefined. Ensure bot_strategy.js is included before experiment.js.');
} else {
  // Reset bot history before experimental trials
  bot.history = [];
}

// Define the new payoff matrices globally
var payoff_matrix_C_1 = {
    'AA': [3, 3],
    'AB': [0, 5],
    'BA': [5, 0],
    'BB': [1, 1]
};
var payoff_matrix_C_2 = {
    'AA': [4, 4],
    'AB': [0, 5],
    'BA': [5, 0],
    'BB': [1, 1]
};
var payoff_matrix_C_3 = {
    'AA': [3, 3],
    'AB': [0, 4],
    'BA': [4, 0],
    'BB': [1, 1]
};
var payoff_matrix_C_4 = {
    'AA': [3, 3],
    'AB': [0, 5],
    'BA': [5, 0],
    'BB': [2, 2]
};

var payoff_matrix_C_set = [payoff_matrix_C_1, payoff_matrix_C_2, payoff_matrix_C_3, payoff_matrix_C_4];

// Initialize total payoff
var total_payoff = 0;

// Function to create experimental trials
function createExperimentTrials() {
  var experiment_trials = [];

  for (let i = 0; i < 30; i++) {
      let current_round = i + 1;
      let isPractice = false;
      let matrix_number = jsPsych.randomization.sampleWithoutReplacement([1,2,3,4], 1)[0];

      // Communication phase (if applicable)
      if (group.includes('communication')) {
          var communication_trial = {
              type: 'html-button-response',
              data: {
                  phase: 'experiment',
                  trial_type: 'communication',
                  round: current_round,
                  isPractice: isPractice,
                  matrix_number: matrix_number
              },
              stimulus: function() {
                  return `
                    <div class="chat-container">
                      <p>Round ${current_round}: Communication Phase</p>
                      <p>You have <span id="countdown">30</span> seconds to select a message to send to your partner.</p>
                      <div id="message-bubbles">
                        ${communication_data.questions.map((q, index) => `<button class="message-bubble" data-choice="${index}">${q}</button>`).join('')}
                      </div>
                    </div>
                  `;
              },
              choices: [],
              css_classes: ['centered-content'],
              on_load: function() {
                  var timeLeft = 30;
                  var countdownElement = document.getElementById('countdown');
                  var timer = setInterval(function() {
                      timeLeft--;
                      if (countdownElement) {
                          countdownElement.textContent = timeLeft;
                      }
                      if (timeLeft <= 0) {
                          clearInterval(timer);
                          proceedWithoutSelection();
                      }
                  }, 1000);

                  var bubbles = document.querySelectorAll('.message-bubble');
                  bubbles.forEach(function(bubble) {
                      bubble.addEventListener('click', function() {
                          clearInterval(timer);
                          var selectedIndex = this.getAttribute('data-choice');
                          proceedWithSelection(parseInt(selectedIndex));
                      });
                  });

                  function proceedWithSelection(selectedIndex) {
                      // Disable bubbles
                      bubbles.forEach(bubble => (bubble.disabled = true));

                      var selected_question = communication_data.questions[selectedIndex];
                      var bot_response = getBotResponse(selected_question);

                      // Proceed to finish trial with data
                      setTimeout(function() {
                          jsPsych.finishTrial({
                              selected_question: selected_question,
                              bot_response: bot_response
                          });
                      }, 5000);

                      // Display chat messages
                      displayChat(selected_question, bot_response);
                  }

                  function proceedWithoutSelection() {
                      // Proceed to finish trial without selection data
                      jsPsych.finishTrial({
                          selected_question: 'No Selection',
                          bot_response: 'No Response'
                      });
                  }

                  function displayChat(question, response) {
                      var chatHTML = `
                        <div class="chat-container">
                          <div class="chat-message user">
                            <div class="chat-bubble user">${question}</div>
                          </div>
                          <div class="chat-message bot">
                            <div class="chat-bubble bot">...</div>
                          </div>
                        </div>
                      `;
                      jsPsych.getDisplayElement().innerHTML = chatHTML;

                      // Simulate typing delay for bot response
                      setTimeout(function() {
                          var botBubble = document.querySelector('.chat-bubble.bot');
                          if (botBubble) {
                              botBubble.textContent = response;
                          }
                      }, 2000);
                  }
              },
              on_finish: function(data) {
                  // Merge trial's data properties into data object
                  Object.assign(data, this.data);

                  // Ensure selected_question and bot_response are included
                  data.selected_question = data.selected_question || 'No Selection';
                  data.bot_response = data.bot_response || 'No Response';
              }
          };
          experiment_trials.push(communication_trial);
      }

      // Decision phase
      var decision_trial = {
          type: 'html-button-response',
          data: {
              phase: 'experiment',
              trial_type: 'decision',
              round: current_round,
              isPractice: isPractice,
              matrix_number: matrix_number
          },
          stimulus: function() {
              var payoff_matrix_html_1 = `
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
              `;
              var payoff_matrix_html_2 = `
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
                      <td>(4,4)</td>
                      <td>(0,5)</td>
                    </tr>
                    <tr>
                      <th>B</th>
                      <td>(5,0)</td>
                      <td>(1,1)</td>
                    </tr>
                  </table>
              `;
              var payoff_matrix_html_3 = `
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
                      <td>(0,4)</td>
                    </tr>
                    <tr>
                      <th>B</th>
                      <td>(4,0)</td>
                      <td>(1,1)</td>
                    </tr>
                  </table>
              `;
              var payoff_matrix_html_4 = `
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
                      <td>(2,2)</td>
                    </tr>
                  </table>
              `;

              // Rename the array to avoid naming conflict
              var payoff_matrices = [payoff_matrix_html_1, payoff_matrix_html_2, payoff_matrix_html_3, payoff_matrix_html_4];
              // Correct the variable name used in sampling
              var round_payoff_matrix = payoff_matrices[matrix_number - 1];

              jsPsych.data.addProperties({ round_payoff_matrix: round_payoff_matrix });

              return `
                  <p>Round ${current_round}: Decision Phase</p>
                  <p>You have <span id="decision-countdown">30</span> seconds to make your choice.</p>
                  <p>Choose your action:</p>
                  ${round_payoff_matrix}
              `;
          },
          choices: ['Cooperate (A)', 'Defect (B)'],
          css_classes: ['centered-content'],
          trial_duration: 30000,
          on_load: function() {
              var timeLeft = 30;
              var countdownElement = document.getElementById('decision-countdown');
              var timer = setInterval(function() {
                  timeLeft--;
                  if (countdownElement) {
                      countdownElement.textContent = timeLeft;
                  }
                  if (timeLeft <= 0) {
                      clearInterval(timer);
                  }
              }, 1000);
          },
          on_finish: function(data) {
              // Merge trial's data properties into data object
              Object.assign(data, this.data);

              if (data.button_pressed === null) {
                  data.participant_move = 'No Response';
                  data.bot_move = 'No Response';
                  data.participant_payoff = 0;
                  data.bot_payoff = 0;

                  console.error('Total payoff element not found');
              } else {
                  var choice = parseInt(data.button_pressed);
                  var participant_move = choice === 0 ? 'A' : 'B';
                  var bot_move = bot.move(participant_move);
                  data.participant_move = participant_move;
                  data.bot_move = bot_move;

                  // Calculate payoff using the new C matrices
                  var outcome = payoff_matrix_C_set[matrix_number - 1][participant_move + bot_move];
                  data.participant_payoff = outcome[0];
                  data.bot_payoff = outcome[1];

                  // Update total payoff
                  total_payoff += data.participant_payoff;
                  var totalPayoffElement = document.getElementById('total-payoff');
                  if (totalPayoffElement) {
                      totalPayoffElement.textContent = 'Total Payoff: ' + total_payoff;
                  } else {
                      console.error('Total payoff element not found');
                  }
              }
              // Do not reassign data.phase, data.trial_type, data.round, or data.isPractice
          }
      };
      experiment_trials.push(decision_trial);

      // Feedback phase
      var feedback_trial = {
          type: 'html-button-response',
          data: {
              phase: 'experiment',
              trial_type: 'feedback',
              round: current_round,
              isPractice: isPractice,
              matrix_number: matrix_number
          },
          stimulus: function() {
            var last_trial_data = jsPsych.data.get().filter({
                phase: 'experiment',
                trial_type: 'decision',
                round: current_round

            }).values()[0];

            if (!last_trial_data) {
                console.error('No decision trial data found for round', current_round);
                return '<p>Error retrieving previous trial data.</p>';
            }

            var participant_move = last_trial_data.participant_move;
            var bot_move = last_trial_data.bot_move;
            var participant_payoff = last_trial_data.participant_payoff;

            // Prepare payoff matrix with highlighted cell using the new C matrices
            var payoff_matrix_html_v2 = getHighlightedPayoffMatrix(participant_move, bot_move, matrix_number);

            var result_message = `
                <p>Results of Round ${current_round}:</p>
                <p>You chose: ${participant_move}</p>
                <p>Your partner chose: ${bot_move}</p>
                ${payoff_matrix_html_v2}
                <p>Your payoff this round: <strong>${participant_payoff}</strong></p>
                <p>Your total payoff: ${total_payoff}</p>
            `;

            return result_message;
          },
          choices: ['Continue'],
          css_classes: ['centered-content'],
          on_load: function() {
              // Optional: Additional actions on load if needed
          },
          on_finish: function(data) {
              // Merge trial's data properties into data object
              Object.assign(data, this.data);
          }
      };
      experiment_trials.push(feedback_trial);
  }

  return experiment_trials;
}

// Function to generate payoff matrix with highlighted cell using the new C matrices
function getHighlightedPayoffMatrix(participant_move, bot_move, matrix_number) {

  var cell_ids = {
    'AA': 'cell-AA',
    'AB': 'cell-AB',
    'BA': 'cell-BA',
    'BB': 'cell-BB'
  };

  var selected_cell = cell_ids[participant_move + bot_move];

  var payoff_matrix_v1 = `
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
          <td id="cell-AA">(3,3)</td>
          <td id="cell-AB">(0,5)</td>
        </tr>
        <tr>
          <th>B</th>
          <td id="cell-BA">(5,0)</td>
          <td id="cell-BB">(1,1)</td>
        </tr>
      </table>
      <style>
        #${selected_cell} {
          background-color: yellow;
        }
      </style>
  `;
  var payoff_matrix_v2 = `
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
          <td id="cell-AA">(4,4)</td>
          <td id="cell-AB">(0,5)</td>
        </tr>
        <tr>
          <th>B</th>
          <td id="cell-BA">(5,0)</td>
          <td id="cell-BB">(1,1)</td>
        </tr>
      </table>
      <style>
        #${selected_cell} {
          background-color: yellow;
        }
      </style>
  `;
  var payoff_matrix_v3 = `
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
          <td id="cell-AA">(3,3)</td>
          <td id="cell-AB">(0,4)</td>
        </tr>
        <tr>
          <th>B</th>
          <td id="cell-BA">(4,0)</td>
          <td id="cell-BB">(1,1)</td>
        </tr>
      </table>
      <style>
        #${selected_cell} {
          background-color: yellow;
        }
      </style>
  `;

  var payoff_matrix_v4 = `
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
          <td id="cell-AA">(3,3)</td>
          <td id="cell-AB">(0,5)</td>
        </tr>
        <tr>
          <th>B</th>
          <td id="cell-BA">(5,0)</td>
          <td id="cell-BB">(2,2)</td>
        </tr>
      </table>
      <style>
        #${selected_cell} {
          background-color: yellow;
        }
      </style>
  `;

  var matrix_set = [payoff_matrix_v1, payoff_matrix_v2, payoff_matrix_v3, payoff_matrix_v4];
  var round_payoff_matrix_H = matrix_set[matrix_number - 1];

  var payoff_matrix_html_v2 = `
      ${round_payoff_matrix_H}
  `;

  return payoff_matrix_html_v2;
}

// Show total payoff before experimental trials
var show_total_payoff = {
  type: 'call-function',
  func: function() {
      total_payoff = 0;
      var totalPayoffElement = document.getElementById('total-payoff');
      if (totalPayoffElement) {
          totalPayoffElement.textContent = 'Total Payoff: ' + total_payoff;
          totalPayoffElement.style.display = 'block';
      } else {
          console.error('Total payoff element not found');
      }
  }
};

// Generate the experimental trials timeline
var experiment_timeline = [];
experiment_timeline.push(show_total_payoff);
experiment_timeline = experiment_timeline.concat(createExperimentTrials());
