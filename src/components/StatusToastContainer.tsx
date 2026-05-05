import { motion, AnimatePresence } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import StatusToast from "./StatusToast";

export default function StatusToastContainer() {
  const { toasts, dismissStatus } = useStatus();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <StatusToast toast={toast} onDismiss={() => dismissStatus(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
