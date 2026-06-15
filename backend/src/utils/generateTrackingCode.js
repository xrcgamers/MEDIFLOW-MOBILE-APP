function generateTrackingCode() {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `MDF-${randomPart}`;
}

module.exports = {
  generateTrackingCode,
};