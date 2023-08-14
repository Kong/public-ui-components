// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const certificateVaultRef = '{vault://some-vault/cert-1}'

export const certificate1 = {
  id: '1',
  name: 'certificate-1',
  cert: '-----BEGIN CERTIFICATE-----\nMIID0DCCArigAwIBAgIBATANBgkqhkiG9w0BAQUFADB/MQswCQYDVQQGEwJGUjET\nMBEGA1UECAwKU29tZS1TdGF0ZTEOMAwGA1UEBwwFUGFyaXMxDTALBgNVBAoMBERp\nbWkxDTALBgNVBAsMBE5TQlUxEDAOBgNVBAMMB0RpbWkgQ0ExGzAZBgkqhkiG9w0B\nCQEWDGRpbWlAZGltaS5mcjAeFw0xNDAxMjgyMDM2NTVaFw0yNDAxMjYyMDM2NTVa\nMFsxCzAJBgNVBAYTAkZSMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJ\nbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQxFDASBgNVBAMMC3d3dy5kaW1pLmZyMIIB\nIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvpnaPKLIKdvx98KW68lz8pGa\nRRcYersNGqPjpifMVjjE8LuCoXgPU0HePnNTUjpShBnynKCvrtWhN+haKbSp+QWX\nSxiTrW99HBfAl1MDQyWcukoEb9Cw6INctVUN4iRvkn9T8E6q174RbcnwA/7yTc7p\n1NCvw+6B/aAN9l1G2pQXgRdYC/+G6o1IZEHtWhqzE97nY5QKNuUVD0V09dc5CDYB\naKjqetwwv6DFk/GRdOSEd/6bW+20z0qSHpa3YNW6qSp+x5pyYmDrzRIR03os6Dau\nZkChSRyc/Whvurx6o85D6qpzywo8xwNaLZHxTQPgcIA5su9ZIytv9LH2E+lSwwID\nAQABo3sweTAJBgNVHRMEAjAAMCwGCWCGSAGG+EIBDQQfFh1PcGVuU1NMIEdlbmVy\nYXRlZCBDZXJ0aWZpY2F0ZTAdBgNVHQ4EFgQU+tugFtyN+cXe1wxUqeA7X+yS3bgw\nHwYDVR0jBBgwFoAUhMwqkbBrGp87HxfvwgPnlGgVR64wDQYJKoZIhvcNAQEFBQAD\nggEBAIEEmqqhEzeXZ4CKhE5UM9vCKzkj5Iv9TFs/a9CcQuepzplt7YVmevBFNOc0\n+1ZyR4tXgi4+5MHGzhYCIVvHo4hKqYm+J+o5mwQInf1qoAHuO7CLD3WNa1sKcVUV\nvepIxc/1aHZrG+dPeEHt0MdFfOw13YdUc2FH6AqEdcEL4aV5PXq2eYR8hR4zKbc1\nfBtuqUsvA8NWSIyzQ16fyGve+ANf6vXvUizyvwDrPRv/kfvLNa3ZPnLMMxU98Mvh\nPXy3PkB8++6U4Y3vdk2Ni2WYYlIls8yqbM4327IKmkDc2TimS8u60CT47mKU7aDY\ncbTV5RDkrlaYwm5yqlTIglvCv7o=\n-----END CERTIFICATE-----',
  key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAvpnaPKLIKdvx98KW68lz8pGaRRcYersNGqPjpifMVjjE8LuC\noXgPU0HePnNTUjpShBnynKCvrtWhN+haKbSp+QWXSxiTrW99HBfAl1MDQyWcukoE\nb9Cw6INctVUN4iRvkn9T8E6q174RbcnwA/7yTc7p1NCvw+6B/aAN9l1G2pQXgRdY\nC/+G6o1IZEHtWhqzE97nY5QKNuUVD0V09dc5CDYBaKjqetwwv6DFk/GRdOSEd/6b\nW+20z0qSHpa3YNW6qSp+x5pyYmDrzRIR03os6DauZkChSRyc/Whvurx6o85D6qpz\nywo8xwNaLZHxTQPgcIA5su9ZIytv9LH2E+lSwwIDAQABAoIBAFml8cD9a5pMqlW3\nf9btTQz1sRL4Fvp7CmHSXhvjsjeHwhHckEe0ObkWTRsgkTsm1XLu5W8IITnhn0+1\niNr+78eB+rRGngdAXh8diOdkEy+8/Cee8tFI3jyutKdRlxMbwiKsouVviumoq3fx\nOGQYwQ0Z2l/PvCwy/Y82ffq3ysC5gAJsbBYsCrg14bQo44ulrELe4SDWs5HCjKYb\nEI2b8cOMucqZSOtxg9niLN/je2bo/I2HGSawibgcOdBms8k6TvsSrZMr3kJ5O6J+\n77LGwKH37brVgbVYvbq6nWPL0xLG7dUv+7LWEo5qQaPy6aXb/zbckqLqu6/EjOVe\nydG5JQECgYEA9kKfTZD/WEVAreA0dzfeJRu8vlnwoagL7cJaoDxqXos4mcr5mPDT\nkbWgFkLFFH/AyUnPBlK6BcJp1XK67B13ETUa3i9Q5t1WuZEobiKKBLFm9DDQJt43\nuKZWJxBKFGSvFrYPtGZst719mZVcPct2CzPjEgN3Hlpt6fyw3eOrnoECgYEAxiOu\njwXCOmuGaB7+OW2tR0PGEzbvVlEGdkAJ6TC/HoKM1A8r2u4hLTEJJCrLLTfw++4I\nddHE2dLeR4Q7O58SfLphwgPmLDezN7WRLGr7Vyfuv7VmaHjGuC3Gv9agnhWDlA2Q\ngBG9/R9oVfL0Dc7CgJgLeUtItCYC31bGT3yhV0MCgYEA4k3DG4L+RN4PXDpHvK9I\npA1jXAJHEifeHnaW1d3vWkbSkvJmgVf+9U5VeV+OwRHN1qzPZV4suRI6M/8lK8rA\nGr4UnM4aqK4K/qkY4G05LKrik9Ev2CgqSLQDRA7CJQ+Jn3Nb50qg6hFnFPafN+J7\t\t\n7juWln08wFYV4Atpdd+9XQECgYBxizkZFL+9IqkfOcONvWAzGo+Dq1N0L3J4iTIk\nw56CKWXyj88d4qB4eUU3yJ4uB4S9miaW/eLEwKZIbWpUPFAn0db7i6h3ZmP5ZL8Q\nqS3nQCb9DULmU2/tU641eRUKAmIoka1g9sndKAZuWo+o6fdkIb1RgObk9XNn8R4r\npsv+aQKBgB+CIcExR30vycv5bnZN9EFlIXNKaeMJUrYCXcRQNvrnUIUBvAO8+jAe\nCdLygS5RtgOLZib0IVErqWsP3EI1ACGuLts0vQ9GFLQGaN1SaMS40C9kvns1mlDu\nLhIhYpJ8UsCVt5snWo2N+M+6ANh5tpWdQnEK6zILh4tRbuzaiHgb\n-----END RSA PRIVATE KEY-----',
  tags: ['test'],
  metadata: {
    subject: 'CN=secure-foo-bar,O=konghq.org',
    expiry: '1986382755',
    san: ['example.com', 'www.example.com'],
  },
}

