import React from 'react';

export const PasoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-xl shadow p-6 mb-6 w-full">
    {children}
  </div>
);
