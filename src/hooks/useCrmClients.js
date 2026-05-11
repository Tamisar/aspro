import { useEffect, useState } from 'react';
import { fetchBirthdayClients } from '../services/crmApi';

export function useCrmClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadClients() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchBirthdayClients({ signal: controller.signal });
        setClients(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Не удалось загрузить данные из CRM');
          setClients([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadClients();

    return () => controller.abort();
  }, []);

  return { clients, loading, error };
}
