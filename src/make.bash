#! /bin/bash

# Concatenates all the JavaScript components into a single file
cd components
echo "//Built: `date`" > .tmp
cat .tmp \
  mathworkers_head.js \
  logger.js \
  util.js \
  event_emitter.js \
  pool.js \
  coordinator.js \
  mathworker.js \
  vector.js \
  matrix.js \
  mathworkers_tail.js > ../mathworkers.js
rm -f .tmp
cd ..
