'use client';

import { Form, Input, Select, DatePicker, Button, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Affiliation, CaseStatus, CaseType } from '@/types';
import dayjs from 'dayjs';

// 表单数据类型
interface CaseSearchFormData {
  keyword?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  affiliation?: Affiliation;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

// 格式化后的搜索参数类型
interface FormattedSearchParams {
  keyword?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  affiliation?: Affiliation;
  startDate?: string;
  endDate?: string;
}

interface CaseSearchProps {
  onSearch: (values: FormattedSearchParams) => void;
  loading?: boolean;
  showAffiliation?: boolean;
}

const CaseSearch: React.FC<CaseSearchProps> = ({
  onSearch,
  loading = false,
  showAffiliation = false,
}) => {
  const [form] = Form.useForm<CaseSearchFormData>();

  const handleSearch = (values: CaseSearchFormData) => {
    // 处理日期范围
    const { dateRange, ...restValues } = values;
    const formattedValues: FormattedSearchParams = { ...restValues };
    
    if (dateRange && dateRange.length === 2) {
      formattedValues.startDate = dateRange[0].format('YYYY-MM-DD');
      formattedValues.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    onSearch(formattedValues);
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  return (
    <Card bordered={false} style={{ marginBottom: 16 }}>
      <Form form={form} onFinish={handleSearch} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="keyword" label="关键词搜索">
              <Input
                placeholder="案件名称/案号/当事人"
                allowClear
                disabled={loading}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="status" label="案件状态">
              <Select
                placeholder="请选择案件状态"
                allowClear
                disabled={loading}
              >
                {Object.values(CaseStatus).map((value) => (
                  <Select.Option key={value} value={value}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="caseType" label="案件类型">
              <Select
                placeholder="请选择案件类型"
                allowClear
                disabled={loading}
              >
                {Object.values(CaseType).map((value) => (
                  <Select.Option key={value} value={value}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {showAffiliation && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="affiliation" label="隶属">
                <Select
                  placeholder="请选择隶属"
                  allowClear
                  disabled={loading}
                >
                  {Object.values(Affiliation).map((value) => (
                    <Select.Option key={value} value={value}>
                      {value}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="dateRange" label="立案日期范围">
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                disabled={loading}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label=" " colon={false}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
                style={{ marginRight: 8 }}
              >
                搜索
              </Button>
              <Button
                onClick={handleReset}
                icon={<ReloadOutlined />}
                disabled={loading}
              >
                重置
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default CaseSearch;