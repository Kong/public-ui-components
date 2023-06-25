#!/bin/bash

# get the array of numbers for open PRs
openPrs=$(gh pr list --state open --json number|jq  'map(.number|tostring)' )

# get the list of packages in the mono-repository in reverse order
packages=$(lerna ls --l --json|jq -r '.[].name'| tail -r)

# loop trough the list of the packages
for pkgName in $(echo ${packages})
do
  current=1
  # get the list of the "-pr." published version for the packages
  prVersions=($(npm view "${pkgName}" --json| jq -r '.versions' | grep '\-pr.'|tail -r|sed 's/[,\"]//g'))
  total="${#prVersions[@]}"
  echo "package: ${pkgName}: ${total}"
done
