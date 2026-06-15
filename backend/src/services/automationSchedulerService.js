const { runAutomationMonitoringCycle } = require("./automationMonitorService");

let automationInterval = null;

async function runOnce() {
  try {
    await runAutomationMonitoringCycle();
  } catch (error) {
    console.error("[Automation] Checks failed:", error.message);
  }
}

function startAutomationScheduler(intervalMs = 60000) {
  if (automationInterval) {
    clearInterval(automationInterval);
  }

  runOnce();

  automationInterval = setInterval(() => {
    runOnce();
  }, intervalMs);

  console.log(`[Automation] Scheduler started. Running every ${intervalMs} ms.`);
}

function stopAutomationScheduler() {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
    console.log("[Automation] Scheduler stopped.");
  }
}

module.exports = {
  startAutomationScheduler,
  stopAutomationScheduler,
};