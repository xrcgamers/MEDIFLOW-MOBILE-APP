function getPriorityWeight(level) {
  switch (level) {
    case "CRITICAL":
      return 100;
    case "HIGH":
      return 75;
    case "MODERATE":
      return 50;
    case "LOW":
    default:
      return 25;
  }
}

module.exports = {
  getPriorityWeight,
};