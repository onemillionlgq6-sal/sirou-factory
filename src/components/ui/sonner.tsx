import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(220,20%,14%)] group-[.toaster]:text-white group-[.toaster]:border-white/20 group-[.toaster]:shadow-xl",
          description: "group-[.toast]:text-white/70",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70",
          success: "group-[.toaster]:!bg-[hsl(220,20%,14%)] group-[.toaster]:!text-[hsl(142,60%,55%)] group-[.toaster]:!border-[hsl(142,60%,42%)]/30",
          error: "group-[.toaster]:!bg-[hsl(220,20%,14%)] group-[.toaster]:!text-[hsl(0,72%,65%)] group-[.toaster]:!border-[hsl(0,72%,55%)]/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
