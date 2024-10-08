#!/usr/bin/env zsh

for grammar in src/**/*.grammar ; do
    # echo "Processing $grammar => $grammar.json"
    # ts-node src/cli/ldw.ts grammar-to-json -i $dir/$model.grammar -o $dir/$model.grammar.json
    echo "Processing $grammar => $grammar.model"
    ts-node src/cli/ldw.ts grammar-to-model -i $grammar -o $grammar.model
    echo
done