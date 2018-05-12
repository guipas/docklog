#!/usr/bin/env node

const Docker = require('dockerode');
const docker = new Docker();
const stripAnsi = require('strip-ansi');

function dockerLog (containerName, ...logs) {
  logs.forEach(log => {
    const lines = stripAnsi(log.toString()).split(/[\r\n\f\u2029\u2028]/);
    lines.forEach(line => {
      if (line) {
        console.log(`[${containerName}] `, line);
      }
    });
  });
}

function infoLog (...logs) {
  console.log(`[info] `, ...logs);
}

async function logContainer (containerName, options = {}) {
  const container = docker.getContainer(containerName);
  infoLog(`Getting logs stream for *${containerName}* ...`);

  const logsStream = await container.logs({
    stdout: true,
    stderr: true,
    tail: options.tail ? parseInt(options.tail) : `all`,
    follow: options.follow === true,
    timestamps : options.timestamps === true,
  });

  infoLog(`Starting to log *${containerName}*`);

  if (options.follow !== true && typeof logsStream === `string`) {
    dockerLog(containerName, logsStream);
    infoLog(`End logging for ${containerName}`);
    return;
  }

  logsStream.setEncoding('utf8');

  logsStream.on(`data`, (data, err) => {
    if (err) { console.error(err); }
    dockerLog(containerName, data);
  });

  logsStream.on(`end`, () => {
    infoLog(`End logging for ${containerName}`);
  });

};


const program = require('commander');

program
  .version('1.0.0')
  .option('-f, --follow', 'Follow containers logs')
  .option('-t, --timestamps', 'Show timestamps')
  .option('--tail [lines]', 'Number of lines to show from the end of the logs')
  .parse(process.argv);

program.args.forEach(container => {
  logContainer(container, {
    follow : program.follow,
    timestamps : program.timestamps,
    tail : program.tail,
  });
});