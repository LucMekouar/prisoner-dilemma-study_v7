// js/practice.js

// Ensure 'group' and 'bot' variables are defined before this script runs
if (typeof group === 'undefined') {
  console.error('group is undefined. Ensure group_assignment.js is included before practice.js.');
}

if (typeof bot === 'undefined') {
  console.error('bot is undefined. Ensure bot_strategy.js is included before practice.js.');
} else {
  // Reset bot history before practice trials
  bot.history = [];
}

// Function to create practice trials
function createPracticeTrials() {
  var practice_trials = [];

  for (let i = 0; i < 3; i++) {
    let current_round = i + 1;
    let isPractice = true;

    // Communication phase (if applicable)
    if (group.includes('communication')) {
      var communication_trial = {
        type: 'html-button-response',
        data: {
          phase: 'practice',
          trial_type: 'communication',
          round: current_round,
          isPractice: isPractice
        },
        stimulus: function() {
          return `
            <div class="chat-container">
              <p>Practice ${current_round}: Communication Phase</p>
              <p>You have <span id="countdown">30</span> seconds to select a message to send to your partner.</p>
              <div id="message-bubbles">
                ${communication_data_practice.questions.map((q, index) => `<button class="message-bubble" data-choice="${index}">${q}</button>`).join('')}
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

            var selected_question = communication_data_practice.questions[selectedIndex];
            var bot_response = getBotResponse_trial(selected_question);

            // Display chat messages
            displayChat(selected_question, bot_response);
          }

          function proceedWithoutSelection() {
            // Proceed to the decision phase
            jsPsych.finishTrial();
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

            // Wait before proceeding to decision phase
            setTimeout(function() {
              jsPsych.data.write({
                selected_question: question,
                bot_response: response,
                round: current_round,
                isPractice: isPractice,
                phase: 'practice',
                trial_type: 'communication'
              });
              jsPsych.finishTrial();
            }, 5000);
          }
        },
        on_finish: function(data) {
          // Data handling is done in displayChat
        }
      };
      practice_trials.push(communication_trial);
    }

    // Decision phase
    var decision_trial = {
      type: 'html-button-response',
      data: {
        phase: 'practice',
        trial_type: 'decision',
        round: current_round,
        isPractice: isPractice
      },
      stimulus: function() {
        var payoff_matrix_html = `
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

        return `
          <p>Practice ${current_round}: Decision Phase</p>
          <p>You have <span id="decision-countdown">30</span> seconds to make your choice.</p>
          <p>Choose your action:</p>
          ${payoff_matrix_html}
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
        } else {
          var choice = parseInt(data.button_pressed);
          var participant_move = choice === 0 ? 'A' : 'B';
          var bot_move = bot.move(participant_move);
          data.participant_move = participant_move;
          data.bot_move = bot_move;

          // Calculate payoff
          var payoff_matrix = {
            'AA': [3, 3],
            'AB': [0, 5],
            'BA': [5, 0],
            'BB': [1, 1]
          };
          var outcome = payoff_matrix[participant_move + bot_move];
          data.participant_payoff = outcome[0];
          data.bot_payoff = outcome[1];
        }
        // Do not reassign data.phase, data.trial_type, data.round, or data.isPractice
      }
    };
    practice_trials.push(decision_trial);

    // Feedback phase
    var feedback_trial = {
      type: 'html-button-response',
      data: {
        phase: 'practice',
        trial_type: 'feedback',
        round: current_round,
        isPractice: isPractice
      },
      stimulus: function() {
        var last_trial_data = jsPsych.data.get().filter({
          phase: 'practice',
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

        // Prepare payoff matrix with highlighted cell
        var payoff_matrix_html = getHighlightedPayoffMatrix_1(participant_move, bot_move);

        var result_message = `
          <p>Results of Practice ${current_round}:</p>
          <p>You chose: ${participant_move}</p>
          <p>Your partner chose: ${bot_move}</p>
          ${payoff_matrix_html}
          <p>Your payoff this round: <strong>${participant_payoff}</strong></p>
          <p>Practice rounds do not count towards your total fictional payoff.</p>
        `;

        return result_message;
      },
      choices: ['Continue'],
      css_classes: ['centered-content']
    };
    practice_trials.push(feedback_trial);
  }

  // After practice trials, add a trial to start the main experiment
  var start_experiment_trial = {
    type: 'html-button-response',
    stimulus: '<p>You have completed the practice rounds. When you are ready, press the button below to start the main experiment.</p>',
    choices: ['Start Experiment'],
    css_classes: ['centered-content']
  };
  practice_trials.push(start_experiment_trial);

  return practice_trials;
}

// Function to generate payoff matrix with highlighted cell
function getHighlightedPayoffMatrix_1(participant_move, bot_move) {
  var matrix = {
    'AA': '(3,3)',
    'AB': '(0,5)',
    'BA': '(5,0)',
    'BB': '(1,1)'
  };

  var cell_ids = {
    'AA': 'cell-AA',
    'AB': 'cell-AB',
    'BA': 'cell-BA',
    'BB': 'cell-BB'
  };

  var selected_cell = cell_ids[participant_move + bot_move];

  var payoff_matrix_html = `
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
        <td id="cell-AA">${matrix['AA']}</td>
        <td id="cell-AB">${matrix['AB']}</td>
      </tr>
      <tr>
        <th>B</th>
        <td id="cell-BA">${matrix['BA']}</td>
        <td id="cell-BB">${matrix['BB']}</td>
      </tr>
    </table>
    <style>
      #${selected_cell} {
        background-color: yellow;
      }
    </style>
  `;

  return payoff_matrix_html;
}

// Generate the practice trials timeline
var practice_timeline = createPracticeTrials();
