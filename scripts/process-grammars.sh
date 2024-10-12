#!/usr/bin/env zsh

rm -rf src-gen1
cp -r src src-gen1

for grammar in src-gen1/languages/ldw/**/*.grammar ; do

    echo

    # json=${grammar%.grammar}.model
    # echo "Generating $json from $(basename $grammar)"
    # ts-node src/cli/ldw.ts grammar-to-json -i $grammar -o $json
    
    model=${grammar%.grammar}.model
    echo "Generating $model from $(basename $grammar)"
    ts-node src/cli/ldw.ts grammar-to-model -i $grammar -o $model

done