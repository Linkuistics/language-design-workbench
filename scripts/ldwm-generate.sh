#!/usr/bin/env bash

for i in ldwg ldwm sexpr json ; do
    ts-node src/cli/ldw.ts ldwg-to-ldwm -i src/languages/$i/$i.ldwg -o src/languages/$i/$i.ldwm
done