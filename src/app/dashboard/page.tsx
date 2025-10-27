'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Spin, Popover, Modal, Button } from 'antd'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, WalletOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CaseStatus, UserRole, Case } from '@/types'

// 定义圆环图数据项类型
interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: any;
}
import axios from 'axios'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    totalCases: number;
    pendingCases: number;
    activeCases: number;
    trialConcludedCases: number;
    closedCases: number;
    totalUsers: number;
    totalCaseBalance: number;
    affiliationBalanceData: ChartDataItem[];
    caseTypeBalanceData: ChartDataItem[];
  }>({
    totalCases: 0,
    pendingCases: 0,
    activeCases: 0,
    trialConcludedCases: 0,
    closedCases: 0,
    totalUsers: 0,
    totalCaseBalance: 0,
    affiliationBalanceData: [],
    caseTypeBalanceData: []
  })
  const [recentCases, setRecentCases] = useState<Case[]>([])

  // 固定小卡高度与动态缩放字体
  const CARD_HEIGHT = 120
  const [isMobile, setIsMobile] = useState(false)
  const [affiliationModalOpen, setAffiliationModalOpen] = useState(false)
  const [caseTypeModalOpen, setCaseTypeModalOpen] = useState(false)

// 合并显示“标签 + 金额(万元)（比例%）”的饼图浮窗自定义提示
const renderPieTooltip = (info: any) => {
  const { active, payload } = info || {}
  if (active && payload && payload.length) {
    const p = payload[0]
    const name = (p && (p.name ?? p.payload?.name)) || ''
    const amountWan = (Number(p.value) / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const percent = typeof p?.percent === 'number' ? (p.percent * 100).toFixed(2) : undefined
    return (
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: '6px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {`${name} ${amountWan} 万元${percent != null ? `（${percent}%）` : ''}`}
      </div>
    )
  }
  return null
}

// 自定义高亮形状（activeShape）：扩大外半径并加粗边框以提升选中反馈
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
      />
    </g>
  )
}

