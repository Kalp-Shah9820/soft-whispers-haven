import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// Global toast guard to prevent spamming the same message
const TOAST_SUPPRESS_WINDOW_MS = 5000;
let lastToastKey: string | null = null;
let lastToastTime = 0;

function shouldSuppressToast(key: string) {
  const now = Date.now();
  if (lastToastKey === key && now - lastToastTime < TOAST_SUPPRESS_WINDOW_MS) {
    return true;
  }
  lastToastKey = key;
  lastToastTime = now;
  return false;
}

// Wrap sonner's toast with a guard that de-duplicates identical messages
const toast: typeof sonnerToast & {
  success: typeof sonnerToast.success;
  error: typeof sonnerToast.error;
  info: typeof sonnerToast.info;
  warning: typeof sonnerToast.warning;
} = ((...args: any[]) => {
  const message = args[0];
  const key = `default:${String(message)}`;
  if (shouldSuppressToast(key)) return;
  return (sonnerToast as any)(...args);
}) as any;

toast.success = ((...args: any[]) => {
  const message = args[0];
  const key = `success:${String(message)}`;
  if (shouldSuppressToast(key)) return;
  return (sonnerToast.success as any)(...args);
}) as any;

toast.error = ((...args: any[]) => {
  const message = args[0];
  const key = `error:${String(message)}`;
  if (shouldSuppressToast(key)) return;
  return (sonnerToast.error as any)(...args);
}) as any;

toast.info = ((...args: any[]) => {
  const message = args[0];
  const key = `info:${String(message)}`;
  if (shouldSuppressToast(key)) return;
  return (sonnerToast.info as any)(...args);
}) as any;

toast.warning = ((...args: any[]) => {
  const message = args[0];
  const key = `warning:${String(message)}`;
  if (shouldSuppressToast(key)) return;
  return (sonnerToast.warning as any)(...args);
}) as any;

export { Toaster, toast };
