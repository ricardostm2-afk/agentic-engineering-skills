#!/usr/bin/env bash
set -eu
bash "$(dirname "$0")/../fixtures/make-repo.sh" branch change-leak "Look up orders by invoice reference"
