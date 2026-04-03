import { useState, useEffect } from "react";
import { Input, Button, List, Typography, Card, Radio, message, Spin, Empty } from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import axios from "axios";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Import Routing
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginScreen from "./components/LoginScreen";
import TaskItem, { type Task } from "./components/TaskItem";
import { useAuth } from "./hooks/useAuth";

const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL;
const { Title } = Typography;

export default function App() {
  const navigate = useNavigate(); // Anh tài xế chuyển trang
  const { isLoggedIn, isLoading, username: loggedInName, userUid, handleRegister, handleLogin, handleGoogleLogin, handleLogout } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // ==================== CÁC HÀM XỬ LÝ (GIỮ NGUYÊN) ====================
  useEffect(() => {
    if (!userUid) return;
    axios.get(`${MOCK_API_URL}?userId=${userUid}`)
      .then((response) => setTasks(response.data))
      .catch((error) => {
        if (error.response && error.response.status === 404) setTasks([]);
      });
  }, [userUid]);

  const handleAddTask = () => { /* Giữ nguyên logic... */ 
    if (inputValue.trim() === "") return;
    axios.post(MOCK_API_URL, { name: inputValue, isCompleted: false, userId: userUid }).then((res) => {
      setTasks([...tasks, res.data]); setInputValue(""); message.success("Đã đồng bộ!");
    });
  };

  const handleDeleteTask = (id: string) => {
    axios.delete(`${MOCK_API_URL}/${id}`).then(() => setTasks(tasks.filter(t => t.id !== id)));
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    axios.put(`${MOCK_API_URL}/${id}`, { ...task, isCompleted: !task.isCompleted }).then((res) => setTasks(tasks.map(t => t.id === id ? res.data : t)));
  };

  const handleStartEdit = (task: Task) => { setEditingId(task.id); setEditingText(task.name); };
  const handleSaveEdit = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !editingText.trim()) return;
    axios.put(`${MOCK_API_URL}/${id}`, { ...task, name: editingText }).then((res) => {
      setTasks(tasks.map(t => t.id === id ? res.data : t)); setEditingId(null);
    });
  };

  const filteredTasks = tasks.filter(t => filter === "all" ? true : filter === "completed" ? t.isCompleted : !t.isCompleted);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setTasks((items) => arrayMove(items, items.findIndex(t => t.id === active.id), items.findIndex(t => t.id === over.id)));
    }
  };
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
            isLoggedIn ? <Navigate to="/" /> : 
            <LoginScreen 
              username={loginEmail} setUsername={setLoginEmail} password={loginPassword} setPassword={setLoginPassword} 
              onLogin={() => handleLogin(loginEmail, loginPassword)} 
              onRegister={() => handleRegister(loginEmail, loginPassword)} 
              onGoogleLogin={handleGoogleLogin} 
            />
          } 
        />

        {/* ---------- TRANG CHỦ (TODO APP) ---------- */}
        <Route 
          path="/" 
          element={
            !isLoggedIn ? <Navigate to="/login" /> : (
              
              // RUỘT CỦA TODO APP ĐƯỢC NHÉT TRỰC TIẾP VÀO ĐÂY (Không bọc qua hàm nữa)
              <Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <Title level={3} style={{ textAlign: "center" }}>✅ Todo App Của {loggedInName}</Title>
                
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <Input placeholder="Nhập công việc cần làm..." size="large" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onPressEnter={handleAddTask} />
                  <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddTask}>Thêm</Button>
                  <Button type="primary" danger icon={<LogoutOutlined />} size="large" onClick={() => { handleLogout(); navigate('/login'); }}>Thoát</Button>
                </div>

                <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
                  <Radio.Button value="all">Tất cả</Radio.Button><Radio.Button value="incomplete">Đang làm</Radio.Button><Radio.Button value="completed">Đã xong</Radio.Button>
                </Radio.Group>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {filteredTasks.length === 0 ? (<Empty description="Không có công việc nào ở đây..." />) : (<List bordered dataSource={filteredTasks} renderItem={(task) => (
                        <TaskItem key={task.id} task={task} editingId={editingId} editingText={editingText} setEditingText={setEditingText} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onDelete={handleDeleteTask} onToggle={handleToggleTask} />
                      )} />)}
                  </SortableContext>
                </DndContext>
              </Card>

            )
          } 
        />
      </Routes>
    </div>
  );
}
