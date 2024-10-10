#!/usr/bin/env zsh

for model in next-src/languages-meta/**/*.model ; do

    dir=$(dirname $model)

    echo "Processing $model => $dir/model.ts"
    ts-node src/cli/ldw.ts model-to-types -l typescript -i $model -o $dir/model.ts
    prettier -w $dir/model.ts

    echo "Processing $model => $dir/model.rs"
    ts-node src/cli/ldw.ts model-to-types -l rust -i $model -o $dir/model.rs
    rustfmt $dir/model.rs

    echo "Processing $model => $dir/visitor.ts"
    ts-node src/cli/ldw.ts model-to-visitor -i $model -o $dir/visitor.ts
    prettier -w $dir/visitor.ts

    echo

done