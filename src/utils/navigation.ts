// utils/navigation.ts

/**
 * Navigation utility function for Domain Selector
 * @param navigate - The navigate function from useNavigate
 */
export const navigateToDomainSelector = (navigate: (path: string) => void): void => {
  navigate('/DomainSelector');
};

/**
 * Generic navigation utility
 * @param navigate - The navigate function from useNavigate
 * @param path - The path to navigate to
 */
export const navigateTo = (navigate: (path: string) => void, path: string): void => {
  navigate(path);
};
