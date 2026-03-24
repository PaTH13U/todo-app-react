import { Card, Typography, Input, Button } from "antd";

const { Title } = Typography;

// 1. Khai báo "Đầu cắm" (Props) để nhận dữ liệu từ trạm thu phát App.tsx
interface LoginScreenProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onLogin: () => void;
  onGoogleLogin: () => void;
}

// 2. Lắp ráp giao diện
const LoginScreen = ({ 
  username, 
  setUsername, 
  password, 
  setPassword, 
  onLogin, 
  onGoogleLogin 
}: LoginScreenProps) => {
  return (
    <Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", textAlign: "center" }}>
      <Title level={3}>🔒 Đăng nhập hệ thống</Title>
      
      <Input
        placeholder="Tài khoản (gợi ý: admin)"
        size="large"
        style={{ marginBottom: "10px" }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input.Password
        placeholder="Mật khẩu (gợi ý: 123456)"
        size="large"
        style={{ marginBottom: "20px" }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onPressEnter={onLogin}
      />
      
      <Button type="primary" size="large" block onClick={onLogin} style={{ marginBottom: "15px" }}>
        Đăng nhập
      </Button>
      
      <div style={{ margin: "10px 0", color: "gray" }}>hoặc</div>

      <Button danger size="large" block onClick={onGoogleLogin}>
        Đăng nhập bằng Google
      </Button>
    </Card>
  );
};

export default LoginScreen;