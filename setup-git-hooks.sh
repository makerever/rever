#!/bin/bash

# Set up Git to use our custom hooks directory
git config core.hooksPath .githooks

echo "Git hooks have been set up successfully."
echo "The pre-commit hook will now run automatically when you commit changes."
