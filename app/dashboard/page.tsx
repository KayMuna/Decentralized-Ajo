'use client';

import React, { useState, useEffect } from 'react';
import { Dashboard } from '@/components/dashboard';
import { useWallet } from '@/lib/wallet-context';

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      // Simulate data fetching
      // In a real app, you would fetch this from your Soroban contract or backend API
      const fetchData = async () => {
        setLoading(true);
        try {
          // Mock data based on the requested structure
          const mockGroups = [
            {
              id: '1',
              name: 'Lagos Savings Circle',
              balance: 1500,
              nextCycle: 'Dec 15, 2026',
            },
            {
              id: '2',
              name: 'Tech Builders Ajo',
              balance: 2450,
              nextCycle: 'Jan 02, 2027',
            },
            {
              id: '3',
              name: 'Family Education Fund',
              balance: 500,
              nextCycle: 'Dec 28, 2026',
            },
          ];
          
          // Using a small timeout to simulate network lag
          setTimeout(() => {
            setActiveGroups(mockGroups);
            setLoading(false);
          }, 800);
        } catch (error) {
          console.error('Error fetching Ajo groups:', error);
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Dashboard activeGroups={activeGroups} />
    </main>
  );
}
