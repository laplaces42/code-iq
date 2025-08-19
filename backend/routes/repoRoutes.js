import express from "express";
const router = express.Router();
import repoController from "../controllers/repoController.js";
const {
  checkInstallation,
  fetchNewRepos,
  cloneRepo,
  fetchRepos,
  fetchRepoInfo,
  fetchScannerResults
} = repoController;

router.get("/check-installation", checkInstallation);
router.post("/fetch-new-repos", fetchNewRepos);
router.post("/clone", cloneRepo);
router.post("/fetch-repos", fetchRepos);
router.get("/fetch-repo-info/:repoId", fetchRepoInfo);
router.post("/fetch-scanner-results", fetchScannerResults);

export default router;
