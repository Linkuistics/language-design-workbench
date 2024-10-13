#!/usr/bin/env zsh

CLI=src/gen0/cli/ldw.ts
REGISTRY=src/gen1/language-registry.json

echo

echo "Deleting src/gen1"
rm -rf src/gen1

echo "Copying src/gen0 to src/gen1"
cp -r src/gen0 src/gen1

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