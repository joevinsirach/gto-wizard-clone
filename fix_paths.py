#!/usr/bin/env python3
"""Fix all hardcoded /tmp/gto-wizard-clone paths in the solver codebase."""
import os
import sys

REPO = "/workspace/gto-wizard-clone"

files_to_fix = []
for root, dirs, files in os.walk(os.path.join(REPO, "apps")):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path) as fh:
                content = fh.read()
            if "/tmp/gto-wizard-clone" in content:
                files_to_fix.append(path)

for root, dirs, files in os.walk(os.path.join(REPO, "packages")):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path) as fh:
                content = fh.read()
            if "/tmp/gto-wizard-clone" in content:
                files_to_fix.append(path)

print(f"Found {len(files_to_fix)} files with hardcoded paths:")
for f in files_to_fix:
    print(f"  {f[len(REPO)+1:]}")

total_fixes = 0
for filepath in files_to_fix:
    with open(filepath) as fh:
        content = fh.read()
    
    original = content
    
    # Pattern 1: Remove poker-core src path inserts (package is installed)
    content = content.replace(
        "sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src')",
        "# path removed — gto-poker is pip-installed"
    )
    content = content.replace(
        "sys.path.insert(0, '/tmp/gto-wizard-clone/packages/poker-core/src'  )",
        "# path removed — gto-poker is pip-installed"
    )
    
    # Pattern 2: Replace solver path inserts with dynamic relative path
    compute_path = "os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../..')"
    content = content.replace(
        "sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver')",
        f"sys.path.insert(0, {compute_path})"
    )
    content = content.replace(
        "sys.path.insert(0, '/tmp/gto-wizard-clone/apps/solver'  )",
        f"sys.path.insert(0, {compute_path})"
    )
    
    # Pattern 3: Other /tmp/gto-wizard paths (like start_server.py which is at root)
    # Replace the string literal with REPO
    content = content.replace(
        "'/tmp/gto-wizard-clone'",
        f"'{REPO}'"
    )
    content = content.replace(
        '"/tmp/gto-wizard-clone"',
        f'"{REPO}"'
    )
    
    # Ensure os is imported if needed
    if "import os" not in content and "os.path" in content and "/tmp/gto-wizard" in original:
        # Only add if we're sure os is needed
        pass  # os is usually imported already
    
    if content != original:
        with open(filepath, 'w') as fh:
            fh.write(content)
        total_fixes += 1
        print(f"  ✓ Fixed {filepath[len(REPO)+1:]}")
    
    # Check for remaining refs
    if "/tmp/gto-wizard-clone" in content:
        for i, line in enumerate(content.split('\n'), 1):
            if "/tmp/gto-wizard-clone" in line and "#" not in line:
                print(f"  ⚠ REMAINING in {filepath[len(REPO)+1:]}:{i}: {line.strip()[:80]}")

print(f"\nTotal files fixed: {total_fixes}")

# Final check
remaining = 0
for root, dirs, files in os.walk(REPO):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path) as fh:
                content = fh.read()
            if "/tmp/gto-wizard-clone" in content:
                remaining += 1
                print(f"  ⚠ REMAINING: {path[len(REPO)+1:]}")
print(f"\nFiles with remaining hardcoded paths: {remaining}")
