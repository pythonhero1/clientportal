import { useState, useEffect, useCallback } from 'react';
import { fetchProjectInvoices } from '../../../services/invoices-api.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { fetchProjects } from '../../../services/projects-api.js';

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotBillingContact, setIsNotBillingContact] = useState<boolean>(false);

  const loadProjects = useCallback(async () => {
    try {
      const projs = await fetchProjects();
      if (projs && projs.length > 0) {
        setProjects(projs);
        setSelectedProjectId((prev) => prev || projs[0].id);
      } else {
        setProjects([{ id: 'proj_default', name: 'Active Project' }]);
        setSelectedProjectId('proj_default');
      }
    } catch {
      setProjects([{ id: 'proj_default', name: 'Active Project' }]);
      setSelectedProjectId('proj_default');
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    setIsNotBillingContact(false);

    try {
      const data = await fetchProjectInvoices(selectedProjectId);
      setInvoices(data);
    } catch (err: any) {
      if (err.message === 'NOT_BILLING_CONTACT') {
        setIsNotBillingContact(true);
        setInvoices([]);
      } else {
        setError(err.message || 'Failed to load invoices.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadInvoices();
    }
  }, [selectedProjectId, loadInvoices]);

  return {
    invoices,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    loading,
    error,
    isNotBillingContact,
    refetch: loadInvoices,
  };
}
