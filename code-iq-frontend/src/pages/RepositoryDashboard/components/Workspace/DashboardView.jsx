import styles from "../Workspace.module.css";
import repositoryDashboardHelpers from "../../utils/repositoryDashboardHelpers";
import { useState } from "react";
import { Trophy, AlertTriangle } from "lucide-react";

function DashboardView({
  repository,
  fileSnapshots,
  setActiveWorkspaceView,
  setCurrentPath,
  setSelectedFile,
}) {
  const { calculateOverallScore, getScoreColor, getScoreLabel, formatScore } =
    repositoryDashboardHelpers;
  
    const [scoreFilter, setScoreFilter] = useState("overall"); // 'overall', 'health', 'security', 'knowledge'

  const sortedFiles = [...fileSnapshots].sort((a, b) => {
    const scoreA =
      scoreFilter === "overall"
        ? calculateOverallScore(a)
        : a[`${scoreFilter}Score`];
    const scoreB =
      scoreFilter === "overall"
        ? calculateOverallScore(b)
        : b[`${scoreFilter}Score`];

    // Handle null scores - put them at the end
    if (scoreA === null && scoreB === null) return 0;
    if (scoreA === null) return 1;
    if (scoreB === null) return -1;

    return scoreB - scoreA;
  });

  const topFiles = sortedFiles.slice(0, 5);
  const bottomFiles = sortedFiles.slice(-5).reverse();

  return (
    <div className={styles.dashboardView}>
      {/* Repository Score Cards */}
      <div className={styles.scoresSection}>
        <h2>Repository Health Overview</h2>
        <div className={styles.scoresGrid}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreHeader}>
              <h3>Overall Score</h3>
              <div
                className={styles.trend}
                data-positive={repository?.trend > 0}
              >
                {repository?.trend > 0
                  ? "↗"
                  : repository?.trend < 0
                  ? "↘"
                  : "→"}{" "}
                {Math.abs(repository?.trend || 0).toFixed(1)}
              </div>
            </div>
            <div
              className={styles.scoreValue}
              style={{
                color: getScoreColor(calculateOverallScore(repository)),
              }}
            >
              {formatScore(calculateOverallScore(repository))}
            </div>
            <div className={styles.scoreLabel}>
              {getScoreLabel(calculateOverallScore(repository))}
            </div>
          </div>

          <div className={styles.scoreCard}>
            <div className={styles.scoreHeader}>
              <h3>Health Score</h3>
            </div>
            <div
              className={styles.scoreValue}
              style={{
                color: getScoreColor(repository?.healthScore),
              }}
            >
              {formatScore(repository?.healthScore)}
            </div>
            <div className={styles.scoreLabel}>
              {getScoreLabel(repository?.healthScore)}
            </div>
            <div className={styles.scoreDetails}>
              Code quality, complexity, coverage
            </div>
          </div>

          <div className={styles.scoreCard}>
            <div className={styles.scoreHeader}>
              <h3>Security Score</h3>
            </div>
            <div
              className={styles.scoreValue}
              style={{
                color: getScoreColor(repository?.securityScore),
              }}
            >
              {formatScore(repository?.securityScore)}
            </div>
            <div className={styles.scoreLabel}>
              {getScoreLabel(repository?.securityScore)}
            </div>
            <div className={styles.scoreDetails}>
              Vulnerabilities, secrets, compliance
            </div>
          </div>

          <div className={styles.scoreCard}>
            <div className={styles.scoreHeader}>
              <h3>Knowledge Score</h3>
            </div>
            <div
              className={styles.scoreValue}
              style={{
                color: getScoreColor(repository?.knowledgeScore),
              }}
            >
              {formatScore(repository?.knowledgeScore)}
            </div>
            <div className={styles.scoreLabel}>
              {getScoreLabel(repository?.knowledgeScore)}
            </div>
            <div className={styles.scoreDetails}>
              Documentation, maintainers, bus factor
            </div>
          </div>
        </div>
      </div>

      {/* Score Analysis Controls */}
      <div className={styles.analysisSection}>
        <div className={styles.analysisHeader}>
          <h2>File Analysis</h2>
          <div className={styles.filterControls}>
            <span>Filter by:</span>
            {["overall", "health", "security", "knowledge"].map((filter) => (
              <button
                key={filter}
                className={`${styles.filterBtn} ${
                  scoreFilter === filter ? styles.active : ""
                }`}
                onClick={() => setScoreFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Top and Bottom Files */}
        <div className={styles.filesAnalysis}>
          <div className={styles.filesList}>
            <h3>
              <Trophy size={18} /> Top Performing Files
            </h3>
            {topFiles.map((file) => (
              <div
                key={file.id}
                className={styles.fileItem}
                onClick={() => {
                  setActiveWorkspaceView("files");
                  setCurrentPath(
                    file.filePath.split("/").slice(0, -1).join("/")
                  );
                  setSelectedFile(file);
                }}
              >
                <div className={styles.fileName}>{file.filePath}</div>
                <div
                  className={styles.fileScore}
                  style={{
                    color: getScoreColor(
                      scoreFilter === "overall"
                        ? calculateOverallScore(file)
                        : file[`${scoreFilter}Score`]
                    ),
                  }}
                >
                  {scoreFilter === "overall"
                    ? formatScore(calculateOverallScore(file))
                    : formatScore(file[`${scoreFilter}Score`])}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.filesList}>
            <h3>
              <AlertTriangle size={18} /> Files Needing Attention
            </h3>
            {bottomFiles.map((file) => (
              <div
                key={file.id}
                className={styles.fileItem}
                onClick={() => {
                  setActiveWorkspaceView("files");
                  setCurrentPath(
                    file.filePath.split("/").slice(0, -1).join("/")
                  );
                  setSelectedFile(file);
                }}
              >
                <div className={styles.fileName}>{file.filePath}</div>
                <div
                  className={styles.fileScore}
                  style={{
                    color: getScoreColor(
                      scoreFilter === "overall"
                        ? calculateOverallScore(file)
                        : file[`${scoreFilter}Score`]
                    ),
                  }}
                >
                  {scoreFilter === "overall"
                    ? formatScore(calculateOverallScore(file))
                    : formatScore(file[`${scoreFilter}Score`])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
