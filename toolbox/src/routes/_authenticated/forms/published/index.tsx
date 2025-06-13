import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';

interface FormMeta {
  id: string;
  name: string;
  description?: string;
  is_public?: boolean;
}

export const Route = createFileRoute('/_authenticated/forms/published/')({
  component: PublishedFormsPage,
});

function PublishedFormsPage() {
  const [forms, setForms] = useState<FormMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/forms')
      .then(res => res.json())
      .then(data => {
        setForms((data || []).filter((f: any) => f.is_public));
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load forms');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading published forms...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Published Forms</h1>
      {forms.length === 0 ? (
        <div>No published forms found.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {forms.map(form => (
            <li key={form.id} style={{ marginBottom: 16 }}>
              <a href={`/forms/published/${form.id}`} style={{ fontSize: 20, fontWeight: 500 }}>
                {form.name}
              </a>
              {form.description && <div style={{ color: '#666' }}>{form.description}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 