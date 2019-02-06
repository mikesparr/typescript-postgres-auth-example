#!/usr/bin/env bash

source .env

# add more index names as needed as database grows ({index}.mapping.json)
declare -a array=("events")
arraylength=${#array[@]}

echo "Adding ${arraylength} index mapping templates"
echo "Using database host ${ES_HOST}"

for i in ${array[@]}
do
  echo "Configuring index $i"
  curl -XPOST "${ES_HOST}/_template/${i}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data-binary "@deploy/database/${i}.mapping.json"
  echo ""
done

echo "Completed configuring mapping templates"
