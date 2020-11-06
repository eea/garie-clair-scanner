#!/bin/sh
set -e


if [ -n "$CONFIG" ]; then
        echo "Found configuration variable, will write it to the /usr/src/garie-plugin/config.json"
        echo "$CONFIG" > /usr/src/garie-plugin/config.json
fi

# Initialize dockerd
echo "Starting dockerd"
/usr/bin/dumb-init /usr/local/bin/dockerd
echo "Started dockerd"

exec "$@"
