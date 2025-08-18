from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pathlib import Path
import json
from concurrent.futures import ProcessPoolExecutor
from supabase import create_client
import os
import requests
import tempfile

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

    def discover_files(self, root_path: str, extensions: List[str]) -> Dict[Path, str]:
        """Discover files with specified extensions"""
        files = {}
        
        try:
            supabase = create_client(os.getenv("DB_URL"), os.getenv("DB_KEY"))
            response = supabase.storage.from_('temp_scans').list(root_path)
            for r in response:
                if r['id'] is None:  # It's a folder
                    # Use forward slash for storage paths (platform independent)
                    folder_path = f"{root_path}/{r['name']}" if root_path else r['name']
                    files.update(self.discover_files(folder_path, extensions))
                else:  # It's a file
                    file_path = Path(f"{root_path}/{r['name']}") if root_path else Path(r['name'])
                    if (not self.get_file_extensions() or self.get_file_extensions() == ['*']) or (not self.should_exclude(file_path) and file_path.suffix in extensions):
                        public_url = supabase.storage.from_('temp_scans').get_public_url(str(file_path))
                        files[file_path] = public_url
        except Exception as e:
            print(f"Error accessing path '{root_path}': {e}")
        return files

    def _download_from_supabase(self, url: str) -> str:
        response = requests.get(url)
        return response.text

    def make_temp_file(self, url: str, suffix: str = None) -> str:
        """Create a temporary file with the given contents"""
        contents = self._download_from_supabase(url)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(contents.encode())
            return temp_file.name

    def delete_temp_file(self, temp_file: str):
        """Delete the temporary file"""
        try:
            os.unlink(Path(temp_file))
        except Exception as e:
            print(f"Error deleting temp file '{temp_file}': {e}")

    @abstractmethod
    def scan_single_file(self, file_path: Path, file_url: str = None) -> Dict[str, Any]:
        """Scan a single file - must be implemented by subclasses"""
        pass
    
    @abstractmethod
    def get_file_extensions(self) -> List[str]:
        """Return file extensions this scanner handles"""
        pass

    def scan_batch(self, file_paths: Dict[Path, str], batch_size: int = 500) -> Dict[str, Any]:
        """Process files in batches to manage memory and system resources"""
        all_results = {}

        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            for i in range(0, len(file_paths), batch_size):
                batch_items = list(file_paths.items())[i:i + batch_size]
                # Pass individual (path, url) tuples to _safe_scan
                for res in list(executor.map(self._safe_scan, batch_items)):
                    all_results.update(res)
                    
                # Brief pause between batches to prevent system overload
                # if i + batch_size < len(file_paths):
                #     time.sleep(0.1)
                
        return all_results
    
    def _safe_scan(self, path_url_tuple):
        """Safely scan a single file given (path, url) tuple"""
        path, url = path_url_tuple
        # print(path, url)
        try:
            return self.scan_single_file(path, url)
        except Exception as e:
            return {str(path): {'raw': {}, 'errors': [str(e)], 'score': 0}}
    
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




