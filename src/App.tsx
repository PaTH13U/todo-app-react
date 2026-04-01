import { useState, useEffect } from "react";
import {
  Input,
  Button,
  List,
  Typography,
  Card,
  Radio,
  message,
} from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import axios from "axios";
const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL;
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LoginScreen from "./components/LoginScreen";
import TaskItem, { type Task } from "./components/TaskItem";

const { Title } = Typography;

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userUid, setUserUid] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) return;

    axios
      .get(`${MOCK_API_URL}?userId=${userUid}`)
      .then((response) => {
        setTasks(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          setTasks([]); 
        } else {
          message.error("Lỗi tải dữ liệu cá nhân!"); 
        }
      });
  }, [userUid]);

  const handleAddTask = () => {
    if (inputValue.trim() === "") return;

    const newTaskData = {
      name: inputValue,
      isCompleted: false,
      userId: userUid,
    };

    axios
      .post(MOCK_API_URL, newTaskData)
      .then((response) => {
        setTasks([...tasks, response.data]);
        setInputValue("");
        message.success("Đã đồng bộ lên Server!");
      })
      .catch((error) => {
        console.error("LỖI KẾT NỐI SERVER:", error);
        message.error("Lưu thất bại, vui lòng thử lại!");
      });
  };

  const handleDeleteTask = (idToRemove: string) => {
    axios
      .delete(`${MOCK_API_URL}/${idToRemove}`)
      .then(() => {
        const newTasks = tasks.filter((task) => task.id !== idToRemove);
        setTasks(newTasks);
        message.warning("Đã xóa công việc khỏi Server!");
      })
      .catch((error) => {
        console.error("LỖI KẾT NỐI SERVER:", error);
        message.error("Xóa thất bại, Server không phản hồi!");
      });
  };

  const handleToggleTask = (idToToggle: string) => {
    const taskToUpdate = tasks.find((task) => task.id === idToToggle);
    if (!taskToUpdate) return;

    const updatedTaskData = {
      ...taskToUpdate,
      isCompleted: !taskToUpdate.isCompleted,
    };

    axios
      .put(`${MOCK_API_URL}/${idToToggle}`, updatedTaskData)
      .then((response) => {
        const newTasks = tasks.map((task) =>
          task.id === idToToggle ? response.data : task,
        );
        setTasks(newTasks);
        message.info("Đã lưu trạng thái lên Server!");
      })
      .catch((error) => {
        console.error("LỖI KẾT NỐI SERVER:", error);
        message.error("Lưu trạng thái thất bại, thử lại sau!");
      });
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditingText(task.name);
  };

  const handleSaveEdit = (idToSave: string) => {
    if (editingText.trim() === "") return;

    const taskToUpdate = tasks.find((task) => task.id === idToSave);
    if (!taskToUpdate) return;
    const updatedTaskData = { ...taskToUpdate, name: editingText };

    axios
      .put(`${MOCK_API_URL}/${idToSave}`, updatedTaskData)
      .then((response) => {
        const newTasks = tasks.map((task) =>
          task.id === idToSave ? response.data : task,
        );
        setTasks(newTasks);
        setEditingId(null);
        message.success("Đã cập nhật tên công việc!");
      })
      .catch(() => message.error("Lưu thất bại, thử lại sau!"));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") {
      return task.isCompleted === true;
    }
    if (filter === "incomplete") {
      return task.isCompleted === false;
    }
    return true;
  });

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
        setTasks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = () => {
    if (!username || !password) return message.warning("Vui lòng nhập đủ Email và Mật khẩu!");
    
    createUserWithEmailAndPassword(auth, username, password)
      .then(() => {
        message.success("Đăng ký thành công! Đã tự động đăng nhập.");
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') message.error("Email này đã được sử dụng!");
        else if (error.code === 'auth/weak-password') message.error("Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!");
        else message.error("Lỗi đăng ký: " + error.message);
      });
  };

  const handleLogin = () => {
    if (!username || !password) return message.warning("Vui lòng nhập đủ Email và Mật khẩu!");

    signInWithEmailAndPassword(auth, username, password)
      .then(() => {
        message.success("Đăng nhập thành công!");
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-credential') message.error("Sai Email hoặc Mật khẩu!");
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
    setTasks([]);
    message.info("Đã đăng xuất!");

    if (auth.currentUser) {
      signOut(auth);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div style={{ padding: "50px", maxWidth: "600px", margin: "0 auto" }}>
      {!isLoggedIn ? (
       <LoginScreen
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onRegister={handleRegister}
        />
      ) : (<Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Title level={3} style={{ textAlign: "center" }} >
           Todo App Của {username}
        </Title>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <Input
            placeholder="Nhập công việc cần làm..."
            size="large"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAddTask}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleAddTask}
          >
            Thêm
          </Button>
          <Button
            type="primary"
            icon={<LogoutOutlined />}
            size="large"
            onClick={handleLogout}
          >
            Thoát
          </Button>
        </div>
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Radio.Button value="all">Tất cả</Radio.Button>
          <Radio.Button value="incomplete">Đang làm</Radio.Button>
          <Radio.Button value="completed">Đã xong</Radio.Button>
        </Radio.Group>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <List
                bordered
                dataSource={filteredTasks}
                renderItem={(task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    editingId={editingId}
                    editingText={editingText}
                    setEditingText={setEditingText}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDeleteTask}
                    onToggle={handleToggleTask}
                  />
                )}
              />
            </SortableContext>
        </DndContext>
      </Card>)}
    </div>
  );
}

export default App;