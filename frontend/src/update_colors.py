import re

with open('x:/GitHub/Journal/frontend/src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Light Theme Colors
css = css.replace('--text:       #1A1A1A;', '--text:       #1A1A1A; /* Headings */\n  --text-body:  #4A4A4A; /* Body */')
css = css.replace('--text-dim:   #5F6368;', '--text-dim:   #6B7280; /* Secondary Text */')

# Dark Theme Colors
css = css.replace('--text:       #F5F5F3;', '--text:       #F5F3EE; /* Headings */\n  --text-body:  #C7C7C7; /* Body */')
css = css.replace('--text-dim:   #9E9E9C;', '--text-dim:   #9CA3AF; /* Secondary Text */')

# Update body color
css = css.replace('color: var(--text);', 'color: var(--text-body);')

with open('x:/GitHub/Journal/frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Updated typography colors in index.css')
