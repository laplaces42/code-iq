import styles from "./DashboardPreview.module.css";

function DashboardPreview() {
  return (
    <div className={styles.previewContainer}>
      <h2>Intelligent Dashboard Experience</h2>
      <div className={styles.previewLayout}>
        <div className={styles.previewLeft}>
          <div className={`${styles.previewTab} ${styles.active}`}>
            Code Health Dashboard
          </div>
          <div className={styles.previewTab}>PR Analysis</div>
          <div className={styles.previewTab}>File Explorer</div>
          <div className={styles.previewContent}>
            <div className={styles.mockChart}></div>
            <div className={styles.mockMetrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Overall Score</span>
                <span className={`${styles.metricValue} ${styles.good}`}>
                  8.7/10
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Security Issues</span>
                <span className={`${styles.metricValue} ${styles.warning}`}>
                  3
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.previewRight}>
          <div className={styles.chatbotHeader}>AI Codebase Assistant</div>
          <div className={styles.chatbotMessages}>
            <div className={styles.message}>
              How can I improve the security score?
            </div>
            <div className={`${styles.message} ${styles.response}`}>
              I found 3 security issues. Let me show you the specific files...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPreview;