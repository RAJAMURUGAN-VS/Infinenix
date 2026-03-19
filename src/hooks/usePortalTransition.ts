
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface DomainData {
  id: string;
  label: string;
  color: string;
  description: string;
}

export const usePortalTransition = () => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [portalColor, setPortalColor] = useState('#00ffaa');

  const startTransition = useCallback((domain: DomainData) => {
    setIsTransitioning(true);
    setPortalColor(domain.color);

    // Wait for the portal animation to complete before navigating
    setTimeout(() => {
      navigate('/chat', { 
        state: { 
          domain,
          color: domain.color
        }
      });
      setIsTransitioning(false);
    }, 2500);
  }, [navigate]);

  return {
    isTransitioning,
    portalColor,
    startTransition
  };
};
