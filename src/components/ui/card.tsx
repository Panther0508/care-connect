import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [cursorPos, setCursorPos] = React.useState({ x: 50, y: 50 });
  const [ripple, setRipple] = React.useState({ x: 0, y: 0, active: false });

  // Desktop: track mouse position for cursor-tracking refraction
  React.useEffect(() => {
    if (!ref.current) return;
    // Skip if touch device
    if ('ontouchstart' in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      let xPercent = ((clientX - left) / width) * 100;
      let yPercent = ((clientY - top) / height) * 100;
      // Clamp to 0-100
      xPercent = Math.max(0, Math.min(100, xPercent));
      yPercent = Math.max(0, Math.min(100, yPercent));
      setCursorPos({ x: xPercent, y: yPercent });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [ref]);

  // Mobile: handle touch start for ripple effect
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ref.current) return;
    const touch = e.touches[0];
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    let xPercent = ((touch.clientX - left) / width) * 100;
    let yPercent = ((touch.clientY - top) / height) * 100;
    // Clamp to 0-100
    xPercent = Math.max(0, Math.min(100, xPercent));
    yPercent = Math.max(0, Math.min(100, yPercent));

    setRipple({ x: xPercent, y: yPercent, active: true });
    // Deactivate after animation duration (400ms)
    setTimeout(() => {
      setRipple(prev => ({ ...prev, active: false }));
    }, 400);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "glass-card",
        {
          // Apply ripple-active class when ripple is active
          'ripple-active': ripple.active
        },
        className
      )}
      style={{
        // Cursor-tracking refraction (desktop only)
        '--cursor-x': `${cursorPos.x}%`,
        '--cursor-y': `${cursorPos.y}%`,
        // Touch-triggered ripple (mobile only)
        '--ripple-x': `${ripple.x}%`,
        '--ripple-y': `${ripple.y}%`,
        '--ripple-opacity': ripple.active ? 0.3 : 0
      }}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };