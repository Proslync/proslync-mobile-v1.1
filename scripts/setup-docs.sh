#!/bin/bash
# Sets up the docs/ symlink to the Obsidian vault.
# Runs automatically on npm install (postinstall hook).
#
# If you don't use Obsidian, docs/ won't exist but CLAUDE.md
# still has all the key conventions inline — Claude works fine without it.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_LINK="$REPO_ROOT/docs"

# Already set up correctly
if [ -L "$DOCS_LINK" ] && [ -d "$DOCS_LINK" ]; then
  exit 0
fi

# If docs/ is a real directory (not a symlink), leave it alone
if [ -d "$DOCS_LINK" ] && [ ! -L "$DOCS_LINK" ]; then
  exit 0
fi

# Check for Obsidian vault at common locations
VAULT_PATHS=(
  "$HOME/Documents/Obsidian/Status App"
  "$HOME/Obsidian/Status App"
  "$HOME/obsidian/Status App"
  "$HOME/Documents/Status App"
)

for VAULT in "${VAULT_PATHS[@]}"; do
  if [ -d "$VAULT" ]; then
    ln -sf "$VAULT" "$DOCS_LINK"
    echo "docs/ → $VAULT"
    exit 0
  fi
done

# Check OBSIDIAN_VAULT env var
if [ -n "$OBSIDIAN_VAULT" ] && [ -d "$OBSIDIAN_VAULT" ]; then
  ln -sf "$OBSIDIAN_VAULT" "$DOCS_LINK"
  echo "docs/ → $OBSIDIAN_VAULT"
  exit 0
fi

# No vault found — that's fine, CLAUDE.md works without docs/
echo "No Obsidian vault found. To enable docs/:"
echo "  ln -s /path/to/your/Obsidian/Status\\ App docs"
echo "  # or set OBSIDIAN_VAULT=/path/to/vault"
