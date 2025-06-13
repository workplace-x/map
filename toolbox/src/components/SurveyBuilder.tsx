import React, { useEffect, useRef, useState } from 'react';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';

interface SurveyBuilderProps {
  formId?: string;
  onSave?: (form: any) => void;
}

const API_BASE = '/api/forms';

const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ formId, onSave }) => {
  const [surveyJson, setSurveyJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const rawToken = useAuthStore.getState().accessToken || localStorage.getItem('sb-access-token');
  const accessToken = rawToken || undefined;
  const creatorRef = useRef<SurveyCreator | null>(null);

  useEffect(() => {
    if (formId) {
      setLoading(true);
      apiFetch(`${API_BASE}/${formId}`, {}, accessToken)
        .then((data: any) => {
          if (data && typeof data.schema === 'object' && data.schema !== null) {
            setSurveyJson(data.schema);
          } else {
            setSurveyJson({});
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load form');
          setSurveyJson({});
          setLoading(false);
        });
    } else {
      setSurveyJson({});
    }
  }, [formId, accessToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const method = formId ? 'PUT' : 'POST';
      const url = formId ? `${API_BASE}/${formId}` : API_BASE;
      const creator = creatorRef.current;
      const json = creator ? creator.JSON : surveyJson;
      const data = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: json.title || 'Untitled Survey',
          description: json.description || '',
          schema: json,
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

  // Initialize creator only once
  if (!creatorRef.current) {
    creatorRef.current = new SurveyCreator({});
    creatorRef.current.JSON = surveyJson;
    // Set primary accent color to black
    const blackTheme = {
      cssVariables: {
        "--primary": "#000000"
      }
    };
    creatorRef.current.theme = blackTheme;
  }

  if (loading) return <div>Loading form...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!surveyJson) return null;

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .custom-save-btn {
          background: #000;
          color: #fff;
          border: none;
          border-radius: 0;
          font-weight: 600;
          font-size: 1.1rem;
          padding: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          opacity: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .custom-save-btn:disabled {
          background: #444;
          cursor: not-allowed;
        }
        .custom-save-btn:hover:not(:disabled) {
          background: #222;
        }
        .svc-creator {
          height: 100%;
          min-height: 0;
          max-height: 100%;
        }
        .save-btn-bar {
          height: 3vh;
          min-height: 32px;
          width: 100%;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
        }
      `}</style>
      <div style={{ flex: 1, minHeight: 0 }}>
        <SurveyCreatorComponent creator={creatorRef.current!} />
      </div>
      <div className="save-btn-bar">
        <button
          className="custom-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Survey'}
        </button>
      </div>
    </div>
  );
};

export default SurveyBuilder; 