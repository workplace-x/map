import { createFileRoute } from '@tanstack/react-router';
import SurveyRenderer from '@/components/SurveyRenderer';

export const Route = createFileRoute('/_authenticated/forms/published/[formId]')({
  component: PublishedFormPage,
});

function PublishedFormPage() {
  const { formId } = Route.useParams() as { formId: string };
  if (!formId) return <div>Form not found.</div>;
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Fill Out Form</h1>
      <SurveyRenderer formId={formId} />
    </div>
  );
} 