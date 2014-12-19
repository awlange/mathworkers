#!/bin/bash

# Concatenates all the JavaScript components into a single file
cat \
  core/mathworkers_head.js.txt \
  core/global.js \
  core/util.js \
  core/communication.js \
  core/event_emitter.js \
  core/coordinator.js \
  core/mathworker.js \
  core/vector.js \
  core/vector_worker.js \
  core/matrix.js \
  core/matrix_worker.js \
  core/batch.js \
  statistics/basic_statistics.js \
  core/mathworkers_tail.js.txt \
  > ../lib/mathworkers.js

# Run JSdoc if available
if type jsdoc > /dev/null 2>&1; then
  jsdoc -d ../doc ../lib/mathworkers.js ../doc/README_small.md
fi
