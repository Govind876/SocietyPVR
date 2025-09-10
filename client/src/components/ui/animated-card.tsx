import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Card, CardProps } from "@/components/ui/card";

interface AnimatedCardProps extends CardProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  hover?: boolean;
}

export function AnimatedCard({ 
  children, 
  delay = 0, 
  direction = "up", 
  hover = true, 
  className = "",
  ...props 
}: AnimatedCardProps) {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  const hoverEffect = hover ? { y: -5 } : {};

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={hoverEffect}
      className="h-full"
    >
      <Card className={`h-full transition-all duration-300 ${hover ? 'hover:shadow-lg' : ''} ${className}`} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}
