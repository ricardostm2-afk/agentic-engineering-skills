---
type: tool_order
before: { tool: Bash, input_match: 'npm test|node --test|node .*\.spec\.js' }
after: { tool: Edit, input_match: 'src/orders\.js' }
weight: 1
---
