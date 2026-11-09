#!/usr/bin/env bash
set -eu
bash "$(dirname "$0")/../fixtures/make-repo.sh" fix bug-sort "orders-api"
