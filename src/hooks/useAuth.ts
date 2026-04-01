import { useState, useEffect } from "react";
import { message } from "antd";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase"; // Nhớ để ý đường dẫn file firebase

export function useAuth() {
  // 1. Các Balo chứa dữ liệu người dùng
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [userUid, setUserUid] = useState<string | null>(null);

  // 2. Camera giám sát trạng thái đăng nhập
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUsername(user.displayName || "Sếp");
        setUserUid(user.uid);
      } else {
        setIsLoggedIn(false);
        setUsername("");
        setUserUid(null);
      }
      setIsLoading(false); // <-- THÊM DÒNG NÀY: Kiểm tra xong rồi thì tắt trạng thái Đang tải
    });
    return () => unsubscribe();
  }, []);

  // 3. Các hàm hành động (Hút từ App.tsx sang)
  const handleRegister = (email: string, pass: string) => {
    if (!email || !pass) return message.warning("Vui lòng nhập đủ Email và Mật khẩu!");
    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => message.success("Đăng ký thành công! Đã tự động đăng nhập."))
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") message.error("Email này đã được sử dụng!");
        else if (error.code === "auth/weak-password") message.error("Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!");
        else message.error("Lỗi đăng ký: " + error.message);
      });
  };

  const handleLogin = (email: string, pass: string) => {
    if (!email || !pass) return message.warning("Vui lòng nhập đủ Email và Mật khẩu!");
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => message.success("Đăng nhập thành công!"))
      .catch((error) => {
        if (error.code === "auth/invalid-credential") message.error("Sai Email hoặc Mật khẩu!");
        else message.error("Đăng nhập thất bại!");
      });
  };

  const handleGoogleLogin = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        setIsLoggedIn(true);
        setUsername(result.user.displayName || "Sếp");
        setUserUid(result.user.uid);
      })
      .catch((error) => {
        console.error("LỖI FIREBASE:", error);
        message.error("Đăng nhập bằng Google thất bại!");
      });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setUserUid(null);
    message.info("Đã đăng xuất!");
    if (auth.currentUser) signOut(auth);
  };

  // 4. ĐÓNG GÓI TẤT CẢ LẠI VÀ GIAO CHO APP.TSX XÀI
  return {
    isLoggedIn,
    isLoading,
    username,
    userUid,
    handleRegister,
    handleLogin,
    handleGoogleLogin,
    handleLogout,
  };
}