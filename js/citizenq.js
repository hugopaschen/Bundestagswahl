/* Bürgerfragen je Thema (werden befüllt). */
(function (root) {
  var CITIZEN_QUESTIONS = {};
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CITIZEN_QUESTIONS;
  } else {
    root.BTW_CITIZENQ = CITIZEN_QUESTIONS;
  }
})(this);
