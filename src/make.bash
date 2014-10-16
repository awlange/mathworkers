#! /bin/bash

# Concatenates all the JavaScript components into a single file
cd components
cat  mathworkers_head.js.txt \
  global.js \
  util.js \
  event_emitter.js \
  coordinator.js \
  mathworker.js \
  vector.js \
  matrix.js \
  batchoperation.js \
  mathworkers_tail.js.txt > ../mathworkers.js
rm -f .tmp
cd ..
