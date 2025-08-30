import RepositoryModal from "../../../components/Dashboard/RepositoryModal.jsx";
import { UserProvider } from "../../../../contexts/UserContext.tsx";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function TestWrapper(props) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <MemoryRouter>
      <UserProvider>
        <RepositoryModal
          {...props}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </UserProvider>
    </MemoryRouter>
  );
}

const mockRepos = [
  {
    id: "1",
    name: "testuser/repo1",
    installed: true,
  },
  {
    id: "2",
    name: "testuser/repo2",
    installed: false,
  },
  {
    id: "3",
    name: "testuser/repo3",
    installed: true,
  },
];

const repoModalOptions = {
  repositories: mockRepos,
  onClose: jest.fn(),
  onSelectRepository: jest.fn(),
};

describe("RepositoryModal", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <UserProvider>
          <RepositoryModal isOpen={true} />
        </UserProvider>
      </MemoryRouter>
    );
  });
  it("shows nothing when isOpen is false", () => {
    render(
      <MemoryRouter>
        <UserProvider>
          <RepositoryModal isOpen={false} />
        </UserProvider>
      </MemoryRouter>
    );
    const emptyState = screen.queryByText("No repositories available");
    expect(emptyState).not.toBeInTheDocument();
  });

  describe("when no repositories are provided", () => {
    it("shows loading state", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryModal loading={true} isOpen={true} />
          </UserProvider>
        </MemoryRouter>
      );
      const loadingState = screen.getByText("Loading repositories...");
      expect(loadingState).toBeInTheDocument();
    });
    it("shows no repositories", () => {
      render(
        <MemoryRouter>
          <UserProvider>
            <RepositoryModal isOpen={true} />
          </UserProvider>
        </MemoryRouter>
      );
      const emptyState = screen.getByText("No repositories available");
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe("when repositories are provided", () => {
    it("shows repositories when provided", () => {
      render(<TestWrapper {...repoModalOptions} />);
      const repo1 = screen.getByText("testuser/repo1");
      const repo2 = screen.getByText("testuser/repo2");
      const repo3 = screen.getByText("testuser/repo3");
      expect(repo1).toBeInTheDocument();
      expect(repo2).toBeInTheDocument();
      expect(repo3).toBeInTheDocument();
    });

    it("shows 'Connect' when a repository is installed", () => {
      render(<TestWrapper {...repoModalOptions} />);
      const repo1 = screen.getByText("testuser/repo1");
      act(() => {
        repo1.click();
      });
      const connectButton = screen.getByText("Connect");
      expect(connectButton).toBeInTheDocument();
    });

    it("shows 'Authorize' when a repository is not installed", () => {
      render(<TestWrapper {...repoModalOptions} />);
      const repo2 = screen.getByText("testuser/repo2");
      act(() => {
        repo2.click();
      });
      const authorizeButton = screen.getByText("Authorize");
      expect(authorizeButton).toBeInTheDocument();
    });

    it("'Connect' button calls onSelectRepository", () => {
      render(<TestWrapper {...repoModalOptions} />);
      const repo1 = screen.getByText("testuser/repo1");
      act(() => {
        repo1.click();
      });
      const connectButton = screen.getByText("Connect");
      act(() => {
        connectButton.click();
      });
      expect(repoModalOptions.onSelectRepository).toHaveBeenCalled();
    });

    it("'Authorize' button calls onSelectRepository", () => {
      render(<TestWrapper {...repoModalOptions} />);
      const repo2 = screen.getByText("testuser/repo2");
      act(() => {
        repo2.click();
      });
      const authorizeButton = screen.getByText("Authorize");
      act(() => {
        authorizeButton.click();
      });
      expect(repoModalOptions.onSelectRepository).toHaveBeenCalled();
    });

    it("Search cuts down the number of repos", async () => {
      render(<TestWrapper {...repoModalOptions} />);

      const searchInput = screen.getByPlaceholderText("Search repositories...");
      await userEvent.type(searchInput, "repo1");
      const repo1 = screen.getByText("testuser/repo1");
      const repo2 = screen.queryByText("testuser/repo2");
      const repo3 = screen.queryByText("testuser/repo3");
      expect(repo1).toBeInTheDocument();
      expect(repo2).not.toBeInTheDocument();
      expect(repo3).not.toBeInTheDocument();
    });

    it("Certain searches show no repos", async () => {
      render(<TestWrapper {...repoModalOptions} />);

      const searchInput = screen.getByPlaceholderText("Search repositories...");
      await userEvent.type(searchInput, "repo4");
      const repo1 = screen.queryByText("testuser/repo1");
      const repo2 = screen.queryByText("testuser/repo2");
      const repo3 = screen.queryByText("testuser/repo3");
      expect(repo1).not.toBeInTheDocument();
      expect(repo2).not.toBeInTheDocument();
      expect(repo3).not.toBeInTheDocument();
      expect(
        screen.getByText('No repositories found for "repo4"')
      ).toBeInTheDocument();
    });

    it("Clearing search field shows all repositories", async () => {
      render(<TestWrapper {...repoModalOptions} />);

      const searchInput = screen.getByPlaceholderText("Search repositories...");
      await userEvent.type(searchInput, "repo1");
      const clearButton = screen.getByText("Clear");
      act(() => {
        clearButton.click();
      });
      const repo1 = screen.getByText("testuser/repo1");
      const repo2 = screen.queryByText("testuser/repo2");
      const repo3 = screen.queryByText("testuser/repo3");
      expect(repo1).toBeInTheDocument();
      expect(repo2).toBeInTheDocument();
      expect(repo3).toBeInTheDocument();
    });

    it("Cancel button closes the modal", async () => {
      render(<TestWrapper {...repoModalOptions} />);
      const cancelButton = screen.getByText("Cancel");
      act(() => {
        cancelButton.click();
      });
      expect(screen.queryByText("Select Repository")).not.toBeInTheDocument();
    });

    it("Clicking outside the modal closes the modal", async () => {
      render(<TestWrapper {...repoModalOptions} />);

      const backdrop = screen.getByTestId("repo-modal-backdrop");
      act(() => {
        backdrop.click();
      });
      expect(screen.queryByText("Select Repository")).not.toBeInTheDocument();
    });

    it("Closing the modal cleans up the state", async () => {
      render(<TestWrapper {...repoModalOptions} />);
      const searchInput = screen.getByPlaceholderText("Search repositories...");
      await userEvent.type(searchInput, "repo1");
      const cancelButton = screen.getByText("Cancel");
      act(() => {
        cancelButton.click();
      });
      render(<TestWrapper {...repoModalOptions} />);
      const newSearchInput = screen.getByPlaceholderText(
        "Search repositories..."
      );
      expect(newSearchInput.value).toBe("");
      const authorizeButton = screen.queryByText("Authorize");
      expect(authorizeButton).toBeDisabled();
    });
  });
});
