import React from 'react';
import { motion } from 'framer-motion';
import { Button as MuiButton } from '@mui/material';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  motionProps = {},
  className = '',
  ...props
}) => {
  const baseStyles = {
    borderRadius: '9999px',
    textTransform: 'none',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '0.875rem' },
    md: { padding: '12px 24px', fontSize: '1rem' },
    lg: { padding: '16px 32px', fontSize: '1.125rem' },
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #9ACD32 0%, #c8e870 100%)',
      color: '#1E293B',
      border: 'none',
      '&:hover': {
        background: 'linear-gradient(135deg, #8BC42C 0%, #b8d866 100%)',
        boxShadow: '0 8px 24px rgba(154,205,50,0.3)',
        transform: 'translateY(-2px)',
      },
    },
    secondary: {
      background: 'rgba(255,255,255,0.1)',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,0.2)',
      '&:hover': {
        background: 'rgba(255,255,255,0.2)',
        borderColor: 'rgba(255,255,255,0.4)',
      },
    },
    outline: {
      background: 'transparent',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,0.3)',
      '&:hover': {
        background: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.5)',
      },
    },
  };

  return (
    <motion.div {...motionProps}>
      <MuiButton
        onClick={onClick}
        className={className}
        sx={{
          ...baseStyles,
          ...sizeStyles[size],
          ...variantStyles[variant],
        }}
        {...props}
      >
        {children}
      </MuiButton>
    </motion.div>
  );
};

export default Button;