import sys
content = open("src/pages/AIAssistant.tsx", "r").read()
if "const getLanguageName" not in content:
    lines = content.split(chr(10))
    for i, line in enumerate(lines):
        if line.strip().startswith("const QUICK_PROMPTS"):
            helper = chr(10) + "const getLanguageName = (code) => {\n  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);\n  return lang ? lang.name : code;\n};\n"
            lines.insert(i, helper)
            break
    content = chr(10).join(lines)
open("src/pages/AIAssistant.tsx", "w").write(content)
print("getLanguageName added")

