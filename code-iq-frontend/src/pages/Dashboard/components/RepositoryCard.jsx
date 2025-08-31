import styles from "./RepositoryCard.module.css";
import { useNavigate } from "react-router-dom";

function RepositoryCard({ repo }) {
  const navigate = useNavigate();

  function getScoreColor(score) {
    if (score >= 8) return "#48bb78"; // excellent
    if (score >= 6) return "#4299e1"; // good
    if (score >= 4) return "#ed8936"; // warning
    return "#f56565"; // critical
  }

  function getLanguageColor(language) {
    const colors = {
      TypeScript: "#3178c6",
      JavaScript: "#f7df1e",
      Python: "#3776ab",
      Java: "#ed8b00",
      "Node.js": "#339933",
      "React Native": "#61dafb",
      Go: "#00add8",
      Rust: "#000000",
    };
    return colors[language] || "#a0aec0";
  }

  function getTrendIcon(trend) {
    if (trend > 0) return "↗";
    if (trend < 0) return "↘";
    return "→";
  }

  function getTrendColor(trend) {
    if (trend > 0) return "#48bb78";
    if (trend < 0) return "#f56565";
    return "#a0aec0";
  }

  return (
    <div key={repo.id} className={styles.repositoryCard}>
      <div className={styles.repoHeader}>
        <div className={styles.repoInfo}>
          <h3 className={styles.repoName}>{repo.name}</h3>
          <p className={styles.repoDescription}>{repo.description}</p>
        </div>
        <div className={styles.repoMeta}></div>
      </div>

      <div className={styles.scoreSection}>
        <div className={styles.overallScore}>
          <span className={styles.scoreLabel}>Overall Score</span>
          <div className={styles.scoreWithTrend}>
            <span
              className={styles.scoreValue}
              style={{ color: getScoreColor(repo.scores.overall) }}
              data-testid="overall-score"
            >
              {repo.scores.overall ? repo.scores.overall.toFixed(1) : "--"}
              /10
            </span>
            <span
              className={styles.trendIndicator}
              style={{ color: getTrendColor(repo.scores.trend) }}
              data-testid="overall-trend"
            >
              {getTrendIcon(repo.scores.trend)}{" "}
              {Math.abs(repo.scores.trend).toFixed(1)}
            </span>
          </div>
        </div>

        <div className={styles.detailedScores}>
          <div className={styles.scoreBar}>
            <span className={styles.scoreName}>Health</span>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${styles.health}`}
                style={{
                  width: `${repo.scores.health ? repo.scores.health * 10 : 0}%`,
                }}
                data-testid="health-progress"
              ></div>
            </div>
            <span className={styles.scoreNumber} data-testid="health-score">
              {repo.scores.health ? repo.scores.health.toFixed(1) : "--"}
            </span>
          </div>

          <div className={styles.scoreBar}>
            <span className={styles.scoreName}>Security</span>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${styles.security}`}
                style={{
                  width: `${
                    repo.scores.security ? repo.scores.security * 10 : 0
                  }%`,
                }}
                data-testid="security-progress"
              ></div>
            </div>
            <span className={styles.scoreNumber} data-testid="security-score">
              {repo.scores.security ? repo.scores.security.toFixed(1) : "--"}
            </span>
          </div>

          <div className={styles.scoreBar}>
            <span className={styles.scoreName}>Knowledge</span>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${styles.knowledge}`}
                style={{
                  width: `${
                    repo.scores.knowledge ? repo.scores.knowledge * 10 : 0
                  }%`,
                }}
                data-testid="knowledge-progress"
              ></div>
            </div>
            <span className={styles.scoreNumber} data-testid="knowledge-score">
              {repo.scores.knowledge ? repo.scores.knowledge.toFixed(1) : "--"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.repoFooter}>
        <div className={styles.repoActions}>
          <button
            className={styles.actionBtnPrimary}
            onClick={() => navigate(`/repositories/${repo.id}`)}
          >
            View Details
          </button>
          <button
            className={styles.actionBtnSecondary}
            title="Open in GitHub"
            onClick={() => window.open(`https://github.com/${repo.name}`)}
          >
            <svg
              className={styles.githubIcon}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </button>
          <button className={styles.actionBtnSecondary} title="Re-scan now">
            <svg
              className={styles.refreshIcon}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1z" />
              <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z" />
            </svg>
          </button>
        </div>

        <div className={styles.repoMetadata}>
          <div className={styles.activityBadge}>
            <span
              className={
                styles[
                  `activityStatus${
                    repo.activityStatus.charAt(0).toUpperCase() +
                    repo.activityStatus.slice(1)
                  }`
                ]
              }
            >
              {repo.activityStatus}
            </span>
          </div>
          <span
            className={styles.languageTag}
            style={{ backgroundColor: getLanguageColor(repo.language) }}
          >
            {repo.language}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RepositoryCard;
