#!/usr/bin/env bash
# Builds the orders-api fixture as a git repository in the current (empty) directory.
#   make-repo.sh fix <overlay> <message>     main = base + overlay in one commit: the defect is already there
#   make-repo.sh branch <overlay> <message>  main = base; branch <overlay> = one commit with the change, checked out
# Overlays live next to this file in orders-api/<overlay>/ and hold only the files they change.
set -eu
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/orders-api"
mode="${1:?mode: fix | branch}"
overlay="${2:?overlay name}"
message="${3:-orders-api}"
[ -d "$here/$overlay" ] || { echo "no such overlay: $overlay" >&2; exit 2; }
commit() { git -c user.name=eval -c user.email=eval@example.invalid commit -q -m "$1"; }

git init -q -b main
cp -R "$here/base/." .
case "$mode" in
  fix)
    cp -R "$here/$overlay/." .
    git add -A
    commit "$message"
    ;;
  branch)
    git add -A
    commit "orders-api"
    git checkout -q -b "$overlay"
    cp -R "$here/$overlay/." .
    git add -A
    commit "$message"
    ;;
  *) echo "unknown mode: $mode" >&2; exit 2 ;;
esac
