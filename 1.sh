#!/bin/bash

# get the array of numbers for open PRs
openPrs=$(gh pr list --state open --json number|jq  'map(.number|tostring)' )

echo "open PRs: ${openPrs}"

# get the list of packages in the mono-repository in reverse order
packages=$(lerna ls --l --json|jq -r '.[].name'| tail -r|grep -v "swagger-ui-web-component"|grep -v "spec-renderer"|grep -v "entities-gateway-services"|grep -v "entities-consumers")

# loop trough the list of the packages
for pkgName in $(echo ${packages})
do
  echo ""
  echo "package: ${pkgName}"
  current=1
  # get the list of the "-pr." published version for the packages
  prVersions=($(npm view "${pkgName}" --json| jq -r '.versions' | grep '\-pr.'|tail -r|sed 's/[,\"]//g'))
  total="${#prVersions[@]}"
  for verToRemove in "${prVersions[@]}"
  do
    echo " "
    echo "$((current++))/${total}"
    # validate that the version doesn't belong to open PR
    prNumber=$(echo ${verToRemove} | sed 's/.*\-pr\.//g'| cut -d'.' -f 1)
    if [[ ! -z $(echo ${openPrs} | grep "\"${prNumber}\"") ]]; then
      echo "${pkgName}@${verToRemove} belongs to open PR, skip.."
      continue
    fi
    # remove dist tag if present
    echo "${pkgName}@${verToRemove}: remove dist tag"
    npm dist-tag rm "${pkgName}" "pr-${prNumber}" || true

    # deprecate and unpublish version, ignore error
    echo "*** deprecating: ${pkgName}@${verToRemove}"
    npm deprecate --force "${pkgName}@${verToRemove}" "Deprecated PR preview" || true

    echo "*** unpublishing: ${pkgName}@${verToRemove}"
    npm unpublish --force "${pkgName}@${verToRemove}" || true
  done
done
