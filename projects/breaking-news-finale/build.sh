#!/bin/bash

# Install dependencies
npm install --legacy-peer-deps

# Install sass packages explicitly
npm install sass node-sass --legacy-peer-deps

# Install openai package explicitly
npm install openai@4.28.0 --legacy-peer-deps

# Run the build
npm run build 