import { useExternalLinkCreator } from '@kong-ui-public/entities-shared'

export default (routeParams: string[]): string => {
  // TODO: may have to pass in geo from consuming app
  const activeGeoCode = 'us'

  const parsedRouteParams = routeParams.map(rp => rp.replace('{geo}', activeGeoCode))

  // TODO: replace `{idTuple0}` and `{idTuple1}` with actual record ID vales

  return useExternalLinkCreator(parsedRouteParams)
}
