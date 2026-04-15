import { useState } from "react";
import { Spin } from "antd";

import {
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

// Import Routing
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginScreen from "./components/LoginScreen";

import { useAuth } from "./hooks/useAuth";
import TodoDashboard from "./pages/TodoDashboard";
import { useTasks } from "./hooks/useTasks";

export default function App() {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    isLoading,
    username: loggedInName,
    userUid,
    handleRegister,
    handleLogin,
    handleGoogleLogin,
    handleLogout,
  } = useAuth();

  // 👉 1. GỌI HỘP ĐEN VÀ LẤY ĐỒ RA XÀI
  const {
    tasks,
    setTasks,
    isFetching,
    addTask,
    deleteTask,
    toggleTask,
    editTask,
    reorderTasks,
  } = useTasks(userUid);

  // 👉 2. CÁC STATE CỦA GIAO DIỆN (Giữ nguyên)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Của Ticket 2
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // 👉 3. LOGIC LỌC VÀ THỐNG KÊ (Giữ nguyên, vì nó là giao diện)
  const filteredTasks = tasks
    .filter((t) =>
      filter === "all"
        ? true
        : filter === "completed"
          ? t.isCompleted
          : !t.isCompleted,
    )
    .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const inProgressCount = tasks.filter((t) => t.isCompleted === false).length;
  const isCompletedCount = tasks.filter((t) => t.isCompleted === true).length;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  // =====================================================================
  // GIAO DIỆN HIỂN THỊ (UI) KẾT HỢP ROUTING
  // =====================================================================

  // Đợi Firebase kiểm tra xong mới hiện giao diện
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Spin size="large" /> Đang kiểm tra an ninh...
      </div>
    );
  }

  return (
    <div style={{ padding: "50px", maxWidth: "600px", margin: "0 auto" }}>
      <Routes>
        {/* ---------- TRANG ĐĂNG NHẬP ---------- */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <LoginScreen
                username={loginEmail}
                setUsername={setLoginEmail}
                password={loginPassword}
                setPassword={setLoginPassword}
                onLogin={() => handleLogin(loginEmail, loginPassword)}
                onRegister={() => handleRegister(loginEmail, loginPassword)}
                onGoogleLogin={handleGoogleLogin}
              />
            )
          }
        />

        {/* ---------- TRANG CHỦ (TODO APP) ---------- */}
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <Navigate to="/login" />
            ) : (
              // RUỘT CỦA TODO APP ĐƯỢC NHÉT TRỰC TIẾP VÀO ĐÂY (Không bọc qua hàm nữa)

              <TodoDashboard
                setSearchQuery={setSearchQuery}
                searchQuery={searchQuery}
                isFetching={isFetching}
                loggedInName={loggedInName}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleLogout={() => {
                  handleLogout();
                  setTasks([]); // Gọi hàm xóa Firebase
                  navigate("/login"); // Đá sang trang login
                }}
                handleAddTask={() => {
                  if (inputValue.trim() !== "") {
                    addTask(inputValue); // Gửi chữ vào hộp đen
                    setInputValue(""); // Xóa trắng ô input
                  }
                }}
                handleDeleteTask={deleteTask}
                handleToggleTask={toggleTask}
                filter={filter}
                setFilter={setFilter}
                filteredTasks={filteredTasks}
                editingId={editingId}
                editingText={editingText}
                setEditingText={setEditingText}
                handleStartEdit={(task) => {
                  setEditingId(task.id);
                  setEditingText(task.name);
                }}
                handleSaveEdit={() => {
                  if (editingId) editTask(editingId, editingText);
                  setEditingId(null);
                }}
                sensors={sensors}
                handleDragEnd={reorderTasks}
                isCompleted={isCompletedCount}
                inProgressCount={inProgressCount}
              // ... Truyền tất cả các dây điện mà bạn đã khai báo ở Bước 2 vào đây ...
              />
            )
          }
        />
      </Routes>
    </div>
  );
}
