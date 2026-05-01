import sys
content = open('src/pages/AIAssistant.tsx', 'r').read()
if 'PHASE 2 FEATURE PANELS' in content:
    print('already added')
    sys.exit(0)
lines = content.split(chr(10))

# Read the panels template from a separate file
panels_file = open('/tmp/panels_jsx.txt', 'r')
panels = panels_file.read()
panels_file.close()

for i, line in enumerate(lines):
    if line.strip().startswith('return ('):
        lines.insert(i, chr(10) + panels)
        break

open('src/pages/AIAssistant.tsx', 'w').write(chr(10).join(lines))
print('panels added')
