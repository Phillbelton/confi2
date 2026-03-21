'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Un número', test: (p) => /[0-9]/.test(p) },
  { label: 'Un carácter especial', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function calculateStrength(password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  label: string;
} {
  if (!password) {
    return { score: 0, level: 'weak', color: 'bg-muted', label: '' };
  }

  const passed = requirements.filter((req) => req.test(password)).length;
  const score = (passed / requirements.length) * 100;

  if (score < 40) {
    return {
      score,
      level: 'weak',
      color: 'bg-red-500',
      label: 'Débil',
    };
  } else if (score < 60) {
    return {
      score,
      level: 'fair',
      color: 'bg-orange-500',
      label: 'Regular',
    };
  } else if (score < 80) {
    return {
      score,
      level: 'good',
      color: 'bg-yellow-500',
      label: 'Buena',
    };
  } else {
    return {
      score,
      level: 'strong',
      color: 'bg-green-500',
      label: 'Fuerte',
    };
  }
}

export function PasswordStrength({
  password,
  showRequirements = true,
}: PasswordStrengthProps) {
  const strength = calculateStrength(password);
  const meetsRequirements = requirements.map((req) => ({
    ...req,
    met: req.test(password),
  }));

  if (!password) return null;

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Seguridad de contraseña</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={strength.label}
              className={cn(
                'font-medium',
                strength.level === 'weak' && 'text-red-600',
                strength.level === 'fair' && 'text-orange-600',
                strength.level === 'good' && 'text-yellow-600',
                strength.level === 'strong' && 'text-green-600'
              )}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
            >
              {strength.label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', strength.color)}
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {meetsRequirements.map((req, index) => (
            <motion.div
              key={req.label}
              className="flex items-start gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.2,
              }}
            >
              <motion.div
                className={cn(
                  'mt-0.5 rounded-full p-0.5 flex-shrink-0',
                  req.met
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
                animate={{
                  scale: req.met ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: 'easeOut' as const,
                }}
              >
                {req.met ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs transition-colors',
                  req.met
                    ? 'text-green-600 dark:text-green-500 font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {req.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
