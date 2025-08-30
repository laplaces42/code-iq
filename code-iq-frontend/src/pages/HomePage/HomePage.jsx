import styles from "./HomePage.module.css";
import { useUser } from "../../contexts/UserContext.tsx";
import HeroSection from "./components/HeroSection.jsx";
import FeaturesSection from "./components/FeaturesSection.jsx";
import DashboardPreview from "./components/DashboardPreview.jsx";
import CTASection from "./components/CTASection.jsx";

function HomePage() {
  const { authError, setAuthError } = useUser();

  // Remove the early return for authenticated users - let them see the homepage

  async function handleSignIn() {
    // Clear any existing errors
    setAuthError(null);
    sessionStorage.setItem("redirect_uri", window.location.pathname);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&scope=repo,read:user`;
  }

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <HeroSection authError={authError} handleSignIn={handleSignIn} />
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <FeaturesSection />
      </section>

      {/* Dashboard Preview */}
      <section className={styles.dashboardPreview}>
        <DashboardPreview />
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <CTASection handleSignIn={handleSignIn} />
      </section>
    </div>
  );
}

export default HomePage;
