const SSHConfig = require('ssh-config');
const fs = require('fs');
const path = require('path');
const cliff = require('cliff');
const readline = require('readline');

const rowColours = ['yellow', 'yellow', 'yellow', 'yellow'];

module.exports = function() {
  var p = path.join(process.env.HOME, "/.ssh/config");
  var contents = fs.readFileSync(p, 'utf8');
  var config = SSHConfig.parse(contents);

  var computed = config
    // Get all entries except wildcards
    .filter(x => x.type == 1 && x.param == 'Host' && x.value != '*' && x.value.indexOf('?') === -1)
    .map(x => config.compute(x.value)) // compute merges wildcard entries and applies them to give us the final version
    .map((host, index) => {

      // Set user to blank if there isn't one
      if (typeof host.User === undefined) {
        host.User = '';
      }

      // Add an index for display purposes
      host['#'] = index+1;

      return host;
    });

  // Only show specified properties.
  console.log(cliff.stringifyObjectRows(computed, ['#', 'Host', 'HostName', 'User'], rowColours));

}