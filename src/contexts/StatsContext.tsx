'use client';

import React, { createContext, useContext, useState } from 'react';

interface StatsContextType {
  refreshTrigger: number;
  refreshStats: () => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshStats = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <StatsContext.Provider value={{ refreshTrigger, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}
