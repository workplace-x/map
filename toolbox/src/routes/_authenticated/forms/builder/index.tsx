import { createFileRoute } from '@tanstack/react-router';
import SurveyBuilder from '@/components/SurveyBuilder';

export const Route = createFileRoute('/_authenticated/forms/builder/')({
  component: () => (
    <div
      style={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1 }}>
        <SurveyBuilder />
      </div>
    </div>
  ),
}); 