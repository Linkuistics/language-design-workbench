#!/usr/bin/env zsh

for model in src-gen1/languages/ldw/**/*.model ; do

    dir=$(dirname $model)/$(basename $model .model)

    echo

    echo "Generating $dir/model.ts"
    ts-node src/cli/ldw.ts model-to-types -l typescript -i $model -o $dir/model.ts
    prettier -w $dir/model.ts

    echo "Generating $dir/model.rs"
    ts-node src/cli/ldw.ts model-to-types -l rust -i $model -o $dir/model.rs
    rustfmt $dir/model.rs

    echo "Generating $dir/visitor.ts"
    ts-node src/cli/ldw.ts model-to-visitor -l typescript -i $model -o $dir/visitor.ts
    prettier -w $dir/visitor.ts

    echo "Generating $dir/visitor.rs"
    ts-node src/cli/ldw.ts model-to-visitor -l rust -i $model -o $dir/visitor.rs
    rustfmt $dir/visitor.rs

    echo "Generating $dir/transformer.ts"
    ts-node src/cli/ldw.ts model-to-transformer -l typescript -i $model -o $dir/transformer.ts
    prettier -w $dir/transformer.ts

    echo "Generating $dir/transformer.rs"
    ts-node src/cli/ldw.ts model-to-transformer -l rust -i $model -o $dir/transformer.rs
    rustfmt $dir/transformer.rs

done