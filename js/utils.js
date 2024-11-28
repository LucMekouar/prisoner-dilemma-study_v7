// js/utils.js

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  
  function loadHTML(filePath) {
    return fetch(filePath)
      .then(response => response.text())
      .catch(error => {
        console.error('Error loading ' + filePath + ':', error);
        return '';
      });
  }