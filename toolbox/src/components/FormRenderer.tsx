import React, { useEffect, useState } from 'react';
import { Form } from 'react-formio';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';

interface FormRendererProps {
  formId: string;
  onSubmitSuccess?: (submission: any) => void;
}

const API_BASE = '/api/forms';

const FormRenderer: React.FC<FormRendererProps> = ({ formId, onSubmitSuccess }) => {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const rawToken = useAuthStore.getState().accessToken || localStorage.getItem('sb-access-token');
  const accessToken = rawToken || undefined;

  useEffect(() => {
    setLoading(true);
    apiFetch(`${API_BASE}/${formId}`, {}, accessToken)
      .then((data: any) => {
        setForm(data?.schema || {});
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load form');
        setLoading(false);
      });
  }, [formId, accessToken]);

  const handleSubmit = async (submission: any) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await apiFetch(`${API_BASE}/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: submission.data }),
      }, accessToken);
      if (onSubmitSuccess) onSubmitSuccess(data);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!form) return null;

  return (
    <div>
      <Form
        form={form}
        onSubmit={handleSubmit}
        options={{
          readOnly: false,
        }}
      />
      {submitting && <div>Submitting...</div>}
      {submitError && <div style={{ color: 'red' }}>{submitError}</div>}
    </div>
  );
};

export default FormRenderer; 