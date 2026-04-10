# SSC PrepZone — Design System: The Academic Nocturne

## Creative North Star

A high-end editorial dark-mode practice portal for SSC exams. Deeply immersive, quiet, and authoritative. The interface recedes to let the content lead — no clutter, no noise, just focused exam preparation.

**Inspired by:** LeetCode, Linear, Notion (dark mode), IA Writer

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#131315` | Page base layer |
| Surface | `#1b1b1d` | Card backgrounds |
| Surface High | `#2a2a2c` | Elevated cards, hover states |
| Surface Highest | `#353437` | Buttons, interactive elements |
| Surface Lowest | `#0e0e10` | Recessed areas, code snippets |
| Text | `#e5e1e4` | Primary body text |
| Text Subtle | `#c7c4d7` | Secondary information |
| Text Muted | `#908fa0` | Labels, metadata |
| Primary | `#6366f1` | Interactive elements, accents |
| Primary Light | `#c0c1ff` | Highlighted text, active states |
| Primary Container | `#8083ff` | Soft focal points |
| Success | `#22c55e` | Correct answers, positive stats |
| Error | `#f43f5e` | Wrong answers, warnings |
| Warning | `#f59e0b` | Amber accent (GK subject) |
| Purple | `#a855f7` | Purple accent (Reasoning subject) |
| Border | `rgba(255,255,255,0.08)` | Subtle dividers |

---

## Typography

Geist font family throughout.

| Role | Weight | Size | Usage |
|------|--------|------|-------|
| Display | 700-800 | 32-48px | Hero score, major milestones |
| Heading | 600-700 | 18-24px | Section titles |
| Body | 400 | 15px | Questions, descriptions |
| Label | 500 | 12-13px | Metadata, badges |
| Button | 600 | 14px | Button text |

---

## Design Tokens

```css
--color-bg: #131315;
--color-surface: #1b1b1d;
--color-surface-high: #2a2a2c;
--color-surface-highest: #353437;
--color-surface-lowest: #0e0e10;
--color-text: #e5e1e4;
--color-text-muted: #908fa0;
--color-text-subtle: #c7c4d7;
--color-primary: #6366f1;
--color-primary-light: #c0c1ff;
--color-primary-container: #8083ff;
--color-success: #22c55e;
--color-error: #f43f5e;
--color-warning: #f59e0b;
--color-purple: #a855f7;
--color-border: rgba(255, 255, 255, 0.08);
```

---

## Key Design Rules

1. **No explicit borders** for sectioning — use background color shifts
2. **Rounded-xl (12px)** corners on all cards and containers
3. **Rounded-lg (8px)** on buttons and inputs
4. **Tonal layering** for depth — bg shifts instead of shadows
5. **Ghost borders** only when needed (`rgba(255,255,255,0.08)`)
6. **Generous negative space** between sections
7. **Backdrop blur** on floating nav (`bg-bg/80 backdrop-blur-xl`)

---

## Screens

### Dashboard (/)
- Sticky nav: app name + "Start Practice" button
- 4 stat cards: Questions Solved, Streak, Accuracy, Tests Completed
- GitHub/LeetCode-style contribution heatmap (6 months, 5 intensity levels)
- Recent Sessions table with color-coded accuracy
- Quick Start subject cards with colored dots

### Configuration (/configure)
- Topic tree with expandable subjects and subtopic checkboxes
- Question count and time inputs (large, prominent)
- "Begin Exam" CTA button

### Focus Arena (/test)
- Question number grid (color-coded: answered/marked/current)
- Single question display with 4 numbered options
- Keyboard shortcuts (1-4 for options, arrows for nav, M for mark)
- Timer with color states (normal/warning/critical)

### Post-Mortem (/result)
- Large score header
- 4-stat grid (correct/wrong/unattempted/accuracy)
- Question grid + selected question review panel with explanations

### Full Review (/review)
- Scrollable list of all questions
- Color-coded options (correct green, wrong red)
- Explanation boxes in recessed containers

---

## Stitch MCP Source

Design System: "Indigo Onyx" / "The Academic Nocturne"
Project: `projects/6667727954643114837`
Asset: `assets/3171029806253708154`
