const SSHConfig = require('ssh-config');
const fs = require('fs');
const path = require('path');
const cliff = require('cliff');
const inquirer = require('inquirer');

const rowColours = ['yellow', 'yellow', 'yellow', 'yellow'];

module.exports = async function() {
  if(fs.exists("/tmp/new_ssh_connection")) {
    fs.unlink("/tmp/new_ssh_connection");
  }

  var p = path.join(process.env.HOME, "/.ssh/config");
  var contents = fs.readFileSync(p, 'utf8');
  var config = SSHConfig.parse(contents);

  var computed = config
    // Get all entries except wildcards
    .filter(x => x.type == 1 && x.param == 'Host' && x.value != '*' && x.value.indexOf('?') === -1)
    .map(x => config.compute(x.value)) // compute merges wildcard entries and applies them to give us the final version
    .map((host, index) => {

      // Set user to blank if there isn't one
      if (!host.User) {
        host.User = '';
      }

      // Add an index for display purposes
      host['#'] = index+1;

      return host;
    });

  // Only show specified properties.
  console.log(cliff.stringifyObjectRows(computed, ['#', 'Host', 'HostName', 'User'], rowColours));
  console.log("\n");

  var response = await inquirer.prompt([{ type: 'input', name: 'selection', message: 'Enter a connection (or leave blank to cancel):' }]);

  if (!response.selection) return; //nothing selected.

  var foundHost = null;

  if(isNaN(response.selection)) {
    // User entered a string. Find the host with this name
    // Can't just use find with a function as the config defines its own find method.
    foundHost = computed.filter(x => x.Host == response.selection);
    foundHost = host.length ? host[0] : null;
  }
  else {
    foundHost = computed[response.selection-1];
  }

  if(foundHost) {
    var user = foundHost.User;
    var hostname = foundHost.Host;

    if (!user) {
      response = await inquirer.prompt([{ type: 'input', name: 'user', message: 'Enter a username:' }]);

      if(response.user) {
        user = response.user;
      }
    }

    if (user) {
      hostname = `${response.user}@${hostname}`;
    }

    // Can't figure out how to launch the ssh command directly in a sensible way.
    // Instead just write to a temp file and then let the bash script handle it.
    fs.writeFileSync("/tmp/new_ssh_connection", hostname);
  }
}