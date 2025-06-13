import React, { useEffect, useState } from 'react';
import { Model, settings } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';

interface SurveyRendererProps {
  formId: string;
  onSubmit?: (result: any) => void;
}

const API_BASE = '/api/forms';

const SurveyRenderer: React.FC<SurveyRendererProps> = ({ formId, onSubmit }) => {
  const [surveyJson, setSurveyJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const rawToken = useAuthStore.getState().accessToken || localStorage.getItem('sb-access-token');
  const accessToken = rawToken || undefined;

  useEffect(() => {
    setLoading(true);
    apiFetch(`${API_BASE}/${formId}`, {}, accessToken)
      .then((data: any) => {
        if (data && typeof data.schema === 'object' && data.schema !== null) {
          setSurveyJson(data.schema);
        } else {
          setSurveyJson(null);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load form');
        setSurveyJson(null);
        setLoading(false);
      });
  }, [formId, accessToken]);

  const handleComplete = async (survey: Model) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = survey.data;
      await apiFetch(`${API_BASE}/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: result }),
      }, accessToken);
      setSubmitted(true);
      if (onSubmit) onSubmit(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!surveyJson) return <div>Form not found.</div>;
  if (submitted) return <div>Thank you for your submission!</div>;

  const survey = new Model(surveyJson);
  survey.onComplete.add(handleComplete);

  return (
    <div>
      <Survey model={survey} />
      {submitting && <div>Submitting...</div>}
    </div>
  );
};

export default SurveyRenderer; 