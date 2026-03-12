---
name: superpowers-brainstorming
description: Activates before writing code. Refines rough ideas through Socratic questions, explores alternatives, presents design in sections for validation. Saves design document.
---

# Brainstorming Ideas Into Designs

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Checklist

Complete these items in order:

- [ ] **Explore project context** — check files, docs, recent commits
- [ ] **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
- [ ] **Propose 2-3 approaches** — with trade-offs and your recommendation
- [ ] **Present design** — in sections scaled to complexity, get user approval after each section
- [ ] **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit
- [ ] **User reviews written spec** — ask user to review the spec file before proceeding
- [ ] **Transition to implementation** — invoke feature-planner or /feature-development workflow

## The Process

### 1. Understanding the idea

- Check out the current project state first (files, docs, recent commits)
- Before asking detailed questions, assess scope:
  - If the request describes multiple independent subsystems → **flag immediately**
  - Don't spend questions refining details of a project that needs to be decomposed first
- For appropriately-scoped projects: ask questions **one at a time** to refine the idea
- Prefer **multiple choice questions** when possible (open-ended is fine too)
- Only one question per message
- Focus: purpose, constraints, success criteria

### 2. Exploring approaches

- Propose 2-3 different approaches with trade-offs
- **Lead with your recommended option** and explain why
- Present options conversationally

### 3. Presenting the design

- Once you believe you understand what you're building, present the design
- **Scale each section to its complexity**: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

### 4. Design for isolation and clarity

- Break the system into smaller units that each have **one clear purpose, well-defined interfaces, and can be tested independently**
- For each unit, you should be able to answer: what does it do, how do you use it, and what does it depend on?
- Can someone understand what a unit does without reading its internals? Can you change the internals without breaking consumers?

### 5. Working in existing codebases

- Explore the current structure before proposing changes. **Follow existing patterns.**
- Where existing code has problems that affect the work (bloated files, unclear boundaries), include targeted improvements as part of the design
- Don't propose unrelated refactoring. Stay focused on the current goal.

## After the Design

1. Write the validated design to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
   - (User preferences for spec location override this default)
2. Ask the user to review the spec
3. After approval → transition to **feature-planner skill** or **/feature-development workflow**

## Key Principles

- **One question at a time** — Don't overwhelm with multiple questions
- **Multiple choice preferred** — Easier to answer than open-ended when possible
- **YAGNI ruthlessly** — Remove unnecessary features from all designs
- **Explore alternatives** — Always propose 2-3 approaches before settling
- **Incremental validation** — Present design, get approval before moving on
- **Be flexible** — Go back and clarify when something doesn't make sense
