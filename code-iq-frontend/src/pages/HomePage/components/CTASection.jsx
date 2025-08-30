import styles from "./CTASection.module.css";

function CTASection({ handleSignIn }) {
  return (
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
  );
}

export default CTASection;