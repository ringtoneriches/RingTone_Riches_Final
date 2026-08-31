import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

function SuccessMark() {
  return (
    <div className="rr-toast-win-mark" aria-hidden>
      <svg viewBox="0 0 56 56" className="h-full w-full">
        <circle className="rr-toast-win-ring" cx="28" cy="28" r="24" fill="none" />
        <path className="rr-toast-win-check" d="M17.5 29.2 24.2 36 38.5 20.5" fill="none" />
      </svg>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isWin = variant === "success"
        return (
          <Toast key={id} variant={variant} {...props}>
            {isWin ? (
              <div className="rr-toast-win-inner">
                <span className="rr-toast-win-burst" aria-hidden>
                  <i /><i /><i /><i /><i /><i /><i /><i />
                </span>
                <SuccessMark />
                <div className="rr-toast-win-copy">
                  <p className="rr-toast-win-kicker">Locked in</p>
                  {title && <ToastTitle className="rr-toast-win-title">{title}</ToastTitle>}
                  {description && (
                    <ToastDescription className="rr-toast-win-desc">
                      {description}
                    </ToastDescription>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            )}
            {action}
            <ToastClose className={isWin ? "rr-toast-win-close" : undefined} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
