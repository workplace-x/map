import React, { useEffect, useState } from 'react';
import { FormBuilder } from 'react-formio';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';

interface FormBuilderProps {
  formId?: string;
  onSave?: (form: any) => void;
}

const API_BASE = '/api/forms';

const FormBuilderComponent: React.FC<FormBuilderProps> = ({ formId, onSave }) => {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const rawToken = useAuthStore.getState().accessToken || localStorage.getItem('sb-access-token');
  const accessToken = rawToken || undefined;

  useEffect(() => {
    if (formId) {
      setLoading(true);
      apiFetch(`${API_BASE}/${formId}`, {}, accessToken)
        .then((data: any) => {
          console.log('Fetched form data:', data);
          if (data && typeof data.schema === 'object' && data.schema !== null && !Array.isArray(data.schema)) {
            setForm(data.schema);
          } else {
            setForm({ display: 'form', components: [] });
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load form');
          setForm({ display: 'form', components: [] });
          setLoading(false);
        });
    } else {
      setForm({ display: 'form', components: [] });
    }
  }, [formId, accessToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const method = formId ? 'PUT' : 'POST';
      const url = formId ? `${API_BASE}/${formId}` : API_BASE;
      const data = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form?.title || 'Untitled Form',
          description: form?.description || '',
          schema: form,
          is_public: true,
        }),
      }, accessToken);
      if (onSave) onSave(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!form || typeof form !== 'object' || Array.isArray(form)) return null;

  console.log('FormBuilder form prop:', form);

  return (
    <div>
      <FormBuilder
        form={form}
        onChange={(f: any) => {
          if (f && typeof f === 'object' && !Array.isArray(f)) {
            setForm(f);
          }
        }}
        options={{
          builder: {
            data: true,
            layout: true,
            basic: true,
            advanced: true,
            premium: true,
          },
        }}
      />
      <button onClick={handleSave} disabled={saving} style={{ marginTop: 16 }}>
        {saving ? 'Saving...' : 'Save Form'}
      </button>
    </div>
  );
};

export default FormBuilderComponent; 