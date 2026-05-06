import re
with open("src/services/hybridAIEngine.js", "r") as f:
    content = f.read()
lines = content.splitlines(keepends=True)
for i, line in enumerate(lines):
    if line.strip().startswith("if (parallelResult.judged) {"):
        start = i
        indent = len(line) - len(line.lstrip())
        for j in range(i+1, len(lines)):
            if lines[j].strip() == "};" and len(lines[j]) - len(lines[j].lstrip()) == indent:
                end = j
                break
        new_block = """    if (parallelResult.judged) {
      result = {
        text: applyGuardrails(parallelResult.judged.winner.text, role),
        reasoning: [
          { type: "search", title: "Parallel Gemma Models", description: `Evaluated ${parallelResult.responses.length} model responses` },
          { type: "judge", title: "Judge evaluation", description: parallelResult.judged.reasoning }
        ],
        citations: [],
        emotionalState: finalEmotion,
        model: parallelResult.judged.winner.model,
        source: "parallel-fire"
      };
"""
        lines[start:end+1] = new_block.splitlines(keepends=True)
        break
with open("src/services/hybridAIEngine.js", "w") as f:
    f.writelines(lines)
print("Block replaced")
