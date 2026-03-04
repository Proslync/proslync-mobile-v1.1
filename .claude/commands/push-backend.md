# Push Backend

Push the backend code to the remote repository and fix any CI issues.

## Steps

1. Navigate to the backend repo at `/Users/sri/Pictures/status-backend/status.social`
2. Check `git status` for any uncommitted changes (staged, unstaged, and untracked files)
3. If there are changes:
   - Stage all relevant source files (do NOT stage `.env` or other secret files)
   - Create a descriptive commit summarizing the changes
   - Push to `origin develop`
4. If CI fails (e.g. format-check):
   - Set up node: `export PATH="/Users/sri/.nvm/versions/node/v24.12.0/bin:$PATH"`
   - Install deps if needed: `npm install` (from the backend repo)
   - Run the project's prettier to fix formatting: `./node_modules/.bin/prettier --write <failing-files>`
   - Verify with: `npx prettier --check "src/**/*.ts" "test/**/*.ts"`
   - Commit the fix and push again

## Important

- The backend repo is at `/Users/sri/Pictures/status-backend/status.social`
- Remote: `https://github.com/software-kiev/status.social.git`
- Branch: `develop`
- Always use the project's local prettier (via `./node_modules/.bin/prettier` or `npx`) — not a global install
- Never commit `.env` files (already in `.gitignore`)
- Node path: `/Users/sri/.nvm/versions/node/v24.12.0/bin`
