import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '../../hooks/auth/useRole';
import StepWelcome from './steps/StepWelcome';
import StepRoleSelection from './steps/StepRoleSelection';
import StepHealthProfile from './steps/StepHealthProfile';
import StepPrivacyConsent from './steps/StepPrivacyConsent';
import StepPassphrase from './steps/StepPassphrase';
import StepAdminMFA from './steps/StepAdminMFA';
import StepBiometrics from './steps/StepBiometrics';
import StepDone from './steps/StepDone';
import { updateUserMetadata } from '../../services/auth/userMetadata';
import MagnifyingLoader from '../../components/MagnifyingLoader';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface Condition {
  id: string;
  name: string;
  diagnosedDate: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
}

interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface OnboardingData {
  step: Step;
  role: string | null;
  language: string;
  healthProfile: {
    conditions: Condition[];
    medications: Medication[];
    allergies: Allergy[];
  };
  consentGiven: boolean;
  passphrase: string;
  biometricsEnabled: boolean;
  adminMFACompleted?: boolean;
}

export default function Onboarding() {
  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { role } = useRole();
  const [data, setData] = useState<OnboardingData>({
    step: 1,
    role: null,
    language: 'en',
    healthProfile: {
      conditions: [],
      medications: [],
      allergies: [],
    },
    consentGiven: false,
    passphrase: '',
    biometricsEnabled: false,
    adminMFACompleted: false,
  });

  const nextStep = () => {
    setData((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, 8) as Step,
    }));
  };

  const prevStep = () => {
    setData((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 1) as Step,
    }));
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      // Save locally for immediate offline access
      await updateUserMetadata(user.id, {
        role: data.role,
        language: data.language,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date().toISOString(),
      });

      // Also persist health profile to IndexedDB/healthGraph
      try {
        const { setActiveUser } = await import('../../services/healthGraph');
        // Use passphrase if set, otherwise demo
        const passphrase = data.passphrase || 'vita-demo-2026';
        await setActiveUser(user.id, passphrase);

        // Add health profile entries
        const { addCondition, addMedication, addAllergy } = await import('../../services/healthGraph');
        for (const condition of data.healthProfile.conditions) {
          await addCondition(user.id, {
            name: condition.name,
            diagnosedAt: condition.diagnosedDate,
            notes: condition.notes,
          });
        }
        for (const medication of data.healthProfile.medications) {
          await addMedication(user.id, {
            name: medication.name,
            dose: medication.dose,
            frequency: medication.frequency,
            startDate: medication.startDate,
          });
        }
        for (const allergy of data.healthProfile.allergies) {
          await addAllergy(user.id, {
            substance: allergy.substance,
            reaction: allergy.reaction,
            severity: allergy.severity,
          });
        }
      } catch (err) {
        console.warn('Health graph persistence skipped (offline or unavailable):', err);
        // Continue anyway; health data can sync later
      }

      // Also persist role to Clerk's publicMetadata so it's available across sessions
      try {
        await user.update({
          publicMetadata: {
            role: data.role,
            language: data.language,
            hasCompletedOnboarding: true,
          },
        });
      } catch (err) {
        console.warn('Failed to update Clerk publicMetadata:', err);
        // Continue anyway; localStorage fallback is sufficient
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const handleFinish = async () => {
    // Write critical flags immediately to localStorage before any async operations
    // This guarantees they exist even if Clerk update fails or is delayed
    try {
      if (data.role) {
        localStorage.setItem('user_role', data.role);
      }
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('vitachain_onboarded', 'true');
    } catch (e) {
      console.warn('Failed to persist onboarding flags:', e);
    }

    // Give Clerk metadata a moment to sync before navigating
    await completeOnboarding();
    await new Promise(resolve => setTimeout(resolve, 300));

    navigate('/dashboard', { replace: true });
  };

   if (!isLoaded) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
         <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4">
           <MagnifyingLoader size={40} />
           <p className="text-slate-400 text-sm">Loading your secure experience...</p>
         </div>
       </div>
     );
   }

  // If user is already onboarded (local fallback check), redirect to dashboard
  // This prevents re-entering onboarding after completion
  const isOnboarded = localStorage.getItem('onboarding_completed') === 'true';
  if (isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderStep = () => {
    switch (data.step) {
      case 1:
        return <StepWelcome onNext={nextStep} />;
      case 2:
        return <StepRoleSelection onNext={nextStep} onBack={prevStep} selectedRole={data.role} onSelect={updateData} />;
      case 3:
        return data.role === 'patient' ? (
          <StepHealthProfile onNext={nextStep} onBack={prevStep} profile={data.healthProfile} onUpdate={updateData} />
        ) : (
          <StepPrivacyConsent onNext={nextStep} onBack={prevStep} consent={data.consentGiven} onUpdate={updateData} />
        );
      case 4:
        return <StepPrivacyConsent onNext={nextStep} onBack={prevStep} consent={data.consentGiven} onUpdate={updateData} />;
      case 5:
        return <StepPassphrase onNext={nextStep} onBack={prevStep} onSave={updateData} />;
      case 6:
        // If user is admin and MFA not yet completed, show MFA step
        if (data.role === 'admin' && !data.adminMFACompleted) {
          return <StepAdminMFA onNext={nextStep} onBack={prevStep} onMFAComplete={() => updateData({ adminMFACompleted: true })} />;
        }
        // Otherwise fall through to biometrics
        return <StepBiometrics onNext={nextStep} onBack={prevStep} onUpdate={updateData} enabled={data.biometricsEnabled} />;
       case 7:
         // After MFA step for admin, biometrics is step 7
         if (data.role === 'admin' && data.adminMFACompleted && !data.biometricsEnabled) {
           return <StepBiometrics onNext={nextStep} onBack={prevStep} onUpdate={updateData} enabled={data.biometricsEnabled} />;
         }
         return <StepDone onFinish={handleFinish} />;
       case 8:
         return <StepDone onFinish={handleFinish} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Progress Indicator */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-center gap-3">
          {(() => {
            // Determine total steps based on role
            const isAdmin = data.role === 'admin';
            const totalSteps = isAdmin && !data.adminMFACompleted ? 8 : 7;
            const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
            return steps.map((stepNum) => (
              <div
                key={stepNum}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    stepNum <= data.step
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                  }`}
                >
                  {stepNum <= data.step ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < totalSteps && (
                  <div className={`w-8 h-0.5 transition-all duration-300 ${
                    stepNum < data.step ? 'bg-teal-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={data.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
