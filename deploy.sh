#!/usr/bin/env bash
# Build and publish an isolated gh-pages checkout; the source checkout stays intact.
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(git config --local user.name)" != "imfangs" ]] || [[ "$(git config --local user.email)" != "mafangshuai@126.com" ]]; then
  echo 'Set the project-local personal Git identity before publishing.' >&2; exit 1
fi
if [[ "$(git remote get-url origin)" != *imfangs/dankoe* ]]; then echo 'Unexpected deployment repository.' >&2; exit 1; fi
npm run build
npm run validate
node -e "const s=require('./docs/.vitepress/dist/content-status.json');if(!s.complete)process.exit(1)"
DEPLOY_DIR=$(mktemp -d /tmp/dankoe-deploy.XXXXXX)
cleanup(){ git worktree remove --force "$DEPLOY_DIR" >/dev/null 2>&1 || true; }
trap cleanup EXIT
git fetch origin gh-pages >/dev/null 2>&1 || true
if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git worktree add --detach "$DEPLOY_DIR" origin/gh-pages
else
  git worktree add --detach "$DEPLOY_DIR" HEAD
  git -C "$DEPLOY_DIR" checkout --orphan gh-pages
fi
# Delete only tracked deployment files in the isolated worktree.
git -C "$DEPLOY_DIR" rm -r --ignore-unmatch . >/dev/null
cp -R docs/.vitepress/dist/. "$DEPLOY_DIR/"
git -C "$DEPLOY_DIR" add -A
if git -C "$DEPLOY_DIR" diff --cached --quiet; then echo 'Site unchanged'; exit 0; fi
git -C "$DEPLOY_DIR" commit -m "${1:-Publish complete Chinese reading site}"
git -C "$DEPLOY_DIR" push origin HEAD:gh-pages
