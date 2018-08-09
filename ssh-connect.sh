node src/app.js list

if [ -f "/tmp/new_ssh_connection" ]; then
   conn=$(</tmp/new_ssh_connection)
   command ssh $conn
fi