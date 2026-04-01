import { Card, Typography, Input, Button, message } from "antd";
import { useState } from "react";

const { Title } = Typography;

interface LoginScreenProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onLogin: () => void;
  onGoogleLogin: () => void;
  onRegister: () => void;
}

const LoginScreen = ({
  username,
  setUsername,
  password,
  setPassword,
  onLogin,
  onGoogleLogin,
  onRegister,
}: LoginScreenProps) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegisterClick = () => {
    if (password !== confirmPassword) {
      message.error("Mật khẩu nhập lại không khớp!");
      return;
    }
    onRegister();
  };

  return (
    <Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", textAlign: "center" }}>
      <Title level={3}>{isRegisterMode ? " Đăng ký tài khoản" : " Đăng nhập hệ thống"}</Title>
      <p style={{ color: "gray", marginBottom: "20px" }}>
        {isRegisterMode ? "Tạo tài khoản mới để lưu trữ công việc" : "Vui lòng đăng nhập để tiếp tục"}
      </p>

      <Input
        placeholder="Email của bạn (VD: a@gmail.com)"
        size="large"
        style={{ marginBottom: "15px" }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input.Password
        placeholder="Mật khẩu (Ít nhất 6 ký tự)"
        size="large"
        style={{ marginBottom: isRegisterMode ? "15px" : "25px" }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onPressEnter={isRegisterMode ? handleRegisterClick : onLogin}
      />

      {isRegisterMode && (
        <Input.Password
          placeholder="Nhập lại mật khẩu"
          size="large"
          style={{ marginBottom: "25px" }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onPressEnter={handleRegisterClick}
        />
      )}

      {isRegisterMode ? (
        <Button type="primary" size="large" block onClick={handleRegisterClick} style={{ marginBottom: "15px" }}>
          Đăng ký ngay
        </Button>
      ) : (
        <Button type="primary" size="large" block onClick={onLogin} style={{ marginBottom: "15px" }}>
          Đăng nhập
        </Button>
      )}

      <div style={{ marginBottom: "15px" }}>
        {isRegisterMode ? (
          <span>Đã có tài khoản? <a onClick={() => setIsRegisterMode(false)}>Đăng nhập</a></span>
        ) : (
          <span>Chưa có tài khoản? <a onClick={() => setIsRegisterMode(true)}>Đăng ký</a></span>
        )}
      </div>

      <div style={{ margin: "10px 0", color: "gray" }}>hoặc</div>

      <Button danger size="large" block onClick={onGoogleLogin}>
        Đăng nhập bằng Google
      </Button>
    </Card>
  );
};

export default LoginScreen;