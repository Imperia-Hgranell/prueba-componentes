#!/usr/bin/env node

// Removes non-printable characters from the build log.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const inputFile = path.join(projectRoot, 'build-log.txt');
const outputFile = path.join(projectRoot, 'build-clean.txt');

try {
  const raw = fs.readFileSync(inputFile, 'utf8');

  // Strip escape-based ANSI codes, then remove leftover sequences like "[96m".
  const withoutAnsi = raw
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\[[0-9;]*m/g, '');
  const cleaned = withoutAnsi.replace(/[^\t\n\r\x20-\x7E]/g, '');

  fs.writeFileSync(outputFile, cleaned, 'utf8');
  console.log(`Clean log written to ${path.relative(projectRoot, outputFile)}`);
} catch (error) {
  console.error(`Failed to clean build log: ${error.message}`);
  process.exitCode = 1;
}
