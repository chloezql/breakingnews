import React from 'react';
import './Button.scss';

interface ButtonProps {
  label: string;
  buttonStyle?: 'regular' | 'action' | 'neutral' | 'outline-primary' | 'primary';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  'data-connected'?: boolean;
  'data-recording'?: boolean;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}

export function Button({
  label,
  buttonStyle = 'regular',
  onClick,
  disabled,
  className,
  title,
  'data-connected': dataConnected,
  'data-recording': dataRecording,
  onMouseDown,
  onMouseUp,
}: ButtonProps) {
  return (
    <button
      className={`button ${buttonStyle} ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-connected={dataConnected}
      data-recording={dataRecording}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {label}
    </button>
  );
} 