#! /bin/bash

# Concatenates all the JavaScript components into a single file
cd components
cat mathworkers_head.js \
	util.js \
	thread.js \
    vector.js \
    matrix.js \
    mathworkers_tail.js > ../mathworkers.js
cd ..