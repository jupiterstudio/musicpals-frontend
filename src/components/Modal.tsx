// src/components/Modal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className={`bg-white rounded-3xl shadow-2xl ${sizeClasses[size]} w-full max-h-[80vh] overflow-hidden`}
              initial={{ scale: 0.7, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  {title && (
                    <h2 className="text-2xl font-bold text-gray-800 kid-title">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      onClick={onClose}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={20} className="text-gray-600" />
                    </motion.button>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Success Modal Component
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon = '🎉'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={false}>
      <div className="text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold kid-title mb-4">{title}</h3>
        <p className="text-lg kid-subtitle mb-6 leading-relaxed">{message}</p>
        <motion.button
          className="kid-button"
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ✨ Awesome! ✨
        </motion.button>
      </div>
    </Modal>
  );
};

// Error Modal Component
interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={false}>
      <div className="text-center">
        <div className="text-6xl mb-4">😔</div>
        <h3 className="text-2xl font-bold kid-title mb-4 text-red-500">{title}</h3>
        <p className="text-lg kid-subtitle mb-6 leading-relaxed">{message}</p>
        <motion.button
          className="kid-button"
          style={{
            background: 'linear-gradient(45deg, #ef4444, #f87171)'
          }}
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Try Again
        </motion.button>
      </div>
    </Modal>
  );
};