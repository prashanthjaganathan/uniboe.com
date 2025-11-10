#!/bin/bash
# Wrapper script for prettier pre-commit hook
# Strips 'frontend/' prefix from file paths and runs prettier in frontend directory

cd frontend || exit 1

# Process each file argument
for file in "$@"; do
  # Remove 'frontend/' prefix if present
  relative_file="${file#frontend/}"
  npx prettier --write "$relative_file"
done
