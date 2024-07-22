// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const sni1 = {
  id: '1',
  name: 'tk-meowstersmith',
  tags: ['cats', 'cheeseburgers'],
  certificate: { id: '4' },
}

export const snis: FetcherRawResponse = {
  data: [
    sni1,
    {
      id: '2',
      name: 'sni-2',
      certificate: { id: '35f73e75-12e9-477b-98ba-9ac0b9d3d346' },
    },
  ],
  total: 2,
}

export const snis100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `sni-${i + 1}`,
    certificate: { id: `35f73e75-12e9-477b-98ba-9ac0b9d3d${i + 1}` },
  }))

export const paginate = (
  snis: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = snis.slice(_offset, _offset + size)
  const offset =
    _offset + size < snis.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

export const certificates = {
  data: Array(10).fill(null)
    .map((_, i) => ({
      id: `${i + 1}`,
      name: `certificate-${i + 1}`,
      cert: '-----BEGIN CERTIFICATE-----\nMIIDlTCCAn2gAwIBAgIJALNvkt/BzN3UMA0GCSqGSIb3DQEBCwUAMBwxCzAJBgNV\nBAYTAlVTMQ0wCwYDVQQDDARLb25nMB4XDTIyMDkzMDA5MzUyMloXDTMyMDkyNzA5\nMzUyMlowHDELMAkGA1UEBhMCVVMxDTALBgNVBAMMBEtvbmcwggEiMA0GCSqGSIb3\nDQEBAQUAA4IBDwAwggEKAoIBAQDs/uWET+YUMTDejC6GDN3UzfTyRE8t9pQ8X3kW\nMn2DOBnJQfK7XiCVi6Uv6cWRWKsb/ITHddRigKj5WPiRqrmYvtXvOZLqHj9OSjQa\nIJszh8wIR7mxJq//9Sq94NNzjMvUUvFoDHx1CzoDUdwhxr8J9aUIEo6AtEk6xr1l\n4yg80oEIA24kd/EVs76jYDTX4cejM0oOk0IQPsAZ10k4X/UZr3kVLAuTrgup4L15\nuyxebXeZY1SX3KdtOuBQzppaiWuR/Tk4oTLD2Htw/dcgOIjRpntz1gvFMX56xgNN\n1+0hr2d3D1LLTcRbCVHR+2avrpSvYbeCKwslPLedMsMlSaHbAgMBAAGjgdkwgdYw\nHQYDVR0OBBYEFCoj/IWxxUg0HaBuoimtzKdiya0cMEwGA1UdIwRFMEOAFCoj/IWx\nxUg0HaBuoimtzKdiya0coSCkHjAcMQswCQYDVQQGEwJVUzENMAsGA1UEAwwES29u\nZ4IJALNvkt/BzN3UMAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgL8MCUGA1UdEQQe\nMByCC2V4YW1wbGUuY29tgg0qLmV4YW1wbGUuY29tMCUGA1UdEgQeMByCC2V4YW1w\nbGUuY29tgg0qLmV4YW1wbGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQDK0G4ryd7o\nLgv/A09CvAXDrgZJcG+4gFMx9i0+DpocepvZyoJ4We2jyENa7kJFiwQsA2lgDsQP\nu34xtsu9nb5/t/faTpoz7CaRCkn2e/p0U9Ye58ZXCMxwInsdLx0OR8OlmrbxhojA\nfIt2Ne3QSdzD5/SNSPXRj5tq6bUMAO+qUEuuzQiYQPMqf+0hBuioRh6mbZIkisLx\nZpsDcAE/1yA9cB/xM3m+yxh5LCSeZ/z6HPrM7oM6YhRETnI4fhHzT/ceV8xHwbK3\n2TvxRXLDpMzPoKQmCdFhx3xTE4wHrvlJSWxNsz8gLA42UauoNtz0xafIwXybKd7Z\nu4v3sPhu0RJR\n-----END CERTIFICATE-----',
      tags: ['secure', 'cats', 'hamburgers'],
      metadata: {
        subject: 'CN=secure-foo-bar,O=konghq.org',
        expiry: '1986382755',
        san: ['example.com', 'www.example.com'],
      },
    })),
}
