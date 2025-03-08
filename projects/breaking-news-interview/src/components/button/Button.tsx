import React from 'react';
import './Button.scss';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  onClick,
  children,
  className = '',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`button ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
} 