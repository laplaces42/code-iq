from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pathlib import Path
import json
from concurrent.futures import ProcessPoolExecutor
import os

class BaseScanner(ABC):
    """Base class for all code health scanners"""
    
    def __init__(self, max_workers: Optional[int] = None, exclude_patterns: Optional[List[str]] = None):
        self.max_workers = max_workers or min(32, (os.cpu_count() or 1) + 4) # number of workers that will be scanning files for each scanner
        self.exclude_patterns = exclude_patterns or [
            '__pycache__', '.git', '.pytest_cache', 'node_modules', 
            '.venv', 'venv', '.env', 'build', 'dist', '.tox', '.mypy_cache'
        ] # default patterns to exclude from scanning
        self.results = []
        
    def should_exclude(self, path: Path) -> bool:
        """Check if path should be excluded from scanning"""
        return any(part in self.exclude_patterns for part in path.parts)

    def discover_files(self, root_path: str, extensions: List[str]) -> List[Path]:
        """Discover files with specified extensions"""
        root = Path(root_path)
        files = []
        if extensions == ['*'] or not extensions:
            return [p for p in root.rglob('*') if p.is_file() and not self.should_exclude(p)]
        
        for ext in extensions:
            pattern = f"**/*.{ext.lstrip('.')}"
            for file_path in root.glob(pattern):
                if file_path.is_file() and not self.should_exclude(file_path):
                    files.append(file_path)
                    
        return files
    
    @abstractmethod
    def scan_single_file(self, file_path: Path) -> Dict[str, Any]:
        """Scan a single file - must be implemented by subclasses"""
        pass
    
    @abstractmethod
    def get_file_extensions(self) -> List[str]:
        """Return file extensions this scanner handles"""
        pass
    
    def scan_batch(self, file_paths: List[Path], batch_size: int = 500) -> Dict[str, Any]:
        """Process files in batches to manage memory and system resources"""
        all_results = {}

        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            for i in range(0, len(file_paths), batch_size):
                batch = file_paths[i:i + batch_size]                
                for res in list(executor.map(self._safe_scan, batch)):
                    all_results.update(res)
                    
                # Brief pause between batches to prevent system overload
                # if i + batch_size < len(file_paths):
                #     time.sleep(0.1)
                
        return all_results
    
    def _safe_scan(self, path: Path):
        try:
            return self.scan_single_file(path)
        except Exception as e:
            return {str(path): {'raw': {}, 'errors':[str(e)]}, 'score': 0}
    
    def scan(self, path: str):
        """Main scanning method"""
        scanner_name = self.__class__.__name__

        # os.makedirs(os.path.dirname(f'./out/{scanner_name.lower()}.json'), exist_ok=True)

        print(f"Starting {scanner_name} scan of: {path}")
        
        # Discover relevant files
        extensions = self.get_file_extensions()
        files = self.discover_files(path, extensions)
        
        print(f"Found {len(files)} files with extensions {extensions}")
        
        if not files:
            return {}
        
        # Process files
        results = self.scan_batch(files)
        # self.write_results(results)
        return results
        
    
    def write_results(self, results: Dict[str, Any]):
        scanner_name = self.__class__.__name__.lower()
        output_path = f'./out/{scanner_name}.json'

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Load existing results if file exists
        if os.path.exists(output_path):
            try:
                with open(output_path, 'r') as f:
                    existing_results = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                existing_results = {}
        else:
            existing_results = {}

        # Update results
        existing_results.update(results)

        # Write updated results
        with open(output_path, 'w') as f:
            json.dump(existing_results, f, indent=2)




