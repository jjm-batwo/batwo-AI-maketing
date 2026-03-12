---
name: superpowers-systematic-debugging
description: Use for ANY technical issue (test failures, bugs, performance problems, build errors). 4-phase root cause process. Must identify cause before attempting fixes.
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

**ANY technical issue:**
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work

## The Four Phases

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Read stack traces completely
   - Note line numbers, file paths, error codes
   - Don't skip past errors or warnings

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes, environmental differences

4. **Gather Evidence in Multi-Component Systems**
   ```
   For EACH component boundary:
     - Log what data enters the component
     - Log what data exits the component
     - Verify environment/config propagation
   → Run once to gather evidence showing WHERE it breaks
   → Identify the failing component
   → Investigate that specific component
   ```

5. **Trace Data Flow**
   - Where does the bad value originate?
   - What called this with the bad value?
   - Keep tracing up until you find the source
   - **Fix at source, not at symptom**

### Phase 2: Pattern Analysis

1. **Find Working Examples** — Locate similar working code in the same codebase
2. **Compare Against References** — Read reference implementation COMPLETELY (don't skim)
3. **Identify Differences** — List every difference, however small
4. **Understand Dependencies** — What components, settings, environment, assumptions

### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis** — "I think X is the root cause because Y"
2. **Test Minimally** — Make the SMALLEST possible change. One variable at a time
3. **Verify Before Continuing** — Worked? → Phase 4. Didn't work? → New hypothesis (DON'T stack fixes)
4. **When You Don't Know** — Say "I don't understand X" honestly

### Phase 4: Implementation

1. **Create Failing Test Case** (use `/tdd` workflow)
2. **Implement Single Fix** — Address root cause only. No "while I'm here" improvements
3. **Verify Fix** — Test passes? No other tests broken? Issue actually resolved?
4. **If Fix Doesn't Work:**
   - STOP
   - Count: How many fixes have you tried?
   - < 3: Return to Phase 1, re-analyze with new information
   - **≥ 3: STOP — Question the architecture**

5. **If 3+ Fixes Failed: Question Architecture**
   - Each fix reveals new problem in different place?
   - Fixes require "massive refactoring" to implement?
   - **Discuss with user before attempting more fixes**

## Red Flags — STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
- Each fix reveals new problem in different place

**ALL of these mean: STOP. Return to Phase 1.**

## Quick Reference

| Phase | Key Activities | Success Criteria |
|---|---|---|
| 1. Root Cause | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Identify differences |
| 3. Hypothesis | Form theory, test minimally | Confirmed or new hypothesis |
| 4. Implementation | Create test, fix, verify | Bug resolved, tests pass |
