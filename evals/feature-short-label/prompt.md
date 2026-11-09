---
tags: [feature, workflow]
runs: 2
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Agent, AskUserQuestion]
---

Add the archived status to statusLabel in src/labels.js. Its exact label is Archived; preserve Open, Closed and Unknown. Follow the existing map pattern and verify the behavior.
