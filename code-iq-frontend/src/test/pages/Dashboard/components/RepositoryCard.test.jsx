import RepositoryCard from "../../../../pages/Dashboard/components/RepositoryCard.jsx";
import { UserProvider } from "../../../../contexts/UserContext.tsx";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockRepoAllScores = {
  id: 1,
  name: "testuser/repo1",
  description: "A test repository",
  activityStatus: "Active",
  language: "Python",
  scores: {
    overall: 8.5,
    health: 8.0,
    security: 9.0,
    knowledge: 8.5,
    trend: 0.5,
  },
};

const mockRepoMissingScore = {
  id: 2,
  name: "testuser/repo2",
  description: "A test repository",
  activityStatus: "Paused",
  language: "Java",
  scores: {
    overall: 8.8,
    health: null,
    security: 9.0,
    knowledge: 8.5,
    trend: -0.5,
  },
};

describe("RepositoryCard", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <UserProvider>
          <RepositoryCard repo={mockRepoAllScores} />
        </UserProvider>
      </MemoryRouter>
    );
  });
  describe("when repository has all scores", () => {
    it("displays the repository name", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );
      const repoName = screen.getByText("testuser/repo1");
      expect(repoName).toBeInTheDocument();
    });

    it("displays the repository description", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );
      const repoDescription = screen.getByText("A test repository");
      expect(repoDescription).toBeInTheDocument();
    });

    it("displays the correct overall score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );
      const overallScore = screen.getByTestId("overall-score");
      expect(overallScore).toHaveTextContent(
        `${mockRepoAllScores.scores.overall}/10`
      );
      expect(overallScore).toHaveStyle("color: #48bb78");
    });

    it("displays the correct trend", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );

      const overallTrend = screen.getByTestId("overall-trend");
      expect(overallTrend).toHaveTextContent(
        `${mockRepoAllScores.scores.trend}`
      );
      expect(overallTrend).toHaveStyle("color: #48bb78");
      expect(overallTrend).toHaveTextContent("↗");
    });
    it("displays the correct health score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );

      const healthScore = screen.getByTestId("health-score");
      expect(healthScore).toHaveTextContent(
        `${mockRepoAllScores.scores.health}`
      );
      const healthBar = screen.getByTestId("health-progress");
      expect(healthBar).toHaveStyle({
        width: `${mockRepoAllScores.scores.health * 10}%`,
      });
    });

    it("displays the correct security score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );

      const securityScore = screen.getByTestId("security-score");
      expect(securityScore).toHaveTextContent(
        `${mockRepoAllScores.scores.security}`
      );
      const securityBar = screen.getByTestId("security-progress");
      expect(securityBar).toHaveStyle({
        width: `${mockRepoAllScores.scores.security * 10}%`,
      });
    });

    it("displays the correct knowledge score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );

      const knowledgeScore = screen.getByTestId("knowledge-score");
      expect(knowledgeScore).toHaveTextContent(
        `${mockRepoAllScores.scores.knowledge}`
      );
      const knowledgeBar = screen.getByTestId("knowledge-progress");
      expect(knowledgeBar).toHaveStyle({
        width: `${mockRepoAllScores.scores.knowledge * 10}%`,
      });
    });

    it("navigates to the repository details page on click", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <UserProvider>
            <Routes>
              <Route
                path="/"
                element={<RepositoryCard repo={mockRepoAllScores} />}
              />
              <Route
                path="/repositories/:repoId"
                element={<div>Repo Details</div>}
              />
            </Routes>
          </UserProvider>
        </MemoryRouter>
      );

      const repoLink = screen.getByText("View Details");
      expect(repoLink).toBeInTheDocument();
      act(() => {
        repoLink.click();
      });
      const detailsPage = screen.getByText("Repo Details");
      expect(detailsPage).toBeInTheDocument();
    });

    it("opens GitHub repository in a new tab", () => {
      const originalOpen = window.open;
      window.open = jest.fn();
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );

      const githubLink = screen.getByTitle("Open in GitHub");
      expect(githubLink).toBeInTheDocument();
      act(() => {
        githubLink.click();
      });
      expect(window.open).toHaveBeenCalledWith(
        `https://github.com/${mockRepoAllScores.name}`
      );
      window.open = originalOpen;
    });

    it("displays the correct metadata", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoAllScores} />
          </UserProvider>
        </MemoryRouter>
      );

      const activityStatus = screen.getByText("Active");
      expect(activityStatus).toBeInTheDocument();

      const languageTag = screen.getByText("Python");
      expect(languageTag).toBeInTheDocument();
      expect(languageTag).toHaveStyle("background-color: #3776ab");
    });
  });

  describe("when repository does not have all scores", () => {
    it("displays the repository name", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );
      const repoName = screen.getByText("testuser/repo2");
      expect(repoName).toBeInTheDocument();
    });

    it("displays the repository description", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );
      const repoDescription = screen.getByText("A test repository");
      expect(repoDescription).toBeInTheDocument();
    });

    it("displays the correct overall score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );
      const overallScore = screen.getByTestId("overall-score");
      expect(overallScore).toHaveTextContent(
        `${mockRepoMissingScore.scores.overall}/10`
      );
      expect(overallScore).toHaveStyle("color: #48bb78");
    });

    it("displays the correct trend", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );

      const overallTrend = screen.getByTestId("overall-trend");
      expect(overallTrend).toHaveTextContent(
        `${Math.abs(mockRepoMissingScore.scores.trend)}`
      );
      expect(overallTrend).toHaveStyle("color: #f56565");
      expect(overallTrend).toHaveTextContent("↘");
    });
    it("displays the correct health score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );

      const healthScore = screen.getByTestId("health-score");
      expect(healthScore).toHaveTextContent("--");
      const healthBar = screen.getByTestId("health-progress");
      expect(healthBar).toHaveStyle({
        width: "0%",
      });
    });

    it("displays the correct security score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );

      const securityScore = screen.getByTestId("security-score");
      expect(securityScore).toHaveTextContent(
        `${mockRepoMissingScore.scores.security}`
      );
      const securityBar = screen.getByTestId("security-progress");
      expect(securityBar).toHaveStyle({
        width: `${mockRepoMissingScore.scores.security * 10}%`,
      });
    });

    it("displays the correct knowledge score", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );

      const knowledgeScore = screen.getByTestId("knowledge-score");
      expect(knowledgeScore).toHaveTextContent(
        `${mockRepoMissingScore.scores.knowledge}`
      );
      const knowledgeBar = screen.getByTestId("knowledge-progress");
      expect(knowledgeBar).toHaveStyle({
        width: `${mockRepoMissingScore.scores.knowledge * 10}%`,
      });
    });

    it("navigates to the repository details page on click", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <UserProvider>
            <Routes>
              <Route
                path="/"
                element={<RepositoryCard repo={mockRepoMissingScore} />}
              />
              <Route
                path="/repositories/:repoId"
                element={<div>Repo Details</div>}
              />
            </Routes>
          </UserProvider>
        </MemoryRouter>
      );

      const repoLink = screen.getByText("View Details");
      expect(repoLink).toBeInTheDocument();
      act(() => {
        repoLink.click();
      });
      const detailsPage = screen.getByText("Repo Details");
      expect(detailsPage).toBeInTheDocument();
    });

    it("opens GitHub repository in a new tab", () => {
      const originalOpen = window.open;
      window.open = jest.fn();
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );

      const githubLink = screen.getByTitle("Open in GitHub");
      expect(githubLink).toBeInTheDocument();
      act(() => {
        githubLink.click();
      });
      expect(window.open).toHaveBeenCalledWith(
        `https://github.com/${mockRepoMissingScore.name}`
      );
      window.open = originalOpen;
    });

    it("displays the correct metadata", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryCard repo={mockRepoMissingScore} />
          </UserProvider>
        </MemoryRouter>
      );

      const activityStatus = screen.getByText("Paused");
      expect(activityStatus).toBeInTheDocument();

      const languageTag = screen.getByText("Java");
      expect(languageTag).toBeInTheDocument();
      expect(languageTag).toHaveStyle("background-color: #ed8b00");
    });
  });
});
