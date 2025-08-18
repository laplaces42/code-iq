from base_scanner import BaseScanner
from typing import Dict, Any, List
from pathlib import Path
import subprocess
from collections import defaultdict
import re
import json
import os

class Todos(BaseScanner):
    def __init__(self, max_workers=None, exclude_patterns=None):
        super().__init__(max_workers, exclude_patterns)

    def scan_single_file(self, file_path: Path) -> Dict[str, Any]:
        """Scan a single file for TODOs"""
        # Add custom logic for scanning TODOs here
        result = self._find_todos(file_path)
        return result

    def _find_todos(self, file_path: Path) -> Dict[str, Any]:
        """Find TODO comments in a file"""
        result = {
            str(file_path): {
                'raw': "",
                'errors': [],
                'score': 0
            }
        }
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                patterns = [
                    r'#.*?TODO.*',      # Python: # TODO: fix this
                    r'""".*?TODO.*?"""', # Python: """ TODO: fix this """
                    r'\'\'\'.*?TODO.*?\'\'\'', # Python: ''' TODO: fix this '''
                    r'#.*?FIXME.*',     # Python: # FIXME: broken logic
                    r'//.*?TODO.*',     # JavaScript/C++: // TODO: implement
                    r'/\*.*?TODO.*?\*/', # Multi-line: /* TODO: refactor */
                ]
                todos = []
                for line_num, line in enumerate(content.splitlines(), start=1):
                    for pattern in patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            todos.append(f"{line_num}: {line.strip()}")

                result[str(file_path)]['raw'] = "\n".join(todos)
                result[str(file_path)]['score'] = 100-len(todos)
        except Exception as e:
            result[str(file_path)]['errors'].append(f'Error reading file: {str(e)}')
        
        return result
    def get_file_extensions(self):
        return ["*"]