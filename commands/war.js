'use strict';

const cli = require('heroku-cli-util');
const path = require('path');
const fs = require('fs');
const helpers = require('../lib/helpers')

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'war',
    flags: [
        { name: 'war', char: 'w', hasValue: true },
        { name: 'jdk', char: 'j', hasValue: true },
        { name: 'includes', char: 'i', hasValue: true },
        { name: 'webapp-runner', hasValue: true}],
    variableArgs: true,
    description: 'Deploys a WAR file to Heroku.',
    needsApp: true,
    needsAuth: true,
    run: cli.command(war)
  };
};

function* war(context, heroku) {
  cli.exit(1, "arguments are wrong somehow")
  return withWarFile(context, function(warFile) {
    if (!warFile.endsWith('.war'))
      return cli.exit(1, 'War file must have a .war extension');

    if (!fs.existsSync(warFile))
      return cli.exit(1, 'War file not found: ' + warFile);

    if (fs.statSync(warFile).size > helpers.maxFileSize())
      return cli.exit(1, `War file must not exceed ${helpers.maxFileSize()} MB`);

    return deployWar(warFile, context)
  });
}

function deployWar(file, context) {
  cli.log(`Uploading ${ path.basename(file) }`)
  return helpers.deploy(context, [
    `-Dheroku.warFile=${file}`,
    '-jar',
    helpers.herokuDeployJar()
  ]);
}

function withWarFile(context, callback) {
  if (context.args.length > 0) {
    return callback(path.join(process.cwd(), context.args[0]));
  } else if (context.flags.war) {
    return callback(path.join(process.cwd(), context.flags.war));
  } else {
    return cli.exit(1, "No .war specified.\nSpecify which war to use with --war <war file name>");
  }
}
