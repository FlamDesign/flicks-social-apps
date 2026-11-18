#!/usr/bin/env bash
# Run after adding or removing media: lists the files the prototype may load.
cd "$(dirname "$0")" && ls | grep -Ev '^(manifest\.json|build-manifest\.sh)$' | python3 -c "import sys,json;print(json.dumps(sorted(l.strip() for l in sys.stdin if l.strip())))" > manifest.json
