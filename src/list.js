const SSHConfig = require('ssh-config');
const fs = require('fs');
const path = require('path');
const cliff = require('cliff');
const inquirer = require('inquirer');
const figures = require('figures');
const iswsl = require('is-wsl');

// figures' platform detection uses os.platform, which returns linux under WSL
// But if we're in WSL, then we need to use the Windows glyphs.
if (iswsl) {
  figures.pointer = '>';
}

const rowColours = ['yellow', 'yellow', 'yellow', 'yellow'];

function parseConfig() {
  var p = path.join(process.env.HOME, "/.ssh/config");
  var contents = fs.readFileSync(p, 'utf8');
  return SSHConfig.parse(contents);
}

function removeTempFile() {
  if(fs.existsSync("/tmp/new_ssh_connection")) {
    fs.unlinkSync("/tmp/new_ssh_connection");
  }
}

function createTempFile(hostname) {
  fs.writeFileSync("/tmp/new_ssh_connection", hostname);
}

module.exports = async function() {
  removeTempFile();

  var config = parseConfig();
  
  var computed = config
    // Get all entries except wildcards
    .filter(x => x.type == 1 && x.param == 'Host' && x.value != '*' && x.value.indexOf('?') === -1)
    .map(x => config.compute(x.value)) // compute merges wildcard entries and applies them to give us the final version
    .map((host, index) => {

      // Set user to blank if there isn't one
      if (!host.User) {
        host.User = '';
      }

      return host;
    });

  // Use cliff to nicely format the 3 columns with padding.
  // Split the options into an array that we can then pass to inquirer.
  var formatted = cliff.stringifyObjectRows(computed, ['Host', 'HostName', 'User'], rowColours)
    .split("\n");
  
  // Create the pairings of string output with the underlying option.
  var choices = formatted.map((output, i) => {
    let host = computed[i-1];
    return { value: host, name: output, short: host ? host.Host : "" }
  });

  var response = await inquirer.prompt([
    { type: 'list', name: 'selection', message: 'Select a connection:', choices: choices, pageSize: 100 
  }]);

  var foundHost = response.selection;
  
  if (!foundHost) return;

  var user = foundHost.User;
  var hostname = foundHost.Host;

  if (!user) {
    response = await inquirer.prompt([{ type: 'input', name: 'user', message: 'Enter a username:' }]);

    if(response.user) {
      user = response.user;
    }
  }

  if (user) {
    hostname = `${user}@${hostname}`;
  }

  // Can't figure out how to launch the ssh command directly in a sensible way.
  // Instead just write to a temp file, exit, and then let the bash script read it out and launch ssh.
  createTempFile(hostname);
}