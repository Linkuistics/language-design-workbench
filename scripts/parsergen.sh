#!/usr/bin/env zsh

CLI=src/gen0/cli/ldw.ts
REGISTRY=src/gen1/languages/registry.json

echo

echo "Using registry $REGISTRY"

for grammar in ldw::grammar::parsed  ; do
    echo "    Processing grammar $grammar"
    ts-node $CLI generate-parser -r $REGISTRY -n $grammar > parser.ts
    prettier --write parser.ts
done