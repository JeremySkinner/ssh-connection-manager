#!/usr/bin/env node
'use strict';

const program = require('commander');
const list = require('./list');

program
  .command('list')
  .alias('ls')
  .description('Lists all SSH connections')
  .action(function() { list(); });

program.parse(process.argv);