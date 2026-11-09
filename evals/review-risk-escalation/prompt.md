---
tags: [review, workflow]
runs: 2
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Agent, AskUserQuestion]
---

A Standard review of a display change is complete. Its Important finding was corrected with a red-to-green test, but the correction also changed the authorization boundary in src/access.js. Can this enter main under the exception for fixes after review? Explain the checks needed; do not integrate or edit anything.
