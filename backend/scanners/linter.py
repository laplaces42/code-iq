import subprocess
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Any
from base_scanner import BaseScanner

class Linter(BaseScanner):

    COMMANDS = {
        '.py': ['flake8', '--format=%(path)s:%(row)d:%(col)d [%(code)s]: %(text)s']
    }
    def __init__(self, max_workers=None, exclude_patterns=None):
        super().__init__(max_workers, exclude_patterns)

    def get_file_extensions(self) -> List[str]:
        return list(self.COMMANDS.keys())

    def scan_single_file(self, file_path: Path) -> Dict[str, Any]:
        """Lint a single Python file"""
        result = self._lint_single_file(file_path)
            
        return result
        
    def _should_exclude(self, path: Path) -> bool:
        """Check if path should be excluded from scanning - use parent method"""
        return self.should_exclude(path)
    
    def _lint_single_file(self, file_path: Path) -> Dict[str, Any]:
        """Lint a single file using subprocess for better isolation"""
        result = {
            str(file_path): {
                'raw': "",
                'errors': [],
                'score': 0
            }
        }
        
        try:
            cmd = [*self.COMMANDS[file_path.suffix], str(file_path)]
            if not cmd:
                result[str(file_path)]['errors'].append(f"Unsupported file extension: {file_path.suffix}")
                return result
            
            lint_result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            
            if lint_result.stdout:
                result[str(file_path)]['raw'] = lint_result.stdout
                result[str(file_path)]['score'] = 100 - len(lint_result.stdout.split('\n'))
                    
        except subprocess.TimeoutExpired:
            result[str(file_path)]['errors'].append('Linting timeout (5s)')
        except Exception as e:
            result[str(file_path)]['errors'].append(f'Linting error: {str(e)}')
        

        return result

    def scan_batch(self, file_paths: List[Path], batch_size: int = 500) -> Dict[str, Any]:
        if not file_paths:
            return {}
        
        results = {}
        for i in range(0, len(file_paths), batch_size):
            batch = file_paths[i:i + batch_size]

            groups = defaultdict(list)
            for path in batch:
                groups[path.suffix].append(path)

            for suffix, paths in groups.items():
                cmd_base = self.COMMANDS.get(suffix)
                if not cmd_base:
                    continue
                cmd = [*cmd_base, *map(str, paths)]
                try:
                    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                except subprocess.TimeoutExpired:
                    for path in paths:
                        results[str(path)] = {
                            'raw': "",
                            'errors': ['Linting timeout (60s)'],
                            'score': 0
                        }
                    continue

                if proc.returncode not in (0, 1):
                    err = proc.stderr.strip() or "flake8 crash"
                    for p in paths:
                        results[str(p)] = {"raw":"", "errors":[err], "score":0}
                    continue
            
                per_file = defaultdict(list)
                for line in proc.stdout.splitlines():
                    if not line: 
                        continue
                    path_part = line.split(':', 1)[0]
                    per_file[path_part].append(line)

                for path in paths:
                    lst  = per_file.get(str(path), [])
                    raw  = "\n".join(lst)
                    issues = len(lst)
                    results[str(path)] = {
                        "raw": raw,
                        "errors": [],
                        "score": 100 - issues
                    }


        return results
