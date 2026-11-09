#!/usr/bin/env bash
# Creates only files and Git state; no project config is assumed auto-loaded by the eval host.
set -eu
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$here/workflow/." .
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -q -m "workflow fixture"