// 点击选中项（浮窗饼图）
const [affiliationSelected, setAffiliationSelected] = useState<{ name: string; value: number } | null>(null)
const [caseTypeSelected, setCaseTypeSelected] = useState<{ name: string; value: number } | null>(null)
const [affiliationActiveIndex, setAffiliationActiveIndex] = useState<number | undefined>(undefined)
const [caseTypeActiveIndex, setCaseTypeActiveIndex] = useState<number | undefined>(undefined)
const affiliationLastTapRef = useRef<number>(0)
const caseTypeLastTapRef = useRef<number>(0)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const getFontSizeByValue = (val: number | string) => {
    const s = String(val).replace(/[\,\s]/g, '')
    const len = s.length
    if (isMobile) {
      if (len <= 4) return 24
      if (len <= 6) return 20
      if (len <= 8) return 18
      return 16
    }
    if (len <= 4) return 28
    if (len <= 6) return 24
    if (len <= 8) return 20
    return 18
  }
  const getValueStyle = (val: number | string, color?: string) => ({
    color: color || undefined,
    fontSize: getFontSizeByValue(val),
    fontWeight: 600,
    lineHeight: '1.2',
    textAlign: 'center' as const,
    whiteSpace: (isMobile && String(val).replace(/[\,\s]/g, '').length > 10) ? 'normal' : 'nowrap',
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const statsResponse = await axios.get('/api/dashboard/stats')
        const casesResponse = await axios.get('/api/dashboard/recent-cases')
        
        setStats(statsResponse.data)
        setRecentCases(casesResponse.data)
      } catch (error) {
        console.error('获取仪表盘数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const baseColumns = [
    {
      title: '案件号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
    },
    {
      title: '案件名称',
      dataIndex: 'caseName',
      key: 'caseName',
    },
    {
      title: '立案日期',
      dataIndex: 'filingDate',
      key: 'filingDate',
      render: (text: string) => new Date(text).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: CaseStatus) => {
        let color = 'blue'
        if (status === CaseStatus.PENDING) {
          color = 'gold'
        } else if (
          status === CaseStatus.TRIAL_CONCLUDED || 
          status === CaseStatus.EXECUTION_CONCLUDED || 
          status === CaseStatus.MEDIATION || 
          status === CaseStatus.SETTLEMENT
        ) {
          color = 'green'
        } else if (status === CaseStatus.WITHDRAWN || status === CaseStatus.BANKRUPTCY) {
          color = 'red'
        }
        return <Tag color={color}>{status}</Tag>
      },
    },
  ]
  const columns = isMobile ? baseColumns.filter(c => c.key !== 'caseNumber') : baseColumns

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
      <h1 style={{ marginBottom: 24 }}>案件情况</h1>
      
      <Row className="dashboard-stats" gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} md={6}>
            <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => router.push('/dashboard/cases?inHand=1')}>
              <Statistic 
                title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>当年处置案件<Popover content="当年案件余额不为0的案件（含刑事）" trigger="click" placement="top"><InfoCircleOutlined style={{ color: '#8c8c8c' }} /></Popover></span>} 
                value={stats.activeCases || 0} 
                prefix={<ClockCircleOutlined />} 
                valueStyle={getValueStyle(stats.activeCases || 0, '#fa8c16')}
                style={{ textAlign: 'center' }}
              />
            </Card>
            </Col>
          <Col xs={12} md={6}>
            <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/cases?status=${encodeURIComponent(CaseStatus.PENDING)}`)}>
              <Statistic 
                title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>未结案件<Popover content="案件状态为未结案的案件（含刑事）" trigger="click" placement="top"><InfoCircleOutlined style={{ color: '#8c8c8c' }} /></Popover></span>} 
                value={stats.pendingCases} 
                prefix={<ClockCircleOutlined />}
                valueStyle={getValueStyle(stats.pendingCases, '#faad14')}
                style={{ textAlign: 'center' }}
              />
            </Card>
            </Col>
            <Col xs={12} md={6}>
            <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/cases?status=${encodeURIComponent(CaseStatus.TRIAL_CONCLUDED)}`)}>
              <Statistic 
                title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>审结案件<Popover content="案件状态为审结的案件（含刑事）" trigger="click" placement="top"><InfoCircleOutlined style={{ color: '#8c8c8c' }} /></Popover></span>} 
                value={stats.trialConcludedCases} 
                prefix={<FileTextOutlined />} 
                valueStyle={getValueStyle(stats.trialConcludedCases, '#1890ff')}
                style={{ textAlign: 'center' }}
              />
            </Card>
            </Col>
            <Col xs={12} md={6}>
            <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => router.push('/dashboard/cases?statusGroup=closed')}>
              <Statistic 
                title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>已结案件<Popover content="案件状态为执结、撤诉、破产等的案件（含刑事）" trigger="click" placement="top"><InfoCircleOutlined style={{ color: '#8c8c8c' }} /></Popover></span>} 
                value={stats.closedCases} 
                prefix={<CheckCircleOutlined />} 
                valueStyle={getValueStyle(stats.closedCases, '#52c41a')}
                style={{ textAlign: 'center' }}
              />
            </Card>
            </Col>
            <Col xs={12} md={6}>
            <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Statistic 
                title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>案件标的余额总数<Popover content="当年案件余额总数（含刑事）" trigger="click" placement="top"><InfoCircleOutlined style={{ color: '#8c8c8c' }} /></Popover></span>}
                value={(stats.totalCaseBalance / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                precision={2}
                prefix={<WalletOutlined />}
                valueStyle={getValueStyle((stats.totalCaseBalance / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '#1890ff')}
                suffix="万元"
                style={{ textAlign: 'center' }}
              />
            </Card>
            </Col>
            <Col xs={12} md={6}>
            <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Statistic 
                title="案件总数" 
                value={stats.totalCases} 
                prefix={<FileTextOutlined />}
                valueStyle={getValueStyle(stats.totalCases)}
                style={{ textAlign: 'center' }}
              />
            </Card>
          </Col>
          {session?.user?.role === UserRole.ADMIN && (
            <Col xs={12} md={6}>
              <Card bodyStyle={{ padding: isMobile ? 12 : 24 }} style={{ height: CARD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Statistic 
                  title="用户总数" 
                  value={stats.totalUsers} 
                  prefix={<TeamOutlined />} 
                  valueStyle={getValueStyle(stats.totalUsers)}
                  style={{ textAlign: 'center' }}
                />
              </Card>
            </Col>
          )}
        </Row>

      {(session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.VIEWER || session?.user?.role?.toLowerCase() === 'supervisor') ? (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card title="各隶属案件标的余额占比">
              <div style={{ height: 300, cursor: isMobile ? 'pointer' : 'default' }} onClick={() => isMobile && setAffiliationModalOpen(true)}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 12, right: isMobile ? 56 : 24, bottom: 12, left: isMobile ? 56 : 24 }}>
                      <Pie
                        data={stats.affiliationBalanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={isMobile ? 80 : 100}
                        innerRadius={isMobile ? 50 : 60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name && name.length > 4 ? name.substring(0, 4) : name || ''}: ${(percent as number * 100).toFixed(0)}%`}
                      >
                        {stats.affiliationBalanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6fa0d4', '#d98b8b', '#e2b866', '#8ec1a7', '#a48bd1', '#7fc0c0', '#d48fb0', '#8fa8d8', '#d99b66', '#a8d08b'][index % 10]} />
                        ))}
                      </Pie>
                      <Tooltip content={renderPieTooltip as any} />
                    </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="案件类型标的余额占比">
              <div style={{ height: 300, cursor: isMobile ? 'pointer' : 'default' }} onClick={() => isMobile && setCaseTypeModalOpen(true)}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 12, right: isMobile ? 56 : 24, bottom: 12, left: isMobile ? 56 : 24 }}>
                      <Pie
                        data={stats.caseTypeBalanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={isMobile ? 80 : 100}
                        innerRadius={isMobile ? 50 : 60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name && name.length > 4 ? name.substring(0, 4) : name || ''}: ${(percent as number * 100).toFixed(0)}%`}
                      >
                        {stats.caseTypeBalanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6fa0d4', '#e2b866', '#8ec1a7', '#a48bd1'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip content={renderPieTooltip as any} />
                    </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      ) : null}

      {/* 移动端完整圆环图浮窗 - 各隶属案件标的余额占比 */}
      <Modal
        title="各隶属案件标的余额占比"
        open={affiliationModalOpen}
        onCancel={() => setAffiliationModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setAffiliationModalOpen(false)}>关闭</Button>,
        ]}
        width={isMobile ? 360 : 520}
        bodyStyle={{ padding: isMobile ? 12 : 24 }}
      >
        <div style={{ height: isMobile ? 360 : 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Pie
                data={stats.affiliationBalanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={isMobile ? 120 : 140}
                innerRadius={isMobile ? 70 : 80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                activeIndex={affiliationActiveIndex}
                activeShape={renderActiveShape}
                onClick={(data: any, index: number) => {
                  const now = Date.now()
                  if (now - affiliationLastTapRef.current < 250) return
                  affiliationLastTapRef.current = now
                  const name = (data && (data.name ?? data.payload?.name)) || ''
                  const value = Number(data?.value ?? data?.payload?.value ?? 0)
                  setAffiliationSelected({ name, value })
                  setAffiliationActiveIndex(index)
                }}
                onTouchStart={(data: any, index: number) => {
                  setAffiliationActiveIndex(index)
                }}
                onTouchEnd={() => {
                  affiliationLastTapRef.current = Date.now()
                }}
              >
                {stats.affiliationBalanceData.map((entry, index) => (
                  <Cell key={`cell-modal-aff-${index}`} fill={`hsl(${index * 45}, 40%, 65%)`} />
                ))}
              </Pie>
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              <Tooltip content={renderPieTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {affiliationSelected && (() => {
          const total = stats.affiliationBalanceData.reduce((s, x) => s + (Number(x.value) || 0), 0)
          const percent = total ? ((Number(affiliationSelected.value) / total) * 100).toFixed(2) : '0.00'
          return (
            <div style={{ marginTop: 8, fontWeight: 600 }}>
              {`${affiliationSelected.name} ${(affiliationSelected.value / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 万元（${percent}%）`}
            </div>
          )
        })()}
        <div style={{ marginTop: 12 }}>
          {(() => {
            const total = stats.affiliationBalanceData.reduce((s, x) => s + (Number(x.value) || 0), 0)
            const rows = stats.affiliationBalanceData.map(d => ({
              key: d.name,
              name: d.name,
              amountWan: (Number(d.value) / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              percent: total ? ((Number(d.value) / total) * 100).toFixed(2) : '0.00'
            }))
            return (
              <Table
                size="small"
                columns={[
                  { title: '标签', dataIndex: 'name', key: 'name' },
                  { title: '金额(万元)', dataIndex: 'amountWan', key: 'amountWan' },
                  { title: '比例(%)', dataIndex: 'percent', key: 'percent' },
                ]}
                dataSource={rows}
                pagination={false}
              />
            )
          })()}
        </div>
      </Modal>

      {/* 移动端完整圆环图浮窗 - 案件类型标的余额占比 */}
      <Modal
        title="案件类型标的余额占比"
        open={caseTypeModalOpen}
        onCancel={() => setCaseTypeModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCaseTypeModalOpen(false)}>关闭</Button>,
        ]}
        width={isMobile ? 360 : 520}
        bodyStyle={{ padding: isMobile ? 12 : 24 }}
      >
        <div style={{ height: isMobile ? 360 : 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <Pie
                data={stats.caseTypeBalanceData.filter((item) => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={isMobile ? 120 : 140}
                innerRadius={isMobile ? 70 : 80}
                fill="#82ca9d"
                dataKey="value"
                nameKey="name"
                activeIndex={caseTypeActiveIndex}
                activeShape={renderActiveShape}
                onClick={(data: any, index: number) => {
                  const now = Date.now()
                  if (now - caseTypeLastTapRef.current < 250) return
                  caseTypeLastTapRef.current = now
                  const name = (data && (data.name ?? data.payload?.name)) || ''
                  const value = Number(data?.value ?? data?.payload?.value ?? 0)
                  setCaseTypeSelected({ name, value })
                  setCaseTypeActiveIndex(index)
                }}
                onTouchStart={(data: any, index: number) => {
                  setCaseTypeActiveIndex(index)
                }}
                onTouchEnd={() => {
                  caseTypeLastTapRef.current = Date.now()
                }}
              >
                {stats.caseTypeBalanceData.filter((item) => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-modal-type-${index}`} fill={`hsl(${index * 30}, 45%, 60%)`} />
                ))}
              </Pie>
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              <Tooltip content={renderPieTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {caseTypeSelected && (() => {
          const src = stats.caseTypeBalanceData.filter((item) => item.value > 0)
          const total = src.reduce((s, x) => s + (Number(x.value) || 0), 0)
          const percent = total ? ((Number(caseTypeSelected.value) / total) * 100).toFixed(2) : '0.00'
          return (
            <div style={{ marginTop: 8, fontWeight: 600 }}>
              {`${caseTypeSelected.name} ${(caseTypeSelected.value / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 万元（${percent}%）`}
            </div>
          )
        })()}
        <div style={{ marginTop: 12 }}>
          {(() => {
            const src = stats.caseTypeBalanceData.filter((item) => item.value > 0)
            const total = src.reduce((s, x) => s + (Number(x.value) || 0), 0)
            const rows = src.map(d => ({
              key: d.name,
              name: d.name,
              amountWan: (Number(d.value) / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              percent: total ? ((Number(d.value) / total) * 100).toFixed(2) : '0.00'
            }))
            return (
              <Table
                size="small"
                columns={[
                  { title: '标签', dataIndex: 'name', key: 'name' },
                  { title: '金额(万元)', dataIndex: 'amountWan', key: 'amountWan' },
                  { title: '比例(%)', dataIndex: 'percent', key: 'percent' },
                ]}
                dataSource={rows}
                pagination={false}
              />
            )
          })()}
        </div>
      </Modal>

      <Card title="最近案件" style={{ marginBottom: 24 }}>
        <Table 
          columns={columns} 
          dataSource={recentCases} 
          rowKey="id" 
          pagination={false}
          onRow={(record) => ({
            onClick: () => router.push(`/dashboard/cases/${record.id}`),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>
    </DashboardLayout>
  )
}