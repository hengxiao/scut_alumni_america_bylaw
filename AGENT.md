# Agent Context — SCUT Alumni America By-Laws Revision

This file gives an AI agent the context needed to understand the purpose of this repository and contribute effectively.

---

## What This Repository Is

This repository manages the formal revision of the By-Laws of **South China University of Technology Alumni, America (SCUT Alumni America)**, a California nonprofit. The current By-Laws were adopted on December 10, 2002. The goal of this project is to produce a proposed revised version that can be put to a membership vote.

The repository does **not** contain application code. All files are Markdown (or HTML for archival purposes). The "work" is structured research and legal drafting.

---

## Repository Structure

```
/
├── AGENT.md                   ← This file
├── README.md                  ← Human-facing project overview
├── PROCESS.md                 ← Formal amendment procedure (Article VIII) and project timeline
├── current_version.md         ← Current By-Laws (adopted December 10, 2002) — the baseline
├── current_version.html       ← Original HTML source of the current By-Laws (archival)
├── planning/                  ← Pre-drafting research organized by topic
│   ├── README.md              ← How the planning directory works; what each file type means
│   ├── 01-vision-and-purpose/
│   ├── 02-leadership-structure/
│   ├── 03-election-and-appointment/
│   ├── 04-membership-and-eligibility/
│   ├── 05-decision-process/
│   ├── 06-california-law-compliance/
│   ├── 07-financial-management/
│   ├── 08-meetings-and-notices/
│   ├── 09-digital-operations-and-communications/
│   ├── 10-standing-and-special-committees/
│   ├── 11-conflict-of-interest/
│   ├── 12-dissolution/
│   └── 13-federal-irs-501c7-compliance/
└── proposal/
    ├── rationale.md           ← Issues with the current By-Laws and justification for changes
    └── draft.md               ← Working draft of the proposed new By-Laws
```

---

## Planning Directory File Pattern

Every subdirectory under `planning/` contains exactly three files:

| File | Content |
|---|---|
| `definition.md` | Scope of the topic and why it matters to the By-Laws |
| `status-quo.md` | What the current By-Laws say about this topic, plus identified gaps |
| `policy-questions.md` | Decisions the organization must make before drafting can begin |

Read `planning/README.md` for a full explanation.

---

## Intended Workflow

1. Complete policy questions in each `planning/` topic directory
2. Fill in `proposal/rationale.md` with identified issues and proposed fixes
3. Write `proposal/draft.md` using `current_version.md` as the baseline
4. Board reviews draft; 6+ directors sign off
5. Secretary issues 30-day notice to all members
6. Membership meeting: 2/3 majority vote required for adoption

The amendment procedure is defined in Article VIII of the current By-Laws and summarized in `PROCESS.md`.

---

## Key Facts About the Organization

- **Legal name:** South China University of Technology Alumni, America
- **Type:** California nonprofit corporation; operates as an IRS 501(c)(7) social club
- **Founded:** Current By-Laws adopted December 10, 2002
- **Purposes (current By-Laws):** Promote member communication; professional development; shared interests and friendship; connection to SCUT; support for SCUT's development and reputation
- **Restrictions:** Non-profit (no asset distribution to members); non-political (no partisan activity or activity that jeopardizes tax-exempt status)
- **Amendment threshold:** 2/3 majority of members present at a membership meeting, after a 30-day notice period

---

## Current Project Status

All phases are **not started**. The `proposal/rationale.md` and `proposal/draft.md` files are empty placeholders. Work should begin in the `planning/` directories by answering the policy questions before any drafting happens.

---

## Conventions for Editing This Repository

- All content is in Markdown. Keep files readable as plain text.
- The `current_version.md` file is a read-only historical record. Do not edit it.
- In `proposal/draft.md`, use change notation to mark each section:
  - `[NEW]` — no counterpart in current By-Laws
  - `[REVISED]` — substantive change; must have a corresponding entry in `rationale.md`
  - `[UNCHANGED]` — original intent preserved; reworded only for clarity
- When adding new planning topics, follow the existing three-file pattern (`definition.md`, `status-quo.md`, `policy-questions.md`) and number directories to maintain sort order.
