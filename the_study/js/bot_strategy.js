// js/bot_strategy.js

var bot = {
    history: [],
    move: function(participant_move) {
      var bot_move;
      if (this.history.length === 0) {
        bot_move = 'A'; // Cooperate on the first move
      } else {
        var last_participant_move = this.history[this.history.length - 1].participant_move;
        bot_move = last_participant_move; // Replicate participant's last move
      }
      // Save the moves to history
      this.history.push({
        participant_move: participant_move,
        bot_move: bot_move
      });
      return bot_move;
    }
  };
  