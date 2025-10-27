'use client';

import { Form, Input, Select, Button, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Affiliation, UserRole } from '@/types';

interface SearchValues {
  keyword?: string;
  role?: string;
  affiliation?: string;
}

interface UserSearchProps {
  onSearch: (values: SearchValues) => void;
  loading?: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({
  onSearch,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSearch = (values: SearchValues) => {
    onSearch(values);
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
                placeholder="用户名/姓名/邮箱"
                allowClear
                disabled={loading}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="role" label="用户角色">
              <Select
                placeholder="请选择用户角色"
                allowClear
                disabled={loading}
              >
                {Object.values(UserRole).map((value) => (
                  <Select.Option key={value} value={value}>
                    {value === UserRole.ADMIN ? '管理员' : value === UserRole.VIEWER ? '查看员' : '普通用户'}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

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

export default UserSearch;