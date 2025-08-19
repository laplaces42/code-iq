from base_scanner import BaseScanner
from typing import Dict, Any, List
from pathlib import Path
import subprocess
from collections import defaultdict
import json
import os

class Secrets(BaseScanner):
    def __init__(self, max_workers=None, exclude_patterns=None):
        super().__init__(max_workers, exclude_patterns)

    def scan_single_file(self, file_path: Path) -> Dict[str, Any]:
        """Scan a single file for secrets"""
        # Add custom logic for scanning secrets here
        return {}
    
    def get_file_extensions(self):
        return ["*"]
    
    def scan(self, path):
        # Test error for debugging
        # raise Exception("Test error in secrets scanner")
        scanner_name = self.__class__.__name__

        files = self.discover_files(path, self.get_file_extensions())
        cmd = ["trufflehog", "filesystem", "--json", path]
        results = {}
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        except subprocess.TimeoutExpired:
            for path in files:
                results[str(path)] = {
                    'raw': "",
                    'errors': ['Secrets scanning timeout (10 min)'],
                    'score': 0
                }
            return
        
        per_file = defaultdict(list)
        for line in proc.stderr.splitlines():
            if not line:
                continue

            try:
                info = json.loads(line)
            except json.JSONDecodeError:
                continue

            fpath = info.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {}).get("file")
            if fpath:
                per_file[fpath].append(line)

        for path in files:
            lst  = per_file.get(str(path), [])
            raw  = "\n".join(lst)
            issues = len(lst)
            results[str(path)] = {
                "raw": raw,
                "errors": [],
                "score": 100 - issues
            }

        # self.write_results(results)
        return results

    def scan_batch(self, file_paths: List[Path], batch_size: int = 500) -> Dict[str, Any]:
        if not file_paths:
            return {}

        results = {}
        for i in range(0, len(file_paths), batch_size):
            batch = file_paths[i:i + batch_size]
            cmd = ["trufflehog", "filesystem", "--json", *[str(p) for p in batch]]

            try:
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            except subprocess.TimeoutExpired:
                for path in batch:
                    results[str(path)] = {
                        'raw': "",
                        'errors': ['Secrets scanning timeout (60s)'],
                        'score': 0
                    }
                continue

            per_file = defaultdict(list)
            for line in proc.stderr.splitlines():
                if not line:
                    continue

                info = json.loads(line)
                path = info.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {}).get("file")
                if path:
                    per_file[path].append(line)

            for path in batch:
                lst  = per_file.get(str(path), [])
                raw  = "\n".join(lst)
                issues = len(lst)
                results[str(path)] = {
                    "raw": raw,
                    "errors": [],
                    "score": 100 - issues
                }

        return results