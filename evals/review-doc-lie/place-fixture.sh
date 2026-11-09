#!/usr/bin/env bash
set -eu
bash "$(dirname "$0")/../fixtures/make-repo.sh" branch change-doc-lie "Rename orderTotalFor to totalForOrder"
