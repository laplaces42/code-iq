from typing import Dict, Any, List, Optional
from pathlib import Path
import time
import json
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor
from base_scanner import BaseScanner
from linter import Linter
from secrets_pii import Secrets
from todo import Todos
from collections import defaultdict
from supabase import create_client
from dotenv import load_dotenv
import os
import requests
from datetime import datetime, timezone

load_dotenv()

class ScanOrchestrator:
    """Orchestrates multiple scanners for comprehensive code health analysis"""

    def __init__(self, scan_id: str, max_concurrent_scanners: int = 3):
        self.scanners = {}
        self.scanner_types = defaultdict(list)
        self.max_concurrent_scanners = max_concurrent_scanners
        self.results = {}
        self.scan_id = scan_id
        self.supabase = create_client(os.getenv("DB_URL"), os.getenv("DB_KEY"))
        self.db_mutex = threading.Lock()

    def register_scanner(self, scanner: BaseScanner, scanner_type: str):
        """Register a scanner with the orchestrator"""
        name = scanner.__class__.__name__
        self.scanners[name] = scanner
        self.scanner_types[scanner_type].append(name)
        

    def run_single_scanner(self, name: str, scanner: BaseScanner, path: str) -> Dict[str, Any]:
        """Run a single scanner and return its results"""
        print(f"Starting {name} scanner...")

        try:
            # Acquire mutex for database state update
            with self.db_mutex:
                states = self.supabase.table('active_scans').select({"states"}).eq("id", self.scan_id).single().execute().data.get("states", {})

                waiting = states.get("waiting", [])
                in_progress = states.get("inProgress", [])

                if name in waiting:
                    waiting.remove(name)
                in_progress.append(name)

                self.supabase.table('active_scans').update({
                    "states": states
                }).eq("id", self.scan_id).execute()
            
            # Send HTTP notification (outside mutex)
            try:
                requests.post(
                    f"{os.getenv('BACKEND_URL')}/scan/individual_start", 
                    headers={"Content-Type": "application/json"},
                    json={"scanner": name, "path": path, "scan_id": self.scan_id},
                    timeout=10
                )
            except requests.RequestException as e:
                print(f"Warning: HTTP notification failed for {name}: {e}")
            
            # Run the actual scan (outside mutex - this is the long-running operation)
            result = scanner.scan(path)
            print(f"✓ {name} completed")
            
            # Acquire mutex again for completion state update
            with self.db_mutex:
                states = self.supabase.table('active_scans').select({"states"}).eq("id", self.scan_id).single().execute().data.get("states", {})

                completed = states.get("completed", [])
                in_progress = states.get("inProgress", [])

                if name in in_progress:
                    in_progress.remove(name)
                completed.append(name)
                
                self.supabase.table('active_scans').update({
                    "states": states
                }).eq("id", self.scan_id).execute()

            # Send HTTP notification (outside mutex)
            try:
                requests.post(
                    f"{os.getenv('BACKEND_URL')}/scan/individual_finish", 
                    headers={"Content-Type": "application/json"},
                    json={"scanner": name, "path": path, "scan_id": self.scan_id},
                    timeout=10
                )
            except requests.RequestException as e:
                print(f"Warning: HTTP notification failed for {name}: {e}")

            return result
        except Exception as e:
            print(f"✗ {name} failed: {e}")
            # Ensure failed scanner is removed from in_progress
            try:
                with self.db_mutex:
                    states = self.supabase.table('active_scans').select({"states"}).eq("id", self.scan_id).single().execute().data.get("states", {})
                    in_progress = states.get("inProgress", [])
                    failed = states.get("failed", [])
                    if name in in_progress:
                        in_progress.remove(name)
                    failed.append(name)

                    self.supabase.table('active_scans').update({
                        "states": states
                    }).eq("id", self.scan_id).execute()
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup {name} from in_progress: {cleanup_error}")

            # Send HTTP notification (outside mutex)
            try:
                requests.post(
                    f"{os.getenv('BACKEND_URL')}/scan/individual_failed", 
                    headers={"Content-Type": "application/json"},
                    json={"scanner": name, "path": path, "scan_id": self.scan_id},
                    timeout=10
                )
            except requests.RequestException as e:
                print(f"Warning: HTTP notification failed for {name}: {e}")
            return {}
    
    def scan_codebase(self, path: str, scanners: Optional[List[str]] = None) -> Dict[str, Any]:
        """Run all registered scanners on the codebase"""
        if scanners is None:
            scanners = list(self.scanners.keys())

        states = {
            "waiting": scanners,
            "inProgress": [],
            "completed": [],
            "failed": []
        }
        self.supabase.table('active_scans').update({"states": states, "status": "running"}).eq("id", self.scan_id).execute()

        total_start_time = time.time()
        print(f"Starting comprehensive scan of: {path}")
        print(f"Running {len(scanners)} scanners: {', '.join(scanners)}")
        
        # Run scanners concurrently (but limit concurrency to prevent system overload)
        with ThreadPoolExecutor(max_workers=self.max_concurrent_scanners) as executor:
            futures = {
                executor.submit(self.run_single_scanner, name, self.scanners[name], path): name
                for name in scanners if name in self.scanners
            }

            scanner_results = {}
            for future in futures:
                name = futures[future]
                scanner_results[name] = future.result()
        
        total_time = time.time() - total_start_time
        
        # Aggregate results
        aggregated_results = {
            'scan_metadata': {
                'path_scanned': path,
                'scanners_run': scanners,
                'total_scan_time': total_time,
                'timestamp': time.time()
            },
            'scanner_results': scanner_results,
        }
        
        self.results[path] = aggregated_results
        return aggregated_results
    
    def generate_scores(self, scanner_results: Dict[str, Dict[str, Any]], scan_path: str = None) -> Dict[str, Dict[str, Any]]:
        """Generate a summary of results for each file scanned"""

        file_out = self._generate_file_results(scan_path, scanner_results)
        file_scores = defaultdict(dict)
        for file, out in file_out.items():
            # Get scanner lists with safe defaults
            health_scanners = self.scanner_types.get('health', [])
            security_scanners = self.scanner_types.get('security', [])
            knowledge_scanners = self.scanner_types.get('knowledge', [])
            
            # Calculate health score with division by zero protection
            if health_scanners:
                file_scores[file]['health'] = {}
                health_scans = [scan for scan in out if scan in health_scanners]
                if health_scans:
                    health_sum = 0
                    for scan in health_scans:
                        health_sum += out[scan].get('score', 0)
                        if file_scores[file]['health'].get('scanners'):
                            file_scores[file]['health']['scanners'].update({scan: out[scan]})
                        else:
                            file_scores[file]['health']['scanners'] = {scan: out[scan]}
                    health_score = health_sum / len(health_scans) if health_scans else 0
                    file_scores[file]['health']['score'] = health_score / 10
            else:
                file_scores[file]['health'] = {'score': 0, 'scanners': {}}

            # Calculate security score with division by zero protection
            if security_scanners:
                file_scores[file]['security'] = {}
                security_scans = [scan for scan in out if scan in security_scanners]
                if security_scans:
                    security_sum = 0
                    for scan in security_scans:
                        security_sum += out[scan].get('score', 0)
                        if file_scores[file]['security'].get('scanners'):
                            file_scores[file]['security']['scanners'].update({scan: out[scan]})
                        else:
                            file_scores[file]['security']['scanners'] = {scan: out[scan]}
                    security_score = security_sum / len(security_scans) if security_scans else 0
                    file_scores[file]['security']['score'] = security_score / 10
            else:
                file_scores[file]['security'] = {'score': 0, 'scanners': {}}

            # Calculate knowledge score with division by zero protection
            if knowledge_scanners:
                file_scores[file]['knowledge'] = {}
                knowledge_scans = [scan for scan in out if scan in knowledge_scanners]
                if knowledge_scans:
                    knowledge_sum = 0
                    for scan in knowledge_scans:
                        knowledge_sum += out[scan].get('score', 0)
                        if file_scores[file]['knowledge'].get('scanners'):
                            file_scores[file]['knowledge']['scanners'].update({scan: out[scan]})
                        else:
                            file_scores[file]['knowledge']['scanners'] = {scan: out[scan]}
                    knowledge_score = knowledge_sum / len(knowledge_scans) if knowledge_scans else 0
                    file_scores[file]['knowledge']['score'] = knowledge_score / 10
            else:
                file_scores[file]['knowledge'] = {'score': 0, 'scanners': {}}

        file_scores = dict(file_scores)
        # print(file_scores)

        repo_id = self.supabase.table("active_scans").select("repoSnapshotId").eq("id", self.scan_id).single().execute().data.get("repoSnapshotId")

        health_total = []
        security_total = []
        knowledge_total = []

        for file, scan in file_scores.items():
            health_score = scan.get('health', {}).get('score')
            security_score = scan.get('security', {}).get('score')
            knowledge_score = scan.get('knowledge', {}).get('score')
            
            self.supabase.table("file_snapshots").insert({
                "repoSnapshotId": repo_id,
                "filePath": file,
                "healthScore": health_score,
                "securityScore": security_score,
                "knowledgeScore": knowledge_score,
                "scannerResults": scan
            }).execute()

            if health_score:
                health_total.append(health_score)
            if security_score:
                security_total.append(security_score)
            if knowledge_score:
                knowledge_total.append(knowledge_score)

        overall = []
        health_avg = sum(health_total) / len(health_total) if health_total else None
        if health_avg is not None:
            overall.append(health_avg)
        security_avg = sum(security_total) / len(security_total) if security_total else None
        if security_avg is not None:
            overall.append(security_avg)
        knowledge_avg = sum(knowledge_total) / len(knowledge_total) if knowledge_total else None
        if knowledge_avg is not None:
            overall.append(knowledge_avg)
        overall_avg = sum(overall) / len(overall) if overall else None

        self.supabase.table("active_scans").update({
            "status": "completed",
            "completedAt": datetime.now(timezone.utc).isoformat()
        }).eq("id", self.scan_id).execute()

        previous_scores = self.supabase.table("repo_snapshots").select("healthScore, securityScore, knowledgeScore").eq("id", repo_id).single().execute().data

        # Handle None values from database
        prev_health = previous_scores.get("healthScore") or 0.0
        prev_security = previous_scores.get("securityScore") or 0.0  
        prev_knowledge = previous_scores.get("knowledgeScore") or 0.0
        
        prev_overall = (prev_health + prev_security + prev_knowledge) / 3 if previous_scores else 0.0
        self.supabase.table("repo_snapshots").update({
            "healthScore": health_avg,
            "securityScore": security_avg,
            "knowledgeScore": knowledge_avg,
            "trend": overall_avg - prev_overall if overall_avg is not None and prev_overall is not None else None,
        }).eq("id", repo_id).execute()

        try:
            requests.post(
                f"{os.getenv('BACKEND_URL')}/scan/complete", 
                headers={"Content-Type": "application/json"},
                json={"scan_id": self.scan_id},
                timeout=10
            )
        except requests.RequestException as e:
            print(f"Warning: HTTP notification failed for completed scan: {e}")


        return file_scores

    def _generate_file_results(self, scan_path: str, scanner_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        file_out = defaultdict(dict)
        
        # Get the base path for making relative paths
        if scan_path:
            base_path = Path(scan_path).resolve()
        else:
            base_path = Path.cwd()
        
        
        for scanner, result in scanner_results.items():
            if not isinstance(result, dict):
                print(f"Warning: Scanner {scanner} returned non-dict result")
                continue
                
            for file, details in result.items():
                # Convert absolute path to relative path
                try:
                    file_path = Path(file).resolve()
                    relative_path = file_path.relative_to(base_path)
                    file_key = str(relative_path)
                except (ValueError, OSError):
                    # If we can't make it relative, use the original path
                    file_key = file
                    
                if isinstance(details, dict):
                    file_out[file_key][scanner] = {}
                    file_out[file_key][scanner]['score'] = details.get('score', 0)
                    file_out[file_key][scanner]['raw'] = details.get('raw', [])
                    file_out[file_key][scanner]['errors'] = details.get('errors', [])
                else:
                    print(f"Warning: Invalid details format for {file} in {scanner}")
                    file_out[file_key][scanner] = {}
                    file_out[file_key][scanner]['score'] = 0
                    file_out[file_key][scanner]['raw'] = []
                    file_out[file_key][scanner]['errors'] = []

        return dict(file_out)

    def _generate_health_summary(self, scanner_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Generate overall health summary from all scanner results"""
        summary = {
            'overall_health_score': 0,
            'total_files_scanned': 0,
            'successful_scanners': 0,
            'failed_scanners': 0,
            'issues_found': {},
            'recommendations': []
        }
        
        successful_scanners = 0
        total_issues = 0
        
        for scanner_name, result in scanner_results.items():
            if result.get('success', False):
                successful_scanners += 1
                files_processed = result.get('files_processed', 0)
                summary['total_files_scanned'] = max(summary['total_files_scanned'], files_processed)
                
                # Extract issues based on scanner type
                if scanner_name == 'linter':
                    stats = result.get('summary_stats', {})
                    pylint_issues = stats.get('total_pylint_issues', 0)
                    flake8_issues = stats.get('total_flake8_issues', 0)
                    summary['issues_found'][scanner_name] = {
                        'pylint_issues': pylint_issues,
                        'flake8_issues': flake8_issues
                    }
                    total_issues += pylint_issues + flake8_issues
                    
                    if pylint_issues > 0 or flake8_issues > 0:
                        summary['recommendations'].append(
                            f"Address {pylint_issues + flake8_issues} linting issues to improve code quality"
                        )
            else:
                summary['failed_scanners'] += 1
        
        summary['successful_scanners'] = successful_scanners
        
        # Calculate basic health score (0-100)
        if summary['total_files_scanned'] > 0:
            issues_per_file = total_issues / summary['total_files_scanned']
            # Simple scoring: fewer issues = higher score
            summary['overall_health_score'] = max(0, 100 - (issues_per_file * 10))
        
        return summary
    
    def save_results(self, output_path: str, format: str = 'json'):
        """Save orchestrator results to file"""
        if format == 'json':
            with open(f"{output_path}.json", 'w') as f:
                json.dump(self.results, f, indent=2, default=str)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def print_summary(self, path: str):
        """Print a human-readable summary of scan results"""
        if path not in self.results:
            print(f"No results found for path: {path}")
            return
        
        results = self.results[path]
        metadata = results['scan_metadata']
        health = results['health_summary']
        
        print("\n" + "="*60)
        print(f"CODE HEALTH SCAN SUMMARY")
        print("="*60)
        print(f"Path: {metadata['path_scanned']}")
        print(f"Total scan time: {metadata['total_scan_time']:.2f}s")
        print(f"Files scanned: {health['total_files_scanned']}")
        print(f"Overall health score: {health['overall_health_score']:.1f}/100")
        print()
        
        print("Scanner Results:")
        for scanner_name, result in results['scanner_results'].items():
            status = "✓" if result.get('success') else "✗"
            time_taken = result.get('total_time', 0)
            print(f"  {status} {scanner_name}: {time_taken:.2f}s")
        
        if health['issues_found']:
            print("\nIssues Found:")
            for scanner, issues in health['issues_found'].items():
                print(f"  {scanner}: {issues}")
        
        if health['recommendations']:
            print("\nRecommendations:")
            for i, rec in enumerate(health['recommendations'], 1):
                print(f"  {i}. {rec}")
        
        print("="*60)

# Example usage
def main():
    parser = argparse.ArgumentParser(description="Codebase Scanner")
    parser.add_argument("--scan_id", help="ID of the scanner to use")
    parser.add_argument("--scan_path", help="Path of the codebase to scan")
    args = parser.parse_args()
    # Create orchestrator
    orchestrator = ScanOrchestrator(max_concurrent_scanners=2, scan_id=args.scan_id)


    # Register scanners
    orchestrator.register_scanner(Linter(max_workers=4), 'health')
    orchestrator.register_scanner(Secrets(max_workers=4), 'security')
    orchestrator.register_scanner(Todos(max_workers=4), 'knowledge')

    # Add more scanners as they're implemented
    # orchestrator.register_scanner(ComplexityScanner())
    # orchestrator.register_scanner(SecurityScanner())

    # Run comprehensive scan
    results = orchestrator.scan_codebase(args.scan_path)
    # results = orchestrator.scan_codebase('.')
    if results and results['scanner_results']:
        # Extract scan path from results metadata for relative path conversion
        scan_path_from_results = results['scan_metadata']['path_scanned']
        raw_scores = orchestrator.generate_scores(results['scanner_results'], scan_path_from_results)

if __name__ == "__main__":
    main()
