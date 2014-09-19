#! /bin/bash

# Concatenates all the JavaScript components into a single file
cat mathworkers_head.js \
    vector.js \
    mathworkers_tail.js > ../mathworkers.js
