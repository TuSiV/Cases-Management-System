'use client';

import { Card, Empty, Spin } from 'antd';
import { ReactNode } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartItem {
  [key: string]: string | number | undefined;
  name?: string;
  value?: number;
}

interface ChartProps {
  title: string;
  data: ChartItem[];
  type: 'bar' | 'pie';
  loading?: boolean;
  height?: number;
  dataKey?: string;
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  extra?: ReactNode;
}

const DEFAULT_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

const DashboardChart: React.FC<ChartProps> = ({
  title,
  data,
  type,
  loading = false,
  height = 300,
  dataKey = 'name',
  nameKey = 'name',
  valueKey = 'value',
  colors = DEFAULT_COLORS,
  extra,
}) => {
  const renderChart = () => {
    if (loading) {
      return (
        <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Empty description="暂无数据" />
        </div>
      );
    }

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={valueKey} fill={colors[0]} name="数量" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey={valueKey}
              nameKey={nameKey}
              label={({ name, percent }: { name?: string; percent?: number }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <Card
      title={title}
      extra={extra}
      style={{ height: '100%' }}
      bodyStyle={{ padding: '0 24px 24px' }}
    >
      {renderChart()}
    </Card>
  );
};

export default DashboardChart;