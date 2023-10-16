export default function usePortFromProtocol() {
  const getPortFromProtocol = (protocol: string, port?: string): number => {
    const defaultPorts: Array<number> = [80, 443]
    const portValue = Number(port)

    if ((portValue || portValue === 0) && !defaultPorts.includes(portValue)) { return portValue }

    switch (protocol) {
      case 'grpcs':
      case 'tls':
      case 'https':
      case 'wss':
        return 443
      case 'grpc':
      case 'tcp':
      case 'http':
      case 'ws':
      default:
        return 80
    }
  }

  return {
    getPortFromProtocol,
  }
}
