import type { useUrlValidators } from 'src/types'
import composables from '../composables'

// Call the function to allow exporting the singleton
const { validateHost, validatePort, validateProtocol, validatePath } = composables.useUrlValidators()

// Alias the export to a callable function
const useUrlValidator = ():useUrlValidators => (<useUrlValidators>{
  validateHost,
  validatePort,
  validateProtocol,
  validatePath,
})

export {
  useUrlValidator,
}
