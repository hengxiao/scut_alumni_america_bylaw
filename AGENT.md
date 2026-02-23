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
├── report-zh.md               ← Chinese-language project status report
├── examples/                  ← Bylaws and analysis for 10 comparable organizations
│   ├── README.md              ← Index and cross-cutting governance recommendations (read this first)
│   ├── 01-puaasc/             ← Peking Univ. Alumni Assoc. of Southern California (CA mutual benefit)
│   ├── 02-pkuaa-ne/           ← Peking Univ. Alumni Assoc. of New England (MA 501(c)(3))
│   ├── 03-ustcaf/             ← USTC Alumni Foundation (DE 501(c)(3), all-volunteer)
│   ├── 04-fdaagla/            ← Fudan Univ. Alumni Assoc. of Greater Los Angeles (CA nonprofit)
│   ├── 05-xtuaana/            ← Xiangtan Univ. Alumni Assoc. of North America (near-identical to SCUT)
│   ├── 06-ctuaaa/             ← Chiao Tung Univ. Alumni Assoc. in America (national federation, est. 1943)
│   ├── 07-sjtu-sv/            ← SJTU Alumni Assoc. in Silicon Valley (CA 501(c)(3))
│   ├── 08-hcssa/              ← Harvard Chinese Students & Scholars Assoc. (student org, 2023 constitution)
│   ├── 09-taa-gny/            ← Tsinghua Alumni Assoc. of Greater New York (NY 501(c)(3), est. 1979)
│   └── 10-oca/                ← OCA – Asian Pacific American Advocates (national 501(c)(3), est. 1973)
│       (each subdirectory contains: readme.md · bylaw.md · analysis.md)
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
│       (each subdirectory contains: definition.md · status-quo.md · policy-questions.md · examples-analysis.md)
└── proposal/
    ├── rationale.md           ← Issues with the current By-Laws and justification for changes
    └── draft.md               ← Working draft of the proposed new By-Laws
```

---

## Planning Directory File Pattern

Every subdirectory under `planning/` contains four files:

| File | Content |
|---|---|
| `definition.md` | Scope of the topic and why it matters to the By-Laws |
| `status-quo.md` | What the current By-Laws say about this topic, plus identified gaps |
| `policy-questions.md` | Decisions the organization must make before drafting can begin |
| `examples-analysis.md` | How the 10 reference organizations handle this topic — approaches, pros/cons, and recommendations |

Read `planning/README.md` for a full explanation.

---

## Intended Workflow

1. Read `examples/README.md` for a cross-cutting prioritized list of governance improvements
2. For each `planning/` topic, read `examples-analysis.md` for how peer organizations handle that topic (approaches, pros/cons, recommendations)
3. Complete policy questions in each `planning/` topic directory, informed by the examples analyses
4. Fill in `proposal/rationale.md` with identified issues and proposed fixes
5. Write `proposal/draft.md` using `current_version.md` as the baseline
6. Board reviews draft; 6+ directors sign off
7. Secretary issues 30-day notice to all members
8. Membership meeting: 2/3 majority vote required for adoption

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

## Examples Directory File Pattern

Every subdirectory under `examples/` contains exactly three files:

| File | Content |
|---|---|
| `readme.md` | Background on the organization: history, legal status, mission, governance structure |
| `bylaw.md` | Representative bylaws for the organization in markdown format |
| `analysis.md` | Comparative analysis: similarities and differences with SCUT Alumni America; what SCUT can learn |

Read `examples/README.md` first — it indexes all ten organizations and synthesizes cross-cutting governance themes with a prioritized recommendation list.

---

## Current Project Status

- **`examples/`** — **Complete.** Ten comparable organizations researched, bylaws drafted, and individual comparative analyses written.
- **`planning/`** — **Research phase complete.** All 13 topics have `definition.md`, `status-quo.md`, `policy-questions.md`, and `examples-analysis.md`. Policy questions have **not yet been answered** by the organization.
- **`proposal/rationale.md`** and **`proposal/draft.md`** — Empty placeholders; drafting has not begun.

Recommended next step: use `examples-analysis.md` and `examples/README.md` as inputs when answering the policy questions in each `planning/` topic. The research has surfaced several high-priority issues (dissolution clause, indemnification, committee structure, quarterly board meetings) that should be resolved first.

---

---

## Conventions for Editing This Repository

- All content is in Markdown. Keep files readable as plain text.
- The `current_version.md` file is a read-only historical record. Do not edit it.
- In `proposal/draft.md`, use change notation to mark each section:
  - `[NEW]` — no counterpart in current By-Laws
  - `[REVISED]` — substantive change; must have a corresponding entry in `rationale.md`
  - `[UNCHANGED]` — original intent preserved; reworded only for clarity
- When adding new planning topics, follow the existing three-file pattern (`definition.md`, `status-quo.md`, `policy-questions.md`) and number directories to maintain sort order.
