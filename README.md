## This Repository

This repository contains the code for an online experiment studying human cooperative behavior in human-machine interactions using the iterative Prisoner's Dilemma game. The experiment is built using **jsPsych** and runs in participants' web browsers, hosted on Pavlovia.

---

## The Experiment

This experiment investigates how communication affects cooperative behavior in an iterative Prisoner's Dilemma game. Participants play 30 rounds against a bot implementing the Tit-for-Tat strategy, with some participants able to communicate with the bot through pre-defined messages.

---

## Project Structure

- `index.html`: The main HTML file that sets up the experiment environment, includes all necessary scripts and stylesheets, and defines the structure of the web page.
- `js/jspsych`: All the necessary plugins and packages to run the experiment.
- `js/main.js`: Initializes the experiment, sets up the jsPsych timeline, and starts the experiment.
- `js/instructions.js`: Contains the code for presenting the consent form, demographic questionnaire, and instructions to the participants.
- `js/practice.js`: Defines the practice trials that familiarize participants with the experiment procedures.
- `js/experiment.js`: Contains the code for the main experiment trials, including communication, decision, and feedback phases over 30 rounds.
- `js/debrief.js`: Handles the loading and presentation of the debriefing form at the end of the experiment.
- `js/bot_strategy.js`: Defines the bot's strategy, implementing a Tit-for-Tat approach for the game.
- `js/communication.js`: Contains the predefined messages for communication and the bot's responses.
- `js/group_assignment.js`: Assigns participants to experimental groups (i.e. communication or no communication conditions).
- `js/utils.js`: Contains utility functions used across the experiment scripts.
- `resources`: Folder containing the participant information form and the debrief form.
- `css/style.css`: Contains the styles for the experiment.

---
