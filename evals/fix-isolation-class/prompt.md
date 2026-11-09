---
tags: [fix, cost]
runs: 2
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Agent]
---

Security report from a customer: signed in as the organization "globex", requesting order 1 gave
them the order that belongs to "acme" instead of a not-found. Please fix it.
