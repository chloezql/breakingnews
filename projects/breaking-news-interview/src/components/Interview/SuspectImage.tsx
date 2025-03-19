import React from 'react';
import { Box } from '@mui/material';

interface SuspectImageProps {
  suspectId: string;
}

/**
 * SuspectImage Component
 * 
 * Displays the appropriate suspect image based on the suspect ID.
 * This component is used during calls to show the suspect.
 */
const SuspectImage: React.FC<SuspectImageProps> = ({
  suspectId
}) => {
  // Map suspect IDs to their image paths
  const getImagePath = () => {
    switch (suspectId) {
      case '7298':
        return '/dr.hart.png';
      case '4692':
        return '/kevin-profile-image.png';
      case '5746':
        return '/lucy.png';
      default:
        return '';
    }
  };

  const imagePath = getImagePath();
  
  if (!imagePath) return null;
  
  return (
    <Box
      component="img"
      src={imagePath}
      alt="Suspect"
      sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxHeight: '40vh',
        maxWidth: '35vw',
        objectFit: 'contain',
        borderRadius: '10px',
        zIndex: 2
      }}
    />
  );
};

export default SuspectImage; 