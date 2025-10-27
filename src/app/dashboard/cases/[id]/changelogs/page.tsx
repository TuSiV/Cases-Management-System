'use client'

import { useState, useEffect } from 'react'
import { Card, Typography, Button, Spin, message, Table, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Case } from '@/types'

const { Title } = Typography
const { Column } = Table

interface CaseChangeLog {
  id: string
  caseId: string
  changedById: string
  changeTime: string
  changedFields: string[]
  oldValues: Record<string, any>
  newValues: Record<string, any>
  changeDescription: string
  changedBy?: {
    name: string
    role: string
    affiliation: string
  }
}

export default function CaseChangeLogsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [changeLogs, setChangeLogs] = useState<CaseChangeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCaseDataAndChangeLogs = async () => {
      try {
        setLoading(true)
        // 同时获取案件详情和变更日志
        const [caseResponse, logsResponse] = await Promise.all([
          axios.get(`/api/cases/${params.id}`),
          axios.get(`/api/cases/${params.id}/changelogs`)
        ])
        
        setCaseData(caseResponse.data)
        setChangeLogs(logsResponse.data.changeLogs || [])
      } catch (error) {
        console.error('获取数据失败:', error)
        message.error('获取数据失败')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCaseDataAndChangeLogs()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const renderChangedFields = (fields: string[]) => {
    return fields.map((field, index) => (
      <Tag key={index} color="blue" style={{ marginRight: 8, marginBottom: 4 }}>
        {getFieldDisplayName(field)}
      </Tag>
    ))
  }

  const getFieldDisplayName = (fieldName: string) => {
    // 映射字段名到显示名
    const fieldMap: Record<string, string> = {
      caseName: '案件名称',
      caseType: '案件类型',
      filingDate: '立案日期',
      status: '结案情况',
      affiliation: '隶属',
      plaintiffName: '原告名称',
      defendantName: '被告名称',
      claimAmount: '案件标的额',
      // 可以根据实际需要添加更多映射
    }
    return fieldMap[fieldName] || fieldName
  }

  const renderValueComparison = (oldValue: any, newValue: any, fieldName: string) => {
    // 对于日期类型的字段进行特殊处理
    if (fieldName.includes('Date')) {
      oldValue = oldValue ? new Date(oldValue).toLocaleDateString('zh-CN') : '-'
      newValue = newValue ? new Date(newValue).toLocaleDateString('zh-CN') : '-'
    }
    
    return (
      <div>
        <div style={{ color: '#ff4d4f', marginBottom: 4 }}>原值: {oldValue || '-'}</div>
        <div style={{ color: '#52c41a' }}>新值: {newValue || '-'}</div>
      </div>
    )
  }

  const renderDetailedChanges = (record: CaseChangeLog) => {
    return (
      <div>
        {record.changedFields.map((field, index) => (
          <div key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{getFieldDisplayName(field)}</div>
            {renderValueComparison(record.oldValues[field], record.newValues[field], field)}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push(`/dashboard/cases/${params.id}`)}
        >
          返回案件详情
        </Button>
        {caseData && (
          <Title level={4} style={{ margin: 0 }}>案件变更记录 - {caseData.caseName}</Title>
        )}
        <div></div> {/* 占位，保持标题居中 */}
      </div>

      <Card>
        <Table 
          dataSource={changeLogs} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          style={{ marginBottom: 16 }}
        >
          <Column 
            title="变更时间" 
            dataIndex="changeTime" 
            key="changeTime"
            render={(text) => formatDate(text)}
            sorter={(a, b) => new Date(a.changeTime).getTime() - new Date(b.changeTime).getTime()}
            defaultSortOrder="descend"
          />
          <Column 
            title="操作人" 
            dataIndex="changedBy" 
            key="changedBy"
            render={(user) => user ? `${user.name} (${user.role})` : '-'}
          />
          <Column 
            title="变更描述" 
            dataIndex="changeDescription" 
            key="changeDescription"
          />
          <Column 
            title="变更字段" 
            dataIndex="changedFields" 
            key="changedFields"
            render={(fields) => renderChangedFields(fields)}
          />
          <Column 
            title="详细变更" 
            key="detail"
            render={(record) => renderDetailedChanges(record)}
          />
        </Table>
        
        {changeLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无变更记录
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}