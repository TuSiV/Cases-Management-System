'use client';

import React from 'react';
import { Card, Statistic } from 'antd';
import { StatisticProps } from 'antd/es/statistic/Statistic';

interface StatCardProps extends Omit<StatisticProps, 'title'> {
  title: React.ReactNode;
  loading?: boolean;
  color?: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  loading = false, 
  color = '#1890ff',
  icon,
  ...rest 
}) => {
  return (
    <Card 
      loading={loading} 
      bordered={false} 
      className="stat-card"
    >
      <div className="stat-card-header">
        {icon && <div className="stat-card-icon" style={{ color }}>{icon}</div>}
        <div className="stat-card-title">{title}</div>
      </div>
      <Statistic 
        value={value} 
        valueStyle={{ color }} 
        {...rest} 
      />
      
      <style jsx global>{`
        .stat-card {
          height: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
          transition: all 0.3s;
        }
        
        .stat-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }
        
        .stat-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .stat-card-icon {
          font-size: 24px;
          margin-right: 12px;
        }
        
        .stat-card-title {
          font-size: 16px;
          color: rgba(0, 0, 0, 0.65);
        }
        
        .stat-card .ant-statistic-content {
          font-size: 24px;
          font-weight: 600;
        }
      `}</style>
    </Card>
  );
};

export default StatCard;