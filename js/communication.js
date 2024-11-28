// js/communication.js

// Communication options and bot responses
var communication_data = {
  questions: [
    "Let's cooperate!",
    "I think we should cooperate to improve both our earnings.",
    "Do you think we should cooperate?",
    "What strategy should we use?",
    "I do not know if I should cooperate as I do not know if you will cooperate.",
    "There is no point in cooperating!"
  ],
  bot_responses: {
    "Let's cooperate!": ["Yes, this is mutually beneficial.", "Yes, we have more to gain together."],
    "I think we should cooperate to improve both our earnings.": ["Yes, this is mutually beneficial.", "Yes, we have more to gain together."],
    "Do you think we should cooperate?": ["Yes, this is mutually beneficial.", "Yes, we have more to gain together."],
    "What strategy should we use?": ["I think we should cooperate.", "Cooperation is better for the two of us."],
    "I do not know if I should cooperate as I do not know if you will cooperate.": ["I think we should cooperate.", "Cooperation is better for the two of us."],
    "There is no point in cooperating!": ["I disagree, I think we should cooperate.", "I disagree, cooperation is better for the two of us."]
  }
};

var communication_data_practice = {
    questions: [
      "Hello, how are you?",
      "Testing communication: Do you receive?",
      "I am ready to start the experiment."
    ],
    bot_responses: {
      "Hello, how are you?": ["I am doing great, thanks.", "I am alright, thank you."],
      "Testing communication: Do you receive?": ["Yes I do.", "Yes."],
      "I am ready to start the experiment.": ["Well, we are about to start.", "So am I, let's get started."]
    }
  };

function getBotResponse(question) {
  var responses = communication_data.bot_responses[question];
  if (responses) {
    var index = getRandomInt(responses.length);
    return responses[index];
  } else {
    return '';
  }
}

function getBotResponse_trial(question) {
    var responses = communication_data_practice.bot_responses[question];
    if (responses) {
      var index = getRandomInt(responses.length);
      return responses[index];
    } else {
      return '';
    }
  }