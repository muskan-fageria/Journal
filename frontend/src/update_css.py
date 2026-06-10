import re

with open('x:/GitHub/Journal/frontend/src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Replace variables
new_vars = '''\
:root {
  --bg:         #FAF9F6;
  --surface:    #FEFDFB;
  --surface2:   #F5F3EE;
  --surface3:   #EDE9E3;
  --border:     #E6E2DA;
  --border2:    #D4CFC6;
  --olive:      #4F7D5C;
  --olive-dim:  #3D6349;
  --olive-glow: rgba(79, 125, 92, 0.06);
  --green:      #4F7D5C;
  --green-dim:  #3D6349;
  --moss:       #EAEAE6;
  --sage:       #7FA88B;
  --sage-dim:   #4F7D5C;
  --gold:       #4F7D5C;
  --gold-lt:    #7FA88B;
  --text:       #1A1A1A;
  --text-dim:   #5F6368;
  --text-faint: #9B9590;
  --shadow:     rgba(0,0,0,0.02);
  --shadow-deep:rgba(0,0,0,0.05);
  --color-secondary: #4F7D5C;
  --color-secondary-rgb: 79, 125, 92;
  --ring-center-dot: rgba(79, 125, 92, 0.05);
  --accent:     #4F7D5C;
  --on-accent:  #FFFFFF;
}

.theme-primary {
  --bg:         #121210;
  --surface:    #1C1C1A;
  --surface2:   #252523;
  --surface3:   #2E2E2C;
  --border:     #2E2E2C;
  --border2:    #3E3E3C;
  --olive:      #5A8F6A; /* Lightened Deep Forest Green for dark mode */
  --olive-dim:  #4A7C59;
  --olive-glow: rgba(90,143,106,0.15);
  --green:      #5A8F6A;
  --green-dim:  #4A7C59;
  --moss:       #141C16;
  --sage:       #5A8F6A;
  --sage-dim:   #4A7C59;
  --gold:       #e6c183;
  --gold-lt:    #ffdea8;
  --text:       #F5F5F3;
  --text-dim:   #9E9E9C;
  --text-faint: #5E5E5C;
  --shadow:     rgba(0,0,0,0.4);
  --shadow-deep:rgba(0,0,0,0.6);
  --color-secondary: #5A8F6A;
  --color-secondary-rgb: 90,143,106;
  --ring-center-dot: rgba(90, 143, 106, 0.1);
  --accent:     #5A8F6A;
  --on-accent:  #121210;
}\
'''
css = re.sub(r':root\s*\{.*?\.theme-primary\s*\{.*?\}', new_vars, css, flags=re.DOTALL)

# 2. Replace Tailwind overrides
new_overrides = '''\
/* Unified Overrides for Tailwind classes */
.text-stone-100,
.text-stone-200,
.text-stone-300 {
  color: var(--text) !important;
}
.text-stone-400,
.text-stone-500 {
  color: var(--text-dim) !important;
}
.bg-\\[\\#1a1c1a\\]\\/90,
.bg-\\[\\#1a1c1a\\]\\/60 {
  background-color: var(--surface) !important;
  border-color: var(--border) !important;
  box-shadow: 0 4px 12px var(--shadow) !important;
}
.border-white\\/5,
.border-white\\/10 {
  border-color: var(--border) !important;
}
.bg-stone-950\\/30 {
  background-color: var(--surface) !important;
  border-right-color: var(--border) !important;
}
.hover\\:bg-white\\/5:hover {
  background-color: var(--surface2) !important;
}
.text-secondary {
  color: var(--accent) !important;
}
.bg-secondary {
  background-color: var(--accent) !important;
  color: var(--on-accent) !important;
}
.bg-stone-950 {
  background-color: var(--surface) !important;
}
.from-\\[\\#1a1c1a\\]\\/90 {
  background-image: none !important;
  background-color: var(--surface) !important;
}
.text-amber-200 {
  color: var(--accent) !important;
}
.border-amber-200\\/50 {
  border-color: var(--accent) !important;
}
.bg-white\\/5 {
  background-color: var(--surface2) !important;
}
nav button.active,
nav button:hover {
  background-color: var(--accent) !important;
  color: var(--on-accent) !important;
  border-color: var(--accent) !important;
}
nav button.active .material-symbols-outlined,
nav button:hover .material-symbols-outlined {
  color: var(--on-accent) !important;
}
nav button div.rounded-full {
  background-image: none !important;
  background-color: var(--accent) !important;
  border-color: var(--accent) !important;
}
nav button div.rounded-full span {
  color: var(--on-accent) !important;
}
nav button.active div.rounded-full,
nav button:hover div.rounded-full {
  background-image: none !important;
  background-color: var(--surface) !important;
  border-color: var(--surface) !important;
}
nav button.active div.rounded-full span,
nav button:hover div.rounded-full span {
  color: var(--accent) !important;
}
.text-white\\/20 {
  color: var(--text-faint) !important;
}
.bg-background {
  background-color: var(--bg) !important;
}
.text-on-surface {
  color: var(--text) !important;
}
.text-on-surface-variant {
  color: var(--text-dim) !important;
}
.bg-white\\/\\[0\\.05\\],
.bg-white\\/\\[0\\.03\\] {
  background-color: var(--surface) !important;
  border-color: var(--border) !important;
  box-shadow: 0 4px 12px var(--shadow) !important;
}
.border-outline-variant\\/30,
.border-outline-variant\\/20,
.border-outline-variant {
  border-color: var(--border) !important;
}
.bg-surface-container-high {
  background-color: var(--surface2) !important;
}
.text-blue-300,
.text-purple-300,
.text-green-300 {
  color: var(--accent) !important;
}
.bg-blue-300,
.bg-purple-300,
.bg-green-300 {
  background-color: var(--accent) !important;
}\
'''
css = re.sub(r'/\* Light Mode \(default\) Overrides for Tailwind classes \*/.*?\.theme-primary \.bg-green-300\s*\{\s*background-color:\s*#5a8f6a\s*!\s*important;\s*\}', new_overrides, css, flags=re.DOTALL)

# 3. Body gradients and noise
body_part = '''\
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  background-image: 
    radial-gradient(ellipse at 15% 0%, rgba(127,168,139,0.04) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 100%, rgba(127,168,139,0.03) 0%, transparent 55%);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.25;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
}

.theme-primary body::before {
  opacity: 0.4;
}\
'''
css = re.sub(r'body\s*\{.*?background-image:.*?url\("data:image.*?\}\s*\}', body_part, css, flags=re.DOTALL)

# 4. Bento card hovers
css = css.replace('rgba(230, 193, 131, 0.15)', 'rgba(var(--color-secondary-rgb), 0.15)')
css = css.replace('rgba(230, 193, 131, 0.8)', 'rgba(var(--color-secondary-rgb), 0.8)')
css = css.replace('rgba(255, 255, 255, 0.06)', 'rgba(var(--color-secondary-rgb), 0.06)')

# 5. Glass panel
glass_panel = '''\
/* Glass panel background */
.glass-panel {
  background-color: rgba(254, 253, 251, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 0.5px solid var(--border);
  transition: border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}
.glass-panel:hover {
  border: 0.5px solid var(--accent);
  box-shadow: 0 12px 24px var(--shadow);
}
.theme-primary .glass-panel {
  background-color: rgba(42, 42, 42, 0.4);
}\
'''
css = re.sub(r'/\* Glass panel background \*/.*?\.glass-panel:hover\s*\{.*?\}', glass_panel, css, flags=re.DOTALL)

with open('x:/GitHub/Journal/frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('CSS updated successfully!')
