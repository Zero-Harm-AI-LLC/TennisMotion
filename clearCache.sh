#!/bin/bash
watchman watch-del-all
rm -f package-lock.json
rm -rf node_modules
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
npm cache clean --force
npm install
cd ios
pod deintegrate
pod install
