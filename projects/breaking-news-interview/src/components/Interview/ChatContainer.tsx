import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

interface ChatContainerProps {
  messages: Message[];
}

/**
 * ChatContainer Component
 * 
 * Displays the conversation between the user and the suspect.
 * Auto-scrolls to the latest message and provides visual differentiation between roles.
 */
const ChatContainer: React.FC<ChatContainerProps> = ({ messages }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '30vh',
        overflow: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        padding: '16px',
        color: 'white',
        zIndex: 10,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        scrollBehavior: 'smooth'
      }}
      ref={chatContainerRef}
    >
      {messages.map((message, index) => (
        <Box 
          key={index} 
          className={`message ${message.role}`}
          sx={{
            padding: '10px',
            margin: '5px 0',
            borderRadius: '5px',
            backgroundColor: message.role === 'user' 
              ? 'rgba(0, 153, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.2)',
            textAlign: message.role === 'user' ? 'right' : 'left',
            maxWidth: '80%',
            marginLeft: message.role === 'user' ? 'auto' : '0',
            marginRight: message.role === 'user' ? '0' : 'auto',
          }}
        >
          <Typography variant="body1" sx={{ color: 'white' }}>
            {message.content}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ChatContainer; 