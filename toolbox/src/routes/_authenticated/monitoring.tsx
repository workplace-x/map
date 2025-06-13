import { createFileRoute } from '@tanstack/react-router';
// @ts-ignore - Legacy JSX component without types
import MonitoringDashboard from '../../components/MonitoringDashboard.jsx';

export const Route = createFileRoute('/_authenticated/monitoring')({
  component: () => <MonitoringDashboard />,
}); 