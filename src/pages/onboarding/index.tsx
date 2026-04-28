import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StepWelcome from './steps/StepWelcome';
import StepRoleSelection from './steps/StepRoleSelection';
import StepHealthProfile from './steps/StepHealthProfile';
import StepPrivacyConsent from './steps/StepPrivacyConsent';
import StepPassphrase from './steps/StepPassphrase';
import StepAdminMFA from './steps/StepAdminMFA';
import StepBiometrics from './steps/StepBiometrics';
import StepDone from './steps/StepDone';
import { updateUserMetadata } from '../../services/auth/userMetadata';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface OnboardingData {
  step: Step;
  role: string | null;
  language: string;
  healthProfile: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  consentGiven: boolean;
  passphrase: string;
  biometricsEnabled: boolean;
  adminMFACompleted?: boolean;
}

export default function Onboarding() {
  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();
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
      await updateUserMetadata(user.id, {
        role: data.role,
        language: data.language,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date().toISOString(),
      });

      // No step change; just complete
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    navigate('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Progress Indicator */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          {(() => {
            // Determine total steps based on role
            const isAdmin = data.role === 'admin';
            const totalSteps = isAdmin && !data.adminMFACompleted ? 8 : 7;
            const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
            return steps.map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  stepNum <= data.step
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {stepNum}
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
