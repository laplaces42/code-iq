function calculateOverallScore(file) {
  if (!file) return null;

  const scores = [];
  if (file.healthScore !== null && file.healthScore !== undefined)
    scores.push(file.healthScore);
  if (file.securityScore !== null && file.securityScore !== undefined)
    scores.push(file.securityScore);
  if (file.knowledgeScore !== null && file.knowledgeScore !== undefined)
    scores.push(file.knowledgeScore);

  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getScoreColor(score) {
  if (score === null || score === undefined) return "#6b7280"; // gray for no score
  if (score >= 8) return "#10b981"; // green
  if (score >= 6) return "#f59e0b"; // yellow
  if (score >= 4) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getScoreLabel(score) {
  if (score === null || score === undefined) return "No Data";
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Needs Work";
  return "Critical";
}

function formatScore(score) {
  if (score === null || score === undefined) return "--";
  return score.toFixed(1);
}

const repositoryDashboardHelpers = {
  calculateOverallScore,
  getScoreColor,
  getScoreLabel,
  formatScore,
};

export default repositoryDashboardHelpers;
