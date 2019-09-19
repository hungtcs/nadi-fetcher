#!/usr/bin/env bash

echo "start upload..."

cd ./data
git add --all
git commit -m "update at $(date "+%D %R")";
git push origin master