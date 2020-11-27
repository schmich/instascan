#!/bin/bash

mkdir -p ./docs/lib
wget https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/3.3.3/adapter.min.js -O ./docs/lib/adapter.min.js
wget https://cdnjs.cloudflare.com/ajax/libs/vue/2.1.10/vue.min.js -O ./docs/lib/vue.min.js
wget https://rawgit.com/schmich/instascan-builds/master/instascan.min.js -O ./docs/lib/instascan.min.js

