#!/usr/bin/env zsh

for model in src/**/*.model ; do
    echo "Processing $model => $model.ts"
    ts-node src/cli/ldw.ts model-to-types -i $model -o $model.ts
    echo
done