export const certificate3 = {
  id: '3',
  cert: certificateVaultRef,
  name: 'certificate-3',
  tags: ['test', 'prod', 'vault'],
}

export const certificate: FetcherRawResponse = {
  data: [
    certificate1,
    {
      id: '2',
      cert: '-----BEGIN CERTIFICATE-----\nMIIDlTCCAn2gAwIBAgIJALNvkt/BzN3UMA0GCSqGSIb3DQEBCwUAMBwxCzAJBgNV\nBAYTAlVTMQ0wCwYDVQQDDARLb25nMB4XDTIyMDkzMDA5MzUyMloXDTMyMDkyNzA5\nMzUyMlowHDELMAkGA1UEBhMCVVMxDTALBgNVBAMMBEtvbmcwggEiMA0GCSqGSIb3\nDQEBAQUAA4IBDwAwggEKAoIBAQDs/uWET+YUMTDejC6GDN3UzfTyRE8t9pQ8X3kW\nMn2DOBnJQfK7XiCVi6Uv6cWRWKsb/ITHddRigKj5WPiRqrmYvtXvOZLqHj9OSjQa\nIJszh8wIR7mxJq//9Sq94NNzjMvUUvFoDHx1CzoDUdwhxr8J9aUIEo6AtEk6xr1l\n4yg80oEIA24kd/EVs76jYDTX4cejM0oOk0IQPsAZ10k4X/UZr3kVLAuTrgup4L15\nuyxebXeZY1SX3KdtOuBQzppaiWuR/Tk4oTLD2Htw/dcgOIjRpntz1gvFMX56xgNN\n1+0hr2d3D1LLTcRbCVHR+2avrpSvYbeCKwslPLedMsMlSaHbAgMBAAGjgdkwgdYw\nHQYDVR0OBBYEFCoj/IWxxUg0HaBuoimtzKdiya0cMEwGA1UdIwRFMEOAFCoj/IWx\nxUg0HaBuoimtzKdiya0coSCkHjAcMQswCQYDVQQGEwJVUzENMAsGA1UEAwwES29u\nZ4IJALNvkt/BzN3UMAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgL8MCUGA1UdEQQe\nMByCC2V4YW1wbGUuY29tgg0qLmV4YW1wbGUuY29tMCUGA1UdEgQeMByCC2V4YW1w\nbGUuY29tgg0qLmV4YW1wbGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQDK0G4ryd7o\nLgv/A09CvAXDrgZJcG+4gFMx9i0+DpocepvZyoJ4We2jyENa7kJFiwQsA2lgDsQP\nu34xtsu9nb5/t/faTpoz7CaRCkn2e/p0U9Ye58ZXCMxwInsdLx0OR8OlmrbxhojA\nfIt2Ne3QSdzD5/SNSPXRj5tq6bUMAO+qUEuuzQiYQPMqf+0hBuioRh6mbZIkisLx\nZpsDcAE/1yA9cB/xM3m+yxh5LCSeZ/z6HPrM7oM6YhRETnI4fhHzT/ceV8xHwbK3\n2TvxRXLDpMzPoKQmCdFhx3xTE4wHrvlJSWxNsz8gLA42UauoNtz0xafIwXybKd7Z\nu4v3sPhu0RJR\n-----END CERTIFICATE-----',
      name: 'certificate-2',
      tags: ['test', 'prod'],
      metadata: {
        subject: 'CN=example.com',
        expiry: '1576704480',
        san: '',
      },
    },
    certificate3,
  ],
  total: 3,
}

export const certificate100: any[] = Array(100)
  .fill(null)
  .map((_, i) => {
    if (i === 0) {
      return certificate1
    } else if (i === 2) {
      return certificate3
    }

    return {
      id: `${i + 1}`,
      name: `certificate-${i + 1}`,
      tags: ['dev', 'prod'],
      cert: '-----BEGIN CERTIFICATE-----\nMIIDlTCCAn2gAwIBAgIJALNvkt/BzN3UMA0GCSqGSIb3DQEBCwUAMBwxCzAJBgNV\nBAYTAlVTMQ0wCwYDVQQDDARLb25nMB4XDTIyMDkzMDA5MzUyMloXDTMyMDkyNzA5\nMzUyMlowHDELMAkGA1UEBhMCVVMxDTALBgNVBAMMBEtvbmcwggEiMA0GCSqGSIb3\nDQEBAQUAA4IBDwAwggEKAoIBAQDs/uWET+YUMTDejC6GDN3UzfTyRE8t9pQ8X3kW\nMn2DOBnJQfK7XiCVi6Uv6cWRWKsb/ITHddRigKj5WPiRqrmYvtXvOZLqHj9OSjQa\nIJszh8wIR7mxJq//9Sq94NNzjMvUUvFoDHx1CzoDUdwhxr8J9aUIEo6AtEk6xr1l\n4yg80oEIA24kd/EVs76jYDTX4cejM0oOk0IQPsAZ10k4X/UZr3kVLAuTrgup4L15\nuyxebXeZY1SX3KdtOuBQzppaiWuR/Tk4oTLD2Htw/dcgOIjRpntz1gvFMX56xgNN\n1+0hr2d3D1LLTcRbCVHR+2avrpSvYbeCKwslPLedMsMlSaHbAgMBAAGjgdkwgdYw\nHQYDVR0OBBYEFCoj/IWxxUg0HaBuoimtzKdiya0cMEwGA1UdIwRFMEOAFCoj/IWx\nxUg0HaBuoimtzKdiya0coSCkHjAcMQswCQYDVQQGEwJVUzENMAsGA1UEAwwES29u\nZ4IJALNvkt/BzN3UMAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgL8MCUGA1UdEQQe\nMByCC2V4YW1wbGUuY29tgg0qLmV4YW1wbGUuY29tMCUGA1UdEgQeMByCC2V4YW1w\nbGUuY29tgg0qLmV4YW1wbGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQDK0G4ryd7o\nLgv/A09CvAXDrgZJcG+4gFMx9i0+DpocepvZyoJ4We2jyENa7kJFiwQsA2lgDsQP\nu34xtsu9nb5/t/faTpoz7CaRCkn2e/p0U9Ye58ZXCMxwInsdLx0OR8OlmrbxhojA\nfIt2Ne3QSdzD5/SNSPXRj5tq6bUMAO+qUEuuzQiYQPMqf+0hBuioRh6mbZIkisLx\nZpsDcAE/1yA9cB/xM3m+yxh5LCSeZ/z6HPrM7oM6YhRETnI4fhHzT/ceV8xHwbK3\n2TvxRXLDpMzPoKQmCdFhx3xTE4wHrvlJSWxNsz8gLA42UauoNtz0xafIwXybKd7Z\nu4v3sPhu0RJR\n-----END CERTIFICATE-----',
      metadata: {
        subject: `certificate-${i + 1}`,
        expiry: `${i + 1}`,
        san: [`${i + 1}.example.com`],
      },
    }
  })

export const caCertificate1 = {
  id: '1',
  cert: '-----BEGIN CERTIFICATE-----\nMIIFoTCCA4mgAwIBAgIUQDBLwIychoRbVRO44IzBBk9R4oYwDQYJKoZIhvcNAQEL\nBQAwWDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFTATBgNVBAoM\nDEtvbmcgVGVzdGluZzEdMBsGA1UEAwwUS29uZyBUZXN0aW5nIFJvb3QgQ0EwHhcN\nMTkwNTAyMTkzNDQyWhcNMzkwNDI3MTkzNDQyWjBYMQswCQYDVQQGEwJVUzETMBEG\nA1UECAwKQ2FsaWZvcm5pYTEVMBMGA1UECgwMS29uZyBUZXN0aW5nMR0wGwYDVQQD\nDBRLb25nIFRlc3RpbmcgUm9vdCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCC\nAgoCggIBAMp6IggUp3aSNRbLAac8oOkrbUnFuxtlKGYgg8vfA2UU71qTktigdwO6\nKod0/M+daO3RDqJJXQL2rD14NDO3MaextICanoQSEe+nYyMFUIk+QplXLD3fbshU\nnHoJcMS2w0x4cm1os4ebxR2Evndo6luz39ivcjau+BL+9iBAYL1g6+eGOjcSy7ft\n1nAMvbxcQ7dmbAH2KP6OmF8cok+eQWVqXEjqtVx5GDMDlj1BjX6Kulmh/vhNi3Hr\nNEi+kPrw/YtRgnqnN0sv3NnAyKnantxy7w0TDicFjiBsSIhjB5aUfWYErBR+Nj/m\nuumwc/kRJcHWklqDzxrZKCIyOyWcE5Dyjjr46cnF8HxhYwgZcwkmgTtaXOLpBMlo\nXUTgOQrWpm9HYg2vOJMMA/ZPUJ2tJ34/4RgiA00EJ5xG8r24suZmT775l+XFLFzp\nIhxvs3BMbrWsXlcZkI5neNk7Q/1jLoBhWeTYjMpUS7bJ/49YVGQZFs3xu2IcLqeD\n5WsB1i+EqBAI0jm4vWEynsyX+kS2BqAiDtCsS6WYT2q00DTeP5eIHh/vHsm75jJ+\nyUEb1xFxGnNevLKNTcHUeXxPUnowdC6wqFnaJm7l09qVGDom7tLX9i6MCojgpAP0\nhMpBxzh8jLxHh+zZQdiORSFdYxNnlnWwbic2GUJruiQVLuhpseenAgMBAAGjYzBh\nMB0GA1UdDgQWBBQHT/IIheEC2kdBxI/TfGqUxWJw9zAfBgNVHSMEGDAWgBQHT/II\nheEC2kdBxI/TfGqUxWJw9zAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIB\nhjANBgkqhkiG9w0BAQsFAAOCAgEAqXZjy4EltJCRtBmN0ohAHPWqH4ZJQCI2HrM3\nwHB6c4oPWcJ+M2PfmYPUJo9VMjvn4S3sZuAysyoHduvRdGDnElW4wglL1xxpoUOx\nFqoZUoYWV8hDFmUTWM5b4CtJxOPdTAd8VgypulM3iUEzBQrjR6tnMOdkiFMOmVag\n0/Nnr+Tcfk/crMCx3xsVnisYjJoQBFBH4UY+gWE/V/MS1Sya4/qTbuuCUq+Qym5P\nr8TkWAJlg7iVVLbZ2j94VUdpiQPWJEGMtJck/NEmOTruhhQlT7c1u/lqXCGj7uci\nLmhLsBVmdtWT9AWS8Rl7Qo5GXbjxKIaP3IM9axhDLm8WHwPRLx7DuIFEc+OBxJhz\nwkr0g0yLS0AMZpaC6UGbWX01ed10U01mQ/qPU5uZiB0GvruwsYWZsyL1QXUeqLz3\n/KKrx3XsXjtBu3ZG4LAnwuxfeZCNw9ofg8CqF9c20ko+7tZAv6DCu9UL+2oZnEyQ\nCboRDwpnAlQ7qJVSp2xMgunO3xxVMlhD5LZpEJz1lRT0nQV3uuLpMYNM4FS9OW/X\nMZSzwHhDdCTDWtc/iRszimOnYYV8Y0ubJcb59uhwcsHmdfnwL9DVO6X5xyzb8wsf\nwWaPbub8SN2jKnT0g6ZWuca4VwEo1fRaBkzSZDqXwhkBDWP8UBqLXMXWHdZaT8NK\n0NEO74c=\n-----END CERTIFICATE-----',
  name: 'ca-certificate-1',
  tags: ['test'],
  metadata: {
    issuer: 'CN=Kong Testing Root CA,O=Kong Testing,ST=California,C=US',
    expiry: '1986382755',
  },
}

