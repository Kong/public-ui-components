 #!/bin/bash

        lernaCommand="changed"
#          if [[ "${{ steps.lock-changed.outputs.any_changed }}" == "true" ]]; then
            lernaCommand="ls"
#          fi

          echo "lernaCommand: ${lernaCommand}"

          filter=""
          specPackages=""
          for pkgFolder in $(lerna ${lernaCommand} --l --json|jq -r '.[].location')
          do
            pkgFolder="${pkgFolder/$(pwd)\//}"
            echo "pkgFolder=${pkgFolder}"
            filter="${filter}${pkgFolder}|"
            findRes=$(find "${pkgFolder}" -name "*.cy.ts" || true)
            if [[ -n "${findRes}" ]]; then
                specPackages="${specPackages}${pkgFolder},"
            fi


          done
          filter=$(echo "${filter}" | sed 's/|$//')
          specPackages=$(echo "${specPackages}" | sed 's/,$//')
          echo "filter=${filter}"
          echo "specPackages=${specPackages}"

