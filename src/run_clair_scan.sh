#!/bin/bash

set -e

CLAIR_URL=${CLAIR_URL:-"http://clair:6060"}

DEPLOYMENT_REPO_URL=${DEPLOYMENT_REPO_URL:-$1}
SOURCE_DIR=${SOURCE_DIR:-$2}
EXCLUDE_IMAGES=${EXCLUDE_IMAGES:-$3}

if [ -z "$DEPLOYMENT_REPO_URL" ] ; then
   echo "Problem with script, missing deployment repo parameter"
   exit 1
fi

if [ -z "$SOURCE_DIR" ] ; then
   echo "Problem with script, missing source dir parameter"
   exit 1
fi


LOCATION=$(pwd)

# clone the repo
CLONE_PATH="temp-git"
rm -rf $CLONE_PATH
git clone $DEPLOYMENT_REPO_URL $CLONE_PATH

cd $CLONE_PATH/$SOURCE_DIR
echo "changed dir to: $(pwd)"

# get latest rancher entry
# TODO - this has the potential to behave differently in the deployment env
old_version=$(grep version config.yml | awk 'BEGIN{FS="\""}{print $2}')
echo "old_version is: \"$old_version\""

last_compose_file=$(grep -l "$old_version" */docker-compose.yml)

if [ -z "$EXCLUDE_IMAGES" ]; then
   EXCLUDE_IMAGES="^( )*rancher/[^:]+$"
else
   EXCLUDE_IMAGES=$(sed 's/,/|/g' <<< $EXCLUDE_IMAGES)
   EXCLUDE_IMAGES=$(sed 's/ /|/g' <<< $EXCLUDE_IMAGES)
   EXCLUDE_IMAGES="^( )*rancher/[^:]+$|"$EXCLUDE_IMAGES
fi


echo "Found current docker-compose for $DEPLOYMENT_REPO_URL - $last_compose_file"
echo "Will extract images, with the following regex exclusions: '$EXCLUDE_IMAGES'"

all_images=$(grep '  image:' $last_compose_file |   cut -d: -f2,3  | sort | uniq  | grep -vE "$EXCLUDE_IMAGES" )

echo "Will start scanning the following images:"
echo "$all_images"

cd $LOCATION
rm -rf $CLONE_PATH


for image in $all_images; do
  docker pull $image
  TMPDIR=`pwd` clair-scanner --ip=`hostname` --clair=$CLAIR_URL -t=Critical --all=false  $image
  docker rmi $image || true
done

echo "Finished scanning"