// FetcherRawResponse is the raw format of the endpoint's response
export interface FetcherRawResponse {
  data: any[];
  total: number;
  offset?: string;
}

export const key1 = {
  id: '1',
  name: 'tk-kitty-key',
  kid: 'kitty-1',
  pem: {
    private_key: `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCvYyuhu5r0Tq9qrtXtX3x/7atfthSHEVlfGdzKl2XILLvJcS86
mKuti7BO7FTGKN4h3Cmh2cJhkYRzOY4T6UxT84MYG0LZgxWBOU8HbXluQrww8FEM
LvN8zrCGGEguf4FMxVch0tzmFxyXy4fUiiXwjD2hXNUyqw6DH/QqlEJ6XQIDAQAB
AoGAccjvB7CE6TcbSyU+mQ+33+87nY6tZqt0xeQrgCwU1ndfJWOO9n8R8jeMHMfq
f90HsAP75os2NsKHoZGXgYd8Am4vDRFr25kqk1VQpoQ3Il8ZnKYzG1+6XqQRQtgO
2WdQJG0pVyLU8crb3s+BFie9gA+oBmXTecJY3Cn9bbvuygECQQDu50GoBxXx5I9v
P7QS1h4I8CVGKgw9dqy8qCvGuOSzxeUZF6tsfDNPGLHWdhj9Xmf5FIAlQPY3zRtq
e1WSaZ0dAkEAu/BK3nMRBuNkKhtL29aVoluD1R6Y2NnrQjBjB25nqK4+o1aX4zda
xI+r2LkeLj12KvLz4UmBmKFHtVFiXyIOQQJBALSeSllK4iB7eKXXN8F1+EcxqDyf
1Zkye+42BsK7Ts1LtKV/666dR/1o4isOJl6IXXtHMIr5zizp+OxMSqnjB1ECQD6T
Uopgq7GscsRmVEq9VxM4/1stldzWKjPeoopt40vRwH9oLKh13N4HrEM71+Wzhy3j
uPoxHFpykMq5b1SXpUECQQDXo1zfoRs3+lqE4lLFaCIVBAQV9wK5dJLFxZF38wgu
4P/bwb5cznxt+9RlPJxjT4KAqGrfFZBHEKyb/QY9snwQ
-----END RSA PRIVATE KEY-----`,
    public_key: `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCvYyuhu5r0Tq9qrtXtX3x/7atf
thSHEVlfGdzKl2XILLvJcS86mKuti7BO7FTGKN4h3Cmh2cJhkYRzOY4T6UxT84MY
G0LZgxWBOU8HbXluQrww8FEMLvN8zrCGGEguf4FMxVch0tzmFxyXy4fUiiXwjD2h
XNUyqw6DH/QqlEJ6XQIDAQAB
-----END PUBLIC KEY-----`,
  },
  set: { id: 'id-4-4-4', name: 'key-set-4' },
  tags: ['cats', 'cheeseburgers'],
}

export const kid = 'FdFYFzERwC2uCBB46pZQi4GG85LujR8obt-KWRBICVQ'
export const jwkString = '{\n  "kty" : "OKP",\n  "crv" : "Ed25519",\n  "x"   : "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",\n  "d"   : "nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A",\n  "use" : "sig",\n  "kid" : "FdFYFzERwC2uCBB46pZQi4GG85LujR8obt-KWRBICVQ"\n}'
const jwk = {
  kty: 'RSA',
  kid: 'cc34c0a0-bd5a-4a3c-a50d-a2a7db7643df',
  use: 'sig',
  n: 'pjdss8ZaDfEH6K6U7GeW2nxDqR4IP049fk1fK0lndimbMMVBdPv_hSpm8T8EtBDxrUdi1OHZfMhUixGaut-3nQ4GG9nM249oxhCtxqqNvEXrmQRGqczyLxuh-fKn9Fg--hS9UpazHpfVAFnB5aCfXoNhPuI8oByyFKMKaOVgHNqP5NBEqabiLftZD3W_lsFCPGuzr4Vp0YS7zS2hDYScC2oOMu4rGU1LcMZf39p3153Cq7bS2Xh6Y-vw5pwzFYZdjQxDn8x8BG3fJ6j8TGLXQsbKH1218_HcUJRvMwdpbUQG5nvA2GXVqLqdwp054Lzk9_B_f1lVrmOKuHjTNHq48w',
  e: 'AQAB',
  d: 'ksDmucdMJXkFGZxiomNHnroOZxe8AmDLDGO1vhs-POa5PZM7mtUPonxwjVmthmpbZzla-kg55OFfO7YcXhg-Hm2OWTKwm73_rLh3JavaHjvBqsVKuorX3V3RYkSro6HyYIzFJ1Ek7sLxbjDRcDOj4ievSX0oN9l-JZhaDYlPlci5uJsoqro_YrE0PRRWVhtGynd-_aWgQv1YzkfZuMD-hJtDi1Im2humOWxA4eZrFs9eG-whXcOvaSwO4sSGbS99ecQZHM2TcdXeAs1PvjVgQ_dKnZlGN3lTWoWfQP55Z7Tgt8Nf1q4ZAKd-NlMe-7iqCFfsnFwXjSiaOa2CRGZn-Q',
  p: '4A5nU4ahEww7B65yuzmGeCUUi8ikWzv1C81pSyUKvKzu8CX41hp9J6oRaLGesKImYiuVQK47FhZ--wwfpRwHvSxtNU9qXb8ewo-BvadyO1eVrIk4tNV543QlSe7pQAoJGkxCia5rfznAE3InKF4JvIlchyqs0RQ8wx7lULqwnn0',
  q: 'ven83GM6SfrmO-TBHbjTk6JhP_3CMsIvmSdo4KrbQNvp4vHO3w1_0zJ3URkmkYGhz2tgPlfd7v1l2I6QkIh4Bumdj6FyFZEBpxjE4MpfdNVcNINvVj87cLyTRmIcaGxmfylY7QErP8GFA-k4UoH_eQmGKGK44TRzYj5hZYGWIC8',
  dp: 'lmmU_AG5SGxBhJqb8wxfNXDPJjf__i92BgJT2Vp4pskBbr5PGoyV0HbfUQVMnw977RONEurkR6O6gxZUeCclGt4kQlGZ-m0_XSWx13v9t9DIbheAtgVJ2mQyVDvK4m7aRYlEceFh0PsX8vYDS5o1txgPwb3oXkPTtrmbAGMUBpE',
  dq: 'mxRTU3QDyR2EnCv0Nl0TCF90oliJGAHR9HJmBe__EjuCBbwHfcT8OG3hWOv8vpzokQPRl5cQt3NckzX3fs6xlJN4Ai2Hh2zduKFVQ2p-AF2p6Yfahscjtq-GY9cB85NxLy2IXCC0PF--Sq9LOrTE9QV988SJy_yUrAjcZ5MmECk',
  qi: 'ldHXIrEmMZVaNwGzDF9WG8sHj2mOZmQpw9yrjLK9hAsmsNr5LTyqWAqJIYZSwPTYWhY4nu2O0EY9G9uYiqewXfCKw_UngrJt8Xwfq1Zruz0YY869zPN4GiE9-9rzdZB33RBw8kIOquY3MK74FMwCihYx_LiU2YTHkaoJ3ncvtvg',
}

export const keys: FetcherRawResponse = {
  data: [
    key1,
    {
      id: '2',
      name: 'key-2',
      kid: 'kid-2',
      jwk: JSON.stringify(jwk),
      tags: ['tag1', 'tag2'],
    },
  ],
  total: 2,
}

export const keys100: any[] = Array(100)
  .fill(null)
  .map((_, i) => ({
    id: `${i + 1}`,
    name: `key-${i + 1}`,
    kid: `kid-${i + 1}`,
    jwk: JSON.stringify(jwk),
  }))

export const paginate = (
  routes: any[],
  size: number,
  _offset: number,
): FetcherRawResponse => {
  const sliced = routes.slice(_offset, _offset + size)
  const offset =
    _offset + size < routes.length ? String(_offset + size) : undefined

  return {
    data: sliced,
    total: sliced.length,
    offset,
  }
}

export const keySets = {
  data: Array(10).fill(null)
    .map((_, i) => ({
      id: `id-${i + 1}-${i + 1}-${i + 1}`,
      name: `key-set-${i + 1}`,
      tags: ['secure', 'cats', 'hamburgers'],
    })),
}
