with open('src/pages/AIAssistant.tsx', 'r') as f:
    content = f.read()

target = 'import { getUserProfile } from "../lib/idb"; // For loading user profile'

add = '''// Phase 2 services
import {translateText} from "../services/translationService";
import {transcribeFromMic,getWhisperStatus} from "../services/speechService";
import {speakText,isSpeaking,cancelSpeech,getTTSStatus} from "../services/ttsService";
import {scheduleReminder} from "../services/medicationReminder";
import {scheduleAppointment} from "../services/appointmentService";
import {analyzeSkinLesion,getMedicalDisclaimer} from "../services/imageClassifier";
import {FileText,Image,Calendar,Pill,Globe,Volume2,VolumeX,Camera} from "lucide-react";
'''

replacement = target + '\n\n' + add
new_content = content.replace(target, replacement)

with open('src/pages/AIAssistant.tsx', 'w') as f:
    f.write(new_content)

print('Phase 2 imports added successfully')
