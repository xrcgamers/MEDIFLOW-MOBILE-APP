const { runAndStoreAiPriority } = require("./aiPriorityService");

function queueAiPriorityForReport(reportId) {
  setImmediate(async () => {
    try {
      await runAndStoreAiPriority(reportId);
    } catch (error) {
      console.error("AI priority queue failed:", error.message);
    }
  });
}

module.exports = {
  queueAiPriorityForReport,
};