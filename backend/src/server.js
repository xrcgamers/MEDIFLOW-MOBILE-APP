const app = require("./app");
const { startAutomationScheduler } = require("./services/automationSchedulerService");

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`MediFlow backend running on port ${PORT}`);
  startAutomationScheduler();
});