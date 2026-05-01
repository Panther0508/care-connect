
import re
path = "src/pages/AIAssistant.tsx"
with open(path, "r") as f:
    content = f.read()
lines = content.split(chr(10))
insert_idx = None
for i, line in enumerate(lines):
    if "const [persona, setPersona]" in line:
        for j in range(i, min(i+5, len(lines))):
            if ");" in lines[j] and "useState" in lines[j-1]:
                insert_idx = j + 1
                break
        break
if insert_idx:
    state_lines = [
        "  const [showTranslation, setShowTranslation] = useState(false);",
        "  const [targetLanguage, setTargetLanguage] = useState(\"auto\");",
        "  const [isTranslating, setIsTranslating] = useState(false);",
        "  const [showSpeech, setShowSpeech] = useState(false);",
        "  const [isRecording, setIsRecording] = useState(false);",
        "  const [showTTS, setShowTTS] = useState(false);",
        "  const [isSpeakingNow, setIsSpeakingNow] = useState(false);",
        "  const [showReminders, setShowReminders] = useState(false);",
        "  const [showAppointments, setShowAppointments] = useState(false);",
        "  const [showImageUpload, setShowImageUpload] = useState(false);",
        "  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);",
        "  const [reminderForm, setReminderForm] = useState({medicationName: \"\", time: \"09:00\", days: [0,1,2,3,4,5,6]});",
        "  const [appointmentForm, setAppointmentForm] = useState({specialistType: \"general\", date: \"\", time: \"10:00\", purpose: \"\"});",
        "  const fileInputRef = useRef(null);"
    ]
    for k, state_line in enumerate(state_lines):
        lines.insert(insert_idx + k, state_line)
    print("inserted state at", insert_idx)
content = chr(10).join(lines)
with open(path, "w") as f:
    f.write(content)
print("Phase 2 states added")

