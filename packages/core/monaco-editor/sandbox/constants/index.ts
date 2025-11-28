import GithubSpec from '../assets/specs/Github.json'

export const defaultCodes = {
  yaml: `// Write your YAML code here

name: Monaco Playground
version: 1.0.0
features:
  autoSave: true
  theme: vs-dark
  languages:
    - javascript
    - typescript
    - css
    - markdown
    - yaml
`,

  typescript: `// Write your TypeScript code here

type User = {
  id: number
  name: string
  active: boolean
}

function getUser(id: number): User {
  return { id, name: 'Ari', active: true }
}

console.log(getUser(1));
`,

  regex: `# Write your Regular Expression here

# Explanation: looks for letters/numbers before and after an '@', and a domain
pattern = /[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}/

# Test it (in JS or Python)
test_string = "email@example.com"
match = pattern.test ? pattern.test(test_string) : pattern.match(test_string)
print(match)
`,

  json: JSON.stringify(GithubSpec, null, 2),

  markdown: `# Write your Markdown content here

## Features
- Syntax highlighting
- Live preview
- Multiple languages

### Tips
\`Shift + Enter\` to run code blocks.
> Built with ❤️ using Monaco Editor.
`,

  css: `/* Write your CSS code here */
button {
  background: linear-gradient(90deg, #007aff, #00c6ff);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 10px 16px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

button:hover {
  transform: scale(1.05);
}
`,
}
