import express from "express";
const router = express.Router();
import scanController from "../controllers/scanController.js";
const {
  startScan,
  individualScannerStart,
  individualScannerFinish,
  individualScannerFailed,
  scanComplete,
} = scanController;

router.post("/start", startScan);
router.post("/individual_start", individualScannerStart);
router.post("/individual_finish", individualScannerFinish);
router.post("/individual_failed", individualScannerFailed);
router.post("/complete", scanComplete);

export default router;
