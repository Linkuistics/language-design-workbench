#!/usr/bin/env bash

for i in ldwg ldwm sexpr json ; do
    node dist/cli/ldw.js ldwg-to-ldwm -i src/languages/$i/$i.ldwg -o src/languages/$i/$i.ldwm
done