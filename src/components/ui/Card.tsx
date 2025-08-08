import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  const cardClasses = clsx(
    'bg-white rounded-lg border border-gray-200 shadow-sm',
    hover && 'transition-all duration-200 hover:shadow-md hover:border-gray-300',
    onClick && 'cursor-pointer',
    className
  );

  const cardProps = {
    className: cardClasses,
    onClick,
    ...(hover && {
      whileHover: { y: -2, scale: 1.01 },
      whileTap: onClick ? { scale: 0.98 } : {}
    })
  };

  return (
    <motion.div {...cardProps}>
      {children}
    </motion.div>
  );
}