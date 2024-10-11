#!/usr/bin/env zsh

rm -rf next-src
cp -r src next-src

for grammar in next-src/languages-meta/**/*.grammar ; do

    echo

    # echo "Processing $grammar => $grammar.json"
    # ts-node src/cli/ldw.ts grammar-to-json -i $grammar -o $grammar.json

    model=${grammar%.grammar}.model
    
    echo "Generating $model from $(basename $grammar)"
    ts-node src/cli/ldw.ts grammar-to-model -i $grammar -o $model

done