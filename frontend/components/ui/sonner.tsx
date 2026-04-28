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
 * Toaster — notificaciones estilo Confitería Quelita.
 *
 * Paleta:
 *  - success → turquesa (primary #0ABDC6)
 *  - error   → magenta  (accent  #D6006C)
 *  - info    → azul petróleo (secondary #1B6B8A)
 *  - warning → ámbar cálido
 *
 * Fondo crema cálido con borde del color del tipo. Coherente con el resto del sitio
 * (que usa `bg-card` blanco sobre `bg-background` crema).
 *
 * Posición: top-center en mobile (evita colisión con sticky CTAs del checkout y
 * con la bottom-nav del cliente), top-right en desktop.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      closeButton
      duration={3500}
      gap={10}
      offset={16}
      mobileOffset={12}
      icons={{
        success: <CheckCircle2 className="h-5 w-5" />,
        error: <AlertCircle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        warning: <AlertTriangle className="h-5 w-5" />,
        loading: <Loader2 className="h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: [
            "group toast",
            "!bg-card !text-card-foreground",
            "!border !border-border",
            "!shadow-premium",
            "!rounded-2xl",
            "!px-4 !py-3",
            "!min-w-[300px] sm:!min-w-[340px] !max-w-[420px]",
            "!backdrop-blur-sm",
          ].join(" "),
          title: "!text-sm !font-semibold !text-card-foreground !font-display",
          description: "!text-xs !text-muted-foreground !mt-0.5",
          actionButton: [
            "!bg-primary !text-primary-foreground !font-semibold",
            "!rounded-lg !px-3 !py-1.5 !text-sm",
            "hover:!bg-primary/90 !transition-colors",
          ].join(" "),
          cancelButton: [
            "!bg-muted !text-muted-foreground !font-medium",
            "!rounded-lg !px-3 !py-1.5 !text-sm",
            "hover:!bg-muted/80 !transition-colors",
          ].join(" "),
          closeButton: [
            "!bg-muted !text-muted-foreground",
            "hover:!bg-muted/80 hover:!text-card-foreground",
            "!border !border-border !transition-colors",
          ].join(" "),
          // Tipos: borde izquierdo de color + ícono coloreado
          success: [
            "!border-l-4 !border-l-primary",
            "[&>svg]:!text-primary",
          ].join(" "),
          error: [
            "!border-l-4 !border-l-accent",
            "[&>svg]:!text-accent",
          ].join(" "),
          warning: [
            "!border-l-4 !border-l-amber-500",
            "[&>svg]:!text-amber-500",
          ].join(" "),
          info: [
            "!border-l-4 !border-l-secondary",
            "[&>svg]:!text-secondary",
          ].join(" "),
          loading: [
            "!border-l-4 !border-l-muted-foreground/40",
            "[&>svg]:!text-muted-foreground",
          ].join(" "),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
