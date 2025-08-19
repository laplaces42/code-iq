import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";

function HomePage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");

    if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
    } else if (errorParam === "no_code") {
      setError("Authorization code not received. Please try again.");
    }

    // Remove auto-redirect to dashboard - let users choose to visit homepage even when logged in
  }, [navigate]);

  // Remove the early return for authenticated users - let them see the homepage

  async function handleSignIn() {
    // Clear any existing errors
    setError(null);
    sessionStorage.setItem("redirect_uri", window.location.pathname);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&scope=repo,read:user`;
  }

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>CodeIQ</h1>
          <p className={styles.heroSubtitle}>
            Intelligent codebase analysis and health monitoring
          </p>
          <p className={styles.heroDescription}>
            Get comprehensive insights into your code health, security, and
            knowledge with our AI-powered dashboard
          </p>

          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
            </div>
          )}

          <button onClick={handleSignIn} className={styles.ctaButton}>
            <svg
              className={styles.githubIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>
            Three Pillars of Code Excellence
          </h2>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.health}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3>Code Health Score</h3>
              <p>
                Monitor linter errors, complexity, test coverage, and
                architectural violations in real-time
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
      </section>

      {/* Dashboard Preview */}
      <section className={styles.dashboardPreview}>
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
                  I found 3 security issues. Let me show you the specific
                  files...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContainer}>
          <h2>Ready to elevate your code quality?</h2>
          <p>
            Join developers who trust CodeIQ for comprehensive codebase insights
          </p>
          <button
            onClick={handleSignIn}
            className={`${styles.ctaButton} ${styles.secondary}`}
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
