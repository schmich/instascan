#!/bin/bash

./prep_lib.sh
npm run bundle
mkdir -p ./bundle
mv ./docs/index_bundle.html ./bundle/index.html