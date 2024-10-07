#!/usr/bin/env bash

for i in grammar model sexpr json ; do
    ts-node src/cli/ldw.ts grammar-to-json -i src/models/$i/$i.grammar -o src/models/$i/$i.grammar.json
    ts-node src/cli/ldw.ts grammar-to-model -i src/models/$i/$i.grammar -o src/models/$i/$i.grammar.model
done