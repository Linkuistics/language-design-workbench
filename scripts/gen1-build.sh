#!/usr/bin/env zsh

CL=ts-node src/gen0/cli/ldw.ts
REGISTRY=src/gen0/language-registry.json

for grammar in ldw::grammar::parsed ldw::model::parsed ; do

    echo

    echo "Generating ldw.grammar.json for $grammar using registry $REGISTRY"
    $CLI grammar-to-json -r $REGISTRY -n $grammar
    
    echo "Generating ldw.model for $grammar using registry $REGISTRY"
    $CLI grammar-to-model -r $REGISTRY -n $grammar

done

for model in ldw::grammar::parser ldw::grammar::extended ldw::grammar::typed ldw::model::parsed ; do

    echo

    echo "Generating model.ts for $model using registry $REGISTRY"
    $CLI model-to-types -l typescript -r $REGISTRY -n $model

    echo "Generating visitor.ts for $model using registry $REGISTRY"
    $CLI model-to-visitor -l typescript -r $REGISTRY -n $model

    echo "Generating transformer.ts for $model using registry $REGISTRY"
    $CLI model-to-transformer -l typescript -r $REGISTRY -n $model

done