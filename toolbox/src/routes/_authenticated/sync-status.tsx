import { createFileRoute } from '@tanstack/react-router';
import SyncStatusDashboard from '../../components/SyncStatusDashboard';

export const Route = createFileRoute('/_authenticated/sync-status')({
  component: () => <SyncStatusDashboard />,
}); 