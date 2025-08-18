#!/usr/bin/env python3

from linter import Linter
from secrets_pii import Secrets
from orchestrator import ScanOrchestrator
from todo import Todos

def test_linter():
    print("Testing enhanced linter...")
    linter = Linter(max_workers=2)
    
    # Test linting on current directory
    linter.scan(".")

def test_secrets():
    print("\nTesting secrets scanner...")
    secrets_scanner = Secrets(max_workers=2)
    secrets_scanner.scan(".")

def test_todos():
    print("\nTesting TODOs scanner...")
    todos_scanner = Todos(max_workers=2)
    todos_scanner.scan(".")

def test_orchestrator():
    print("\nTesting orchestrator...")
    orchestrator = ScanOrchestrator(max_concurrent_scanners=1)
    orchestrator.register_scanner('linter', Linter(max_workers=2))
    orchestrator.register_scanner('secrets', Secrets(max_workers=2))
    
    # Run scan
    results = orchestrator.scan_codebase('./mlb_game_predictor')
    print(results)

def main():
    # test_linter()
    # test_secrets()
    # test_orchestrator()
    test_todos()

if __name__ == "__main__":
    main()
