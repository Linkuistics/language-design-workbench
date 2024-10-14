#!/usr/bin/env zsh

CLI=src/gen1/cli/ldw.ts
REGISTRY=src/gen2/languages/registry.json

echo

echo "Deleting src/gen2"
rm -rf src/gen2

echo "Copying src/gen1 to src/gen2"
cp -r src/gen1 src/gen2

echo "Using registry $REGISTRY"

for grammar in ldw::grammar::parsed ldw::model::parsed ; do
    echo "    Processing grammar $grammar"
    ts-node $CLI process-grammar -r $REGISTRY -n $grammar
done

for model in \
    ldw::grammar::parsed ldw::grammar::extended ldw::grammar::typed \
    ldw::model::parsed ldw::model::resolved ldw::model::discriminated \
    ; do
    echo "    Processing model $model"
    ts-node $CLI process-model -l typescript -r $REGISTRY -n $model

done