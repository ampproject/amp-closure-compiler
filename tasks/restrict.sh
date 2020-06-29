#!/usr/bin/env bash
# Restrict the usage of each optional dependency per OS
yarn workspaces run restrict "$@"