export const caCertificate: FetcherRawResponse = {
  data: [
    caCertificate1,
    {
      id: '2',
      cert: '-----BEGIN CERTIFICATE-----\nMIIFoTCCA4mgAwIBAgIUQDBLwIychoRbVRO44IzBBk9R4oYwDQYJKoZIhvcNAQEL\nBQAwWDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFTATBgNVBAoM\nDEtvbmcgVGVzdGluZzEdMBsGA1UEAwwUS29uZyBUZXN0aW5nIFJvb3QgQ0EwHhcN\nMTkwNTAyMTkzNDQyWhcNMzkwNDI3MTkzNDQyWjBYMQswCQYDVQQGEwJVUzETMBEG\nA1UECAwKQ2FsaWZvcm5pYTEVMBMGA1UECgwMS29uZyBUZXN0aW5nMR0wGwYDVQQD\nDBRLb25nIFRlc3RpbmcgUm9vdCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCC\nAgoCggIBAMp6IggUp3aSNRbLAac8oOkrbUnFuxtlKGYgg8vfA2UU71qTktigdwO6\nKod0/M+daO3RDqJJXQL2rD14NDO3MaextICanoQSEe+nYyMFUIk+QplXLD3fbshU\nnHoJcMS2w0x4cm1os4ebxR2Evndo6luz39ivcjau+BL+9iBAYL1g6+eGOjcSy7ft\n1nAMvbxcQ7dmbAH2KP6OmF8cok+eQWVqXEjqtVx5GDMDlj1BjX6Kulmh/vhNi3Hr\nNEi+kPrw/YtRgnqnN0sv3NnAyKnantxy7w0TDicFjiBsSIhjB5aUfWYErBR+Nj/m\nuumwc/kRJcHWklqDzxrZKCIyOyWcE5Dyjjr46cnF8HxhYwgZcwkmgTtaXOLpBMlo\nXUTgOQrWpm9HYg2vOJMMA/ZPUJ2tJ34/4RgiA00EJ5xG8r24suZmT775l+XFLFzp\nIhxvs3BMbrWsXlcZkI5neNk7Q/1jLoBhWeTYjMpUS7bJ/49YVGQZFs3xu2IcLqeD\n5WsB1i+EqBAI0jm4vWEynsyX+kS2BqAiDtCsS6WYT2q00DTeP5eIHh/vHsm75jJ+\nyUEb1xFxGnNevLKNTcHUeXxPUnowdC6wqFnaJm7l09qVGDom7tLX9i6MCojgpAP0\nhMpBxzh8jLxHh+zZQdiORSFdYxNnlnWwbic2GUJruiQVLuhpseenAgMBAAGjYzBh\nMB0GA1UdDgQWBBQHT/IIheEC2kdBxI/TfGqUxWJw9zAfBgNVHSMEGDAWgBQHT/II\nheEC2kdBxI/TfGqUxWJw9zAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIB\nhjANBgkqhkiG9w0BAQsFAAOCAgEAqXZjy4EltJCRtBmN0ohAHPWqH4ZJQCI2HrM3\nwHB6c4oPWcJ+M2PfmYPUJo9VMjvn4S3sZuAysyoHduvRdGDnElW4wglL1xxpoUOx\nFqoZUoYWV8hDFmUTWM5b4CtJxOPdTAd8VgypulM3iUEzBQrjR6tnMOdkiFMOmVag\n0/Nnr+Tcfk/crMCx3xsVnisYjJoQBFBH4UY+gWE/V/MS1Sya4/qTbuuCUq+Qym5P\nr8TkWAJlg7iVVLbZ2j94VUdpiQPWJEGMtJck/NEmOTruhhQlT7c1u/lqXCGj7uci\nLmhLsBVmdtWT9AWS8Rl7Qo5GXbjxKIaP3IM9axhDLm8WHwPRLx7DuIFEc+OBxJhz\nwkr0g0yLS0AMZpaC6UGbWX01ed10U01mQ/qPU5uZiB0GvruwsYWZsyL1QXUeqLz3\n/KKrx3XsXjtBu3ZG4LAnwuxfeZCNw9ofg8CqF9c20ko+7tZAv6DCu9UL+2oZnEyQ\nCboRDwpnAlQ7qJVSp2xMgunO3xxVMlhD5LZpEJz1lRT0nQV3uuLpMYNM4FS9OW/X\nMZSzwHhDdCTDWtc/iRszimOnYYV8Y0ubJcb59uhwcsHmdfnwL9DVO6X5xyzb8wsf\nwWaPbub8SN2jKnT0g6ZWuca4VwEo1fRaBkzSZDqXwhkBDWP8UBqLXMXWHdZaT8NK\n0NEO74c=\n-----END CERTIFICATE-----',
      name: 'ca-certificate-2',
      tags: ['test', 'prod'],
      metadata: {
        issuer: 'ST=California,C=US',
        expiry: '1166742725',
      },
    },
  ],
  total: 2,
}

