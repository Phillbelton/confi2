'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
  className?: string;
}

export function WhatsAppButton({
  phoneNumber = '56920178216',
  defaultMessage = 'Hola, me gustaría hacer una consulta sobre',
  className,
}: WhatsAppButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.div
        className={cn(
          'fixed z-50',
          // Posicionamiento responsive
          'bottom-4 right-4', // Mobile
          'md:bottom-6 md:right-6', // Desktop
          className
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.5,
        }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-3 bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
              style={{ width: '280px', maxWidth: 'calc(100vw - 32px)' }}
            >
              {/* Header */}
              <div className="bg-[#25D366] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-[#25D366]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Confitería Quelita</h3>
                    <p className="text-xs opacity-90">En línea</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-4 bg-muted/30">
                <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                  <p className="text-sm text-foreground">
                    ¡Hola! 👋
                    <br />
                    ¿En qué podemos ayudarte?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Responderemos lo antes posible
                  </p>
                </div>

                <button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-md"
                >
                  <MessageCircle className="h-5 w-5" />
                  Iniciar Chat
                </button>
              </div>

              {/* Footer info */}
              <div className="px-4 py-2 bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  Horario: Lun - Sáb 9:00 - 20:00
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón principal */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'relative flex items-center justify-center',
            'w-14 h-14', // Mobile
            'md:w-16 md:h-16', // Desktop
            'bg-[#25D366] hover:bg-[#128C7E]',
            'text-white rounded-full shadow-2xl',
            'transition-all duration-300',
            'hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]',
            'active:scale-95',
            'group'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isExpanded ? 'Cerrar WhatsApp' : 'Abrir WhatsApp'}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-7 w-7 md:h-8 md:w-8" />
              </motion.div>
            ) : (
              <motion.div
                key="whatsapp"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-7 w-7 md:h-8 md:w-8" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse animation */}
          {!isExpanded && (
            <motion.span
              className="absolute inset-0 rounded-full bg-[#25D366]"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
          )}

          {/* Badge de notificación (opcional) */}
          <motion.span
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            1
          </motion.span>
        </motion.button>
      </motion.div>
    </>
  );
}
