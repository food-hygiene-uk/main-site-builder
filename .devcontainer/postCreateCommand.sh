#!/usr/bin/env bash

deno cache src/generate-site.mts
sudo chown -R node:node /home/node/.gemini