export const caCertificate100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `ca-certificate-${i + 1}`,
    tags: ['dev', 'prod'],
    cert: '-----BEGIN CERTIFICATE-----\nMIIFoTCCA4mgAwIBAgIUQDBLwIychoRbVRO44IzBBk9R4oYwDQYJKoZIhvcNAQEL\nBQAwWDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFTATBgNVBAoM\nDEtvbmcgVGVzdGluZzEdMBsGA1UEAwwUS29uZyBUZXN0aW5nIFJvb3QgQ0EwHhcN\nMTkwNTAyMTkzNDQyWhcNMzkwNDI3MTkzNDQyWjBYMQswCQYDVQQGEwJVUzETMBEG\nA1UECAwKQ2FsaWZvcm5pYTEVMBMGA1UECgwMS29uZyBUZXN0aW5nMR0wGwYDVQQD\nDBRLb25nIFRlc3RpbmcgUm9vdCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCC\nAgoCggIBAMp6IggUp3aSNRbLAac8oOkrbUnFuxtlKGYgg8vfA2UU71qTktigdwO6\nKod0/M+daO3RDqJJXQL2rD14NDO3MaextICanoQSEe+nYyMFUIk+QplXLD3fbshU\nnHoJcMS2w0x4cm1os4ebxR2Evndo6luz39ivcjau+BL+9iBAYL1g6+eGOjcSy7ft\n1nAMvbxcQ7dmbAH2KP6OmF8cok+eQWVqXEjqtVx5GDMDlj1BjX6Kulmh/vhNi3Hr\nNEi+kPrw/YtRgnqnN0sv3NnAyKnantxy7w0TDicFjiBsSIhjB5aUfWYErBR+Nj/m\nuumwc/kRJcHWklqDzxrZKCIyOyWcE5Dyjjr46cnF8HxhYwgZcwkmgTtaXOLpBMlo\nXUTgOQrWpm9HYg2vOJMMA/ZPUJ2tJ34/4RgiA00EJ5xG8r24suZmT775l+XFLFzp\nIhxvs3BMbrWsXlcZkI5neNk7Q/1jLoBhWeTYjMpUS7bJ/49YVGQZFs3xu2IcLqeD\n5WsB1i+EqBAI0jm4vWEynsyX+kS2BqAiDtCsS6WYT2q00DTeP5eIHh/vHsm75jJ+\nyUEb1xFxGnNevLKNTcHUeXxPUnowdC6wqFnaJm7l09qVGDom7tLX9i6MCojgpAP0\nhMpBxzh8jLxHh+zZQdiORSFdYxNnlnWwbic2GUJruiQVLuhpseenAgMBAAGjYzBh\nMB0GA1UdDgQWBBQHT/IIheEC2kdBxI/TfGqUxWJw9zAfBgNVHSMEGDAWgBQHT/II\nheEC2kdBxI/TfGqUxWJw9zAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIB\nhjANBgkqhkiG9w0BAQsFAAOCAgEAqXZjy4EltJCRtBmN0ohAHPWqH4ZJQCI2HrM3\nwHB6c4oPWcJ+M2PfmYPUJo9VMjvn4S3sZuAysyoHduvRdGDnElW4wglL1xxpoUOx\nFqoZUoYWV8hDFmUTWM5b4CtJxOPdTAd8VgypulM3iUEzBQrjR6tnMOdkiFMOmVag\n0/Nnr+Tcfk/crMCx3xsVnisYjJoQBFBH4UY+gWE/V/MS1Sya4/qTbuuCUq+Qym5P\nr8TkWAJlg7iVVLbZ2j94VUdpiQPWJEGMtJck/NEmOTruhhQlT7c1u/lqXCGj7uci\nLmhLsBVmdtWT9AWS8Rl7Qo5GXbjxKIaP3IM9axhDLm8WHwPRLx7DuIFEc+OBxJhz\nwkr0g0yLS0AMZpaC6UGbWX01ed10U01mQ/qPU5uZiB0GvruwsYWZsyL1QXUeqLz3\n/KKrx3XsXjtBu3ZG4LAnwuxfeZCNw9ofg8CqF9c20ko+7tZAv6DCu9UL+2oZnEyQ\nCboRDwpnAlQ7qJVSp2xMgunO3xxVMlhD5LZpEJz1lRT0nQV3uuLpMYNM4FS9OW/X\nMZSzwHhDdCTDWtc/iRszimOnYYV8Y0ubJcb59uhwcsHmdfnwL9DVO6X5xyzb8wsf\nwWaPbub8SN2jKnT0g6ZWuca4VwEo1fRaBkzSZDqXwhkBDWP8UBqLXMXWHdZaT8NK\n0NEO74c=\n-----END CERTIFICATE-----',
    metadata: {
      issuer: `ca-certificate-${i + 1}`,
      expiry: `${i + 1}`,
    },
  }))

export const paginate = (
  entities: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = entities.slice(_offset, _offset + size)
  const offset =
    _offset + size < entities.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}
