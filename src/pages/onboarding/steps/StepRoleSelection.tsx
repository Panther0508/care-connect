import { ROLE_INFO, UserRole } from '../../../lib/roles';
import { motion } from 'framer-motion';
import { useStatus } from '../../../hooks/useStatus';

interface StepRoleSelectionProps {
  onNext: () => void;
  onBack: () => void;
  selectedRole: string | null;
  onSelect: (updates: { role: string }) => void;
}

export default function StepRoleSelection({ onNext, onBack, selectedRole, onSelect }: StepRoleSelectionProps) {
  const { showStatus } = useStatus();

  const handleSelect = (role: UserRole) => {
    onSelect({ role });
  };

  const handleContinue = () => {
    if (selectedRole) {
      const roleInfo = ROLE_INFO[selectedRole as UserRole];
      showStatus('success', 'Role Selected', `You selected ${roleInfo.label}. This determines which features you will see. You cannot change your role after setup.`);
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Role</h2>
        <p className="text-slate-400">
          This determines which dashboard and features you'll have access to.
        </p>
      </div>

      <div className="grid gap-4">
        {(Object.values(ROLE_INFO) as Array<typeof ROLE_INFO[UserRole]>).map((roleInfo) => (
          <motion.button
            key={roleInfo.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(roleInfo.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedRole === roleInfo.id
                ? 'border-teal-500 bg-teal-900/30'
                : 'border-slate-600 bg-slate-800/40 hover:border-slate-500'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{roleInfo.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1">{roleInfo.label}</div>
                <div className="text-sm text-slate-400">{roleInfo.description}</div>
              </div>
              {selectedRole === roleInfo.id && (
                <div className="text-teal-400">✓</div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="flex-1 py-3 bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-teal-500 transition-colors font-semibold"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
