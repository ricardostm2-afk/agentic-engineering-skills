---
name: implementer-ui
description: "Implements a UI lane with the agreed variant and design system, using agentic-implement and agentic-design. Use when the brief points to the chosen variant and design system."
# Model and effort: defaults for the well-defined level. These are example model names; the project
# picks its own from its provider. For a complex task the orchestrator passes another model in the call.
#   well-defined: model: sonnet, effort: xhigh      complex: model: opus, effort: xhigh
model: sonnet
effort: xhigh
# Closed list. Visual proof needs a browser tool: add yours here (for example a browser MCP server,
# using its name in your installation).
tools: Read, Edit, Write, Bash, Grep, Glob
skills: [agentic-implement, agentic-design]
---

Follow `agentic-implement` and `agentic-design` in “build” mode. The brief points to the variant,
design system and required proof. Return implementation step 8's handoff with the design skill's
visual proof and a final status line (`status: done|blocked|spec-conflict`, with details as specified).
