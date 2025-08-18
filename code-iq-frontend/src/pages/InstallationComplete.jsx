import { useEffect, useState } from "react";
import styles from "./InstallationComplete.module.css";

// Method 1: Immediate Self-Close
function InstallationCompleteImmediate() {
  useEffect(() => {
    // Close immediately when component mounts
    window.close();
  }, []);

  return null; // No UI needed for immediate close
}

// Method 2: Delayed Self-Close with Countdown
function InstallationCompleteDelayed() {
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    window.close();
  };

  return (
    <div className="installation-complete">
      <div className="container">
        <div className="success-icon">✅</div>
        <h1 className="title">Installation Complete!</h1>
        <p className="message">
          CodeIQ has been successfully installed to your GitHub account.
        </p>
        <div className="countdown">
          This window will close in <span className="timer">{seconds}</span>{" "}
          seconds...
        </div>
        <button className="close-btn" onClick={handleClick}>
          Close Now
        </button>
      </div>
    </div>
  );
}

// Method 3: Smart Self-Close with Fallback
function InstallationCompleteSmart() {
  const [showManualClose, setShowManualClose] = useState(false);
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    // Send message to parent window if possible
    try {
      if (window.opener) {
        window.opener.postMessage(
          { type: "INSTALLATION_COMPLETE" },
          window.location.origin
        );
      }
    } catch (error) {
      console.error("Could not send message to parent:", error);
    }

    // Start countdown
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          attemptClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const attemptClose = () => {
    try {
      window.close();

      // If still open after 1 second, show manual option
      setTimeout(() => {
        setShowManualClose(true);
      }, 1000);
    } catch (error) {
      setShowManualClose(true);
    }
  };

  const handleManualClose = () => {
    window.close();
  };

  return (
    <div className={styles.installationComplete}>
      <div className={styles.container}>
        <div className={styles.successIcon}>✅</div>
        <h1 className={styles.title}>Installation Complete!</h1>
        <p className={styles.message}>
          CodeIQ has been successfully installed. You can now return to your
          dashboard to start monitoring your repositories.
        </p>

        {!showManualClose ? (
          <div className={styles.countdown}>
            Closing in <span className={styles.timer}>{seconds}</span>{" "}
            seconds...
          </div>
        ) : (
          <div className={styles.manualClose}>
            <p className={styles.manualMessage}>
              Please close this window to continue.
            </p>
            <button className={styles.closeBtn} onClick={handleManualClose}>
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the smart version as default (recommended)
export default InstallationCompleteSmart;

// Named exports for other versions
export { InstallationCompleteImmediate, InstallationCompleteDelayed };
