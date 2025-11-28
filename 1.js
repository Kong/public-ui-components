const fs = require('fs')
const readline = require('readline')

async function readAuditResults() {
  const fileStream = fs.createReadStream('audit_results.txt')

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  let nexLineIsVulnerabilityType = false
  let vulnerabilityHasNoPatch = false
  let res = ''
  const counter = {}
  let vulnerabilityBlock = ''
  let vulnType = ''
  for await (const line of rl) {

    if (line.startsWith('┌─')) {
      vulnerabilityBlock = line + '\n'
      vulnType = ''
      nexLineIsVulnerabilityType = true
      vulnerabilityHasNoPatch = false
      continue
    }
    vulnerabilityBlock += line + '\n'
    if (nexLineIsVulnerabilityType) {
      vulnType = line.trim().split('│')[1].trim()
      nexLineIsVulnerabilityType = false
    }
    if (line.startsWith('│ Patched versions    │ <0.0.0')) {
      vulnerabilityHasNoPatch = true
    }
    if (line.startsWith('└─')) {
      if (!vulnerabilityHasNoPatch && vulnType) {
        counter[vulnType] = (counter[vulnType] || 0) + 1
        res += vulnerabilityBlock
      }
    }
  }
  let counterArr = []
  let total = 0
  Object.keys(counter).forEach((key) => {
    total += counter[key]
    counterArr.push(`${counter[key]} ${key}`)
  })
  console.log(res)
  console.log(`${total} vulnerabilities found`)
  console.log(`Severity: ${counterArr.reverse().join(' | ')}`)

}

readAuditResults()
