#!/bin/bash
watchman watch-del-all
rm -rf node_modules
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
npm cache clean --force
npm install
npx react-native start --reset-cache

