"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react"

/**
 * Toaster Component - Notificaciones Toast mejoradas
 *
 * Mejores prácticas implementadas:
 * - Posicionamiento: bottom-center en móvil, top-right en desktop
 * - Duración: 4 segundos (500ms por palabra promedio)
 * - richColors: colores semánticos (verde éxito, rojo error, etc.)
 * - closeButton: permite cerrar manualmente para accesibilidad
 * - Animaciones suaves con expand habilitado
 * - Estilos consistentes con el tema oscuro del sitio
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      expand={true}
      richColors
      closeButton
      duration={4000}
      gap={12}
      icons={{
        success: <CheckCircle2 className="h-5 w-5" />,
        error: <AlertCircle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        warning: <AlertTriangle className="h-5 w-5" />,
        loading: <Loader2 className="h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: `
            group toast
            group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-slate-800 group-[.toaster]:to-slate-900
            group-[.toaster]:text-white
            group-[.toaster]:border group-[.toaster]:border-white/10
            group-[.toaster]:shadow-2xl
            group-[.toaster]:rounded-xl
            group-[.toaster]:px-4 group-[.toaster]:py-3
            group-[.toaster]:backdrop-blur-sm
            group-[.toaster]:min-w-[300px] group-[.toaster]:max-w-[400px]
            sm:group-[.toaster]:min-w-[350px]
          `,
          title: `
            group-[.toast]:text-sm group-[.toast]:font-semibold
            group-[.toast]:text-white
          `,
          description: `
            group-[.toast]:text-sm
            group-[.toast]:text-gray-300
          `,
          actionButton: `
            group-[.toast]:bg-primary
            group-[.toast]:text-primary-foreground
            group-[.toast]:font-medium
            group-[.toast]:rounded-lg
            group-[.toast]:px-3 group-[.toast]:py-1.5
            group-[.toast]:text-sm
            group-[.toast]:hover:bg-primary/90
            group-[.toast]:transition-colors
          `,
          cancelButton: `
            group-[.toast]:bg-white/10
            group-[.toast]:text-gray-300
            group-[.toast]:font-medium
            group-[.toast]:rounded-lg
            group-[.toast]:px-3 group-[.toast]:py-1.5
            group-[.toast]:text-sm
            group-[.toast]:hover:bg-white/20
            group-[.toast]:transition-colors
          `,
          closeButton: `
            group-[.toast]:bg-white/10
            group-[.toast]:text-gray-400
            group-[.toast]:hover:bg-white/20
            group-[.toast]:hover:text-white
            group-[.toast]:border-white/10
            group-[.toast]:transition-all
          `,
          // Colores por tipo de toast (richColors)
          success: `
            group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-emerald-900/95 group-[.toaster]:!to-emerald-800/95
            group-[.toaster]:!border-emerald-500/30
            [&>svg]:!text-emerald-400
          `,
          error: `
            group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-red-900/95 group-[.toaster]:!to-red-800/95
            group-[.toaster]:!border-red-500/30
            [&>svg]:!text-red-400
          `,
          warning: `
            group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-amber-900/95 group-[.toaster]:!to-amber-800/95
            group-[.toaster]:!border-amber-500/30
            [&>svg]:!text-amber-400
          `,
          info: `
            group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-blue-900/95 group-[.toaster]:!to-blue-800/95
            group-[.toaster]:!border-blue-500/30
            [&>svg]:!text-blue-400
          `,
          loading: `
            group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-slate-800/95 group-[.toaster]:!to-slate-700/95
            group-[.toaster]:!border-slate-500/30
            [&>svg]:!text-slate-400
          `,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
