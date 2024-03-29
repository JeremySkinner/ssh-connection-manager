#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

if [ "$1" == "" ]; then 
  NODE_NO_WARNINGS=1 node $DIR/src/app.js list
else 
   # node $DIR/src/app.js $@ 
   command ssh $@
fi 

# If the app created a connection file, load it and connect.
if [ -f "/tmp/new_ssh_connection" ]; then
  conn=$(</tmp/new_ssh_connection)
  rm /tmp/new_ssh_connection
  command ssh $conn
fi
