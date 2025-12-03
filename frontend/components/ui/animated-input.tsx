'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  showPasswordToggle?: boolean;
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      success,
      showPasswordToggle = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const isFloating = isFocused || hasValue || props.value;
    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        {/* Input Container */}
        <div className="relative">
          <input
            ref={inputRef}
            type={inputType}
            className={cn(
              'flex h-14 w-full rounded-lg border bg-background px-4 pt-6 pb-2 text-base',
              'transition-colors duration-200',
              'placeholder:text-transparent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-destructive focus-visible:ring-destructive/30'
                : success
                ? 'border-green-500 focus-visible:ring-green-500/30'
                : 'border-input focus-visible:ring-ring',
              isFocused && !error && !success && 'border-primary',
              showPasswordToggle && 'pr-12',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          {/* Floating Label */}
          {label && (
            <motion.label
              htmlFor={props.id}
              className={cn(
                'absolute left-4 pointer-events-none',
                'text-muted-foreground transition-all duration-200 origin-left',
                'select-none'
              )}
              animate={{
                top: isFloating ? '0.5rem' : '50%',
                y: isFloating ? 0 : '-50%',
                fontSize: isFloating ? '0.75rem' : '1rem',
                fontWeight: isFloating ? 500 : 400,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              {label}
            </motion.label>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === 'password' && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={showPassword ? 'hide' : 'show'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}

          {/* Success/Error Icon */}
          {(success || error) && !showPasswordToggle && (
            <motion.div
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2',
                error ? 'text-destructive' : 'text-green-500'
              )}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 15,
              }}
            >
              {error ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </motion.div>
          )}

          {/* Focus Ring Effect */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className={cn(
                    'absolute inset-0 rounded-lg',
                    success
                      ? 'bg-green-500/10'
                      : 'bg-primary/5'
                  )}
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut' as const,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="flex items-start gap-2 mt-2"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut' as const,
              }}
            >
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <motion.p
                className="text-sm text-destructive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {error}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence mode="wait">
          {success && !error && (
            <motion.div
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut' as const,
              }}
            >
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <motion.p
                className="text-sm text-green-600 dark:text-green-500"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                ¡Perfecto!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export { AnimatedInput };
