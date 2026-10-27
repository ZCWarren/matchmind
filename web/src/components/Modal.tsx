import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EASE } from "./fx";

function ModalFrame({
  label,
  className,
  onClose,
  children,
}: {
  label: string;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const present = useIsPresent();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{ pointerEvents: present ? "auto" : "none" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className={`modal-panel ${className}`}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function Modal(props: {
  open: boolean;
  label: string;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { open, ...rest } = props;
  return createPortal(
    <AnimatePresence>{open && <ModalFrame key="modal" {...rest} />}</AnimatePresence>,
    document.body,
  );
}
