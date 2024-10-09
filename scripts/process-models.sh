#!/usr/bin/env zsh

for model in src/languages-meta/**/*.model ; do
    echo "Processing $model => $model.ts"
    ts-node src/cli/ldw.ts model-to-types -i $model -o $model.ts
    prettier -w $model.ts
    echo
done