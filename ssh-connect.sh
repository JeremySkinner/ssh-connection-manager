DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

node $DIR/src/app.js list

if [ -f "/tmp/new_ssh_connection" ]; then
   conn=$(</tmp/new_ssh_connection)
   command ssh $conn
fi