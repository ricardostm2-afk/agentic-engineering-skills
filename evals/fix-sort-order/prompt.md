---
tags: [fix, cost]
runs: 2
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent]
---

The back office shows orders in the wrong order. The README says the list is oldest first, but
this morning an order from yesterday appeared above one from last week. Can you fix it?
