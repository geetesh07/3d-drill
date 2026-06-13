import React, { createContext, useContext, useState, useEffect } from 'react';

type SettingsContextType = {
  showToasts: boolean;
  setShowToasts: (show: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  showToasts: true,
  setShowToasts: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from localStorage if available
  const [showToasts, setShowToasts] = useState<boolean>(() => {
    const saved = localStorage.getItem('parametric-drill-showToasts');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('parametric-drill-showToasts', JSON.stringify(showToasts));
  }, [showToasts]);

  return (
    <SettingsContext.Provider value={{ showToasts, setShowToasts }}>
      {children}
    </SettingsContext.Provider>
  );
}; 