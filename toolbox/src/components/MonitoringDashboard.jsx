import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Grid, CircularProgress, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        const response = await fetch('/api/rfp-gpt/metrics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error) return <Typography color="error" sx={{ m: 4 }}>{error}</Typography>;
  if (!metrics) return null;

  const { current, recentSearches, topEntities, searchTrends } = metrics;

  const performanceData = Object.entries(current).map(([key, value]) => ({
    name: key,
    avgTime: value.avgTime,
    errorRate: value.errorRate * 100
  }));

  const trendData = searchTrends.map(trend => ({
    hour: new Date(trend.hour).toLocaleTimeString(),
    successRate: trend.successRate * 100,
    total: trend.total
  }));

  const entityData = topEntities.map(entity => ({
    name: entity.name,
    value: entity.count
  }));

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">AI Dashboard</h1>
      </div>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Vector Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{current?.vectorSearch?.count ?? '—'}</div>
            <div className="text-muted-foreground text-xs mt-1">Avg Time: {current?.vectorSearch?.avgTime ? `${current.vectorSearch.avgTime.toFixed(0)} ms` : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Keyword Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{current?.keywordSearch?.count ?? '—'}</div>
            <div className="text-muted-foreground text-xs mt-1">Avg Time: {current?.keywordSearch?.avgTime ? `${current.keywordSearch.avgTime.toFixed(0)} ms` : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Re-Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{current?.reRanking?.count ?? '—'}</div>
            <div className="text-muted-foreground text-xs mt-1">Avg Time: {current?.reRanking?.avgTime ? `${current.reRanking.avgTime.toFixed(0)} ms` : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entity Extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{current?.entityExtraction?.count ?? '—'}</div>
            <div className="text-muted-foreground text-xs mt-1">Avg Time: {current?.entityExtraction?.avgTime ? `${current.entityExtraction.avgTime.toFixed(0)} ms` : '—'}</div>
          </CardContent>
        </Card>
      </div>
      {/* Main Charts and Entities */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgTime" name="Average Time (ms)" fill="#8884d8" />
                <Bar dataKey="errorRate" name="Error Rate (%)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={entityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {entityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Search Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="successRate" name="Success Rate (%)" stroke="#8884d8" />
              <Line type="monotone" dataKey="total" name="Total Searches" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* Recent Searches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {recentSearches.map((search, index) => (
              <Box key={index} sx={{ mb: 2, p: 1, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2">
                  {new Date(search.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body2">{search.question}</Typography>
                {search.entities && (
                  <Typography variant="caption" color="text.secondary">
                    Entities: {Object.values(search.entities).flat().join(', ')}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard; 