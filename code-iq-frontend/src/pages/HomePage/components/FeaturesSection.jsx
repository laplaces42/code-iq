import styles from "./FeaturesSection.module.css";

function FeaturesSection() {
  return (
    <div className={styles.featuresContainer}>
      <h2 className={styles.featuresTitle}>Three Pillars of Code Excellence</h2>

      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.health}`}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h3>Code Health Score</h3>
          <p>
            Monitor linter errors, complexity, test coverage, and architectural
            violations in real-time
          </p>
          <ul>
            <li>Cyclomatic complexity analysis</li>
            <li>Code duplication detection</li>
            <li>Dead code identification</li>
            <li>TODO/FIXME tracking</li>
          </ul>
        </div>

        <div className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.security}`}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
            </svg>
          </div>
          <h3>Security Score</h3>
          <p>
            Comprehensive security analysis to protect your codebase from
            vulnerabilities
          </p>
          <ul>
            <li>Secrets & credentials detection</li>
            <li>Dependency vulnerability scanning</li>
            <li>PII pattern recognition</li>
            <li>License compliance monitoring</li>
          </ul>
        </div>

        <div className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.knowledge}`}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" />
            </svg>
          </div>
          <h3>Knowledge Score</h3>
          <p>
            Understand your team's knowledge distribution and documentation
            quality
          </p>
          <ul>
            <li>Maintainer ownership depth</li>
            <li>Documentation coverage</li>
            <li>Bus factor risk analysis</li>
            <li>Activity & engagement metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FeaturesSection;