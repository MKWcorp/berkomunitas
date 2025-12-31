import { useState, useEffect } from 'react';
import { useSSOUser } from './useSSOUser';

export function useAdminStatus() {
  const { user, isLoaded } = useSSOUser();
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    fetch('/api/admin/privileges', {
      headers: { 'x-user-email': user.email }
    })
    .then(res => res.json())
    .then(data => {
      setIsAdmin(data.isAdmin || false);
      setLoading(false);
    })
    .catch(() => {
      setIsAdmin(false);
      setLoading(false);
    });
  }, [isLoaded, user]);

  return { 
    isAdmin: isAdmin === true, 
    loading: loading || !isLoaded 
  };
}
