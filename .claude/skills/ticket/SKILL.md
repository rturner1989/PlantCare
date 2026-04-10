---
name: ticket
description: Use when the user wants to create a structured work ticket with requirements and acceptance criteria for a feature, task, or bugfix. Invoked with /ticket or when the user asks to create a ticket, story, or task card.
---

Create a structured work ticket — like a Jira story but without the project management overhead. Requirements + acceptance criteria to build towards. No time estimates, no sprints, just clear goals. Output as a styled HTML file with embedded design references.

## Process

1. **Gather context** — read the user's request (arguments or conversation context). If vague, ask ONE clarifying question. Don't over-interview.

2. **Check for existing tickets** — scan `docs/tickets/` in the project root. Auto-increment the ticket number from the highest existing `TICKET-NNN.html` file. If the directory doesn't exist, create it starting at `TICKET-001`.

3. **Find design references automatically** — search the project for relevant context. Read the files, don't ask the user:
   - **Design spec** (`docs/superpowers/specs/`) — find and quote relevant sections
   - **Mockup files** (`docs/mockups/`) — find related HTML mockups and link to them
   - **Implementation plan** (`docs/superpowers/plans/`) — find relevant task/step details
   - **Existing code** — note relevant existing files that will be created or modified
   - Include only references that are genuinely useful for this ticket. Don't pad.

4. **Generate the HTML ticket** using the template structure below. Self-contained, styled, opens in any browser.

5. **Save directly** to `docs/tickets/TICKET-NNN.html` — no approval step. The ticket is generated from the spec and plan, not guesswork. Tell the user the path and how to open it:
   ```
   xdg-open docs/tickets/TICKET-NNN.html
   ```

6. **Print a one-line confirmation** with the ticket number, title, and file path. Nothing more. The user will open the HTML to see the full ticket.

## HTML Template Structure

The HTML file should be self-contained with inline CSS. Use a clean, professional style. Structure:

```
┌─────────────────────────────────────────┐
│ TICKET-NNN                              │
│ [Title]                                 │
│ Status: Open  Priority: High            │
├─────────────────────────────────────────┤
│ SUMMARY                                 │
│ [2-3 sentences]                         │
├─────────────────────────────────────────┤
│ REQUIREMENTS                            │
│ 1. [Requirement]                        │
│ 2. [Requirement]                        │
├─────────────────────────────────────────┤
│ ACCEPTANCE CRITERIA                     │
│ ☐ [Testable condition]                  │
│ ☐ [Testable condition]                  │
├─────────────────────────────────────────┤
│ DESIGN REFERENCES                       │
│ ┌─────────┐ ┌─────────┐                │
│ │ Mockup  │ │ Mockup  │  [links]       │
│ │ embed   │ │ embed   │                │
│ └─────────┘ └─────────┘                │
│ Spec excerpt: "..."                     │
│ Plan reference: Task N, Step M          │
├─────────────────────────────────────────┤
│ RELATED FILES                           │
│ • path/to/file (create / modify)        │
├─────────────────────────────────────────┤
│ NOTES                                   │
│ [Context, gotchas, decisions]           │
└─────────────────────────────────────────┘
```

### Design References Section

This is what makes the ticket useful during building. Include:

- **Mockup links** — relative paths to HTML mockup files in `docs/mockups/`. Use `<a href="relative/path">` so they're clickable. If the mockup exists, embed it in a small `<iframe>` preview (300px tall, full width, with a border) so the developer can see it without opening another file.
- **Spec excerpts** — quote the specific paragraphs from the design spec that are relevant to this ticket. Not the whole spec — just the bits that matter. Use a styled blockquote.
- **Plan steps** — reference the specific task and steps from the implementation plan. Quote the step text so the developer doesn't have to cross-reference.
- **Colour tokens** — if the ticket involves UI work, list the specific palette tokens used (e.g. `--forest: #0B3A1A` for hero cards).
- **Component patterns** — if the design spec describes a specific component pattern (e.g. glass dock, progress ring), excerpt that pattern description.

### Styling

Use a clean, modern style. Here's the baseline CSS to use (adapt as needed):

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: #f5f5f0;
  color: #1a1a1a;
  padding: 40px;
  line-height: 1.6;
}
.ticket {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  overflow: hidden;
}
.header {
  background: #1a1a2e;
  color: #fff;
  padding: 32px 40px;
}
.header .id { font-size: 13px; opacity: 0.6; letter-spacing: 0.1em; text-transform: uppercase; }
.header h1 { font-size: 28px; font-weight: 700; margin: 8px 0 16px; }
.badges { display: flex; gap: 8px; }
.badge {
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
}
.badge.status { background: #2d6a4f; color: #fff; }
.badge.priority-high { background: #e63946; color: #fff; }
.badge.priority-medium { background: #f4a261; color: #1a1a1a; }
.badge.priority-low { background: #a8dadc; color: #1a1a1a; }
section { padding: 28px 40px; border-top: 1px solid #eee; }
section h2 {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #666;
  margin-bottom: 16px;
}
ol, ul { padding-left: 20px; }
li { margin-bottom: 8px; }
.criterion { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.criterion .box {
  width: 18px; height: 18px;
  border: 2px solid #ccc;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}
.mockup-preview {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
}
.mockup-preview iframe {
  width: 100%;
  height: 300px;
  border: none;
}
.mockup-preview .label {
  padding: 8px 14px;
  background: #f5f5f0;
  font-size: 12px;
  font-weight: 700;
  color: #666;
}
blockquote {
  border-left: 3px solid #2d6a4f;
  padding: 12px 16px;
  margin: 12px 0;
  background: #f8faf8;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  color: #444;
}
code {
  background: #f0f0ea;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}
.file-list { list-style: none; padding: 0; }
.file-list li {
  padding: 8px 12px;
  background: #f8f8f5;
  border-radius: 6px;
  margin-bottom: 4px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}
.file-list .action {
  font-family: inherit;
  font-size: 11px;
  color: #888;
  font-weight: 700;
  text-transform: uppercase;
}
.token-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.token {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f8f5;
  border-radius: 6px;
  font-size: 12px;
}
.token .swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0;
}
```

## Rules

- **Requirements** are what needs to happen. Numbered, specific, no fluff.
- **Acceptance criteria** are how you verify it's done. Testable conditions, not vague outcomes.
- **No time estimates.** No story points. No sprint assignments.
- **Priority** is relative to other open tickets. High = do first. Low = do when you want.
- **One ticket per logical unit of work.** Suggest splitting if it's really 3 things.
- **Design references must be genuinely relevant.** Don't include every mockup — only the ones that inform this specific ticket.
- **Mockup iframes use relative paths.** The ticket and mockups live in sibling directories under `docs/`, so paths will be like `../mockups/plantcare-ui/06-auth-login-register.html`.
- **Keep it scannable.** A developer should be able to open the ticket, glance at requirements, check the mockup preview, and start building.
