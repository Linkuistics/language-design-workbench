#!/usr/bin/env zsh

for model in src/languages-meta/**/*.model ; do
    echo "Processing $model => $model.ts"
    ts-node src/cli/ldw.ts model-to-types -l typescript -i $model -o $model.ts
    prettier -w $model.ts

    echo "Processing $model => $model.rs"
    ts-node src/cli/ldw.ts model-to-types -l rust -i $model -o $model.rs
    prettier -w $model.rs

    echo "Processing $model => $model.visitor.ts"
    ts-node src/cli/ldw.ts model-to-visitor -l typescript -i $model -o $model.visitor.ts
    prettier -w $model.visitor.ts
    echo
done