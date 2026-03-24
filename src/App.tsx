import { useState, useEffect } from "react";
import {
  Input,
  Button,
  List,
  Typography,
  Card,
  Checkbox,
  Radio,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, LogoutOutlined } from "@ant-design/icons";
import axios from "axios";
const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL; // Đọc biến môi trường từ file .env
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LoginScreen from "./components/LoginScreen";

const { Title } = Typography;


// Đây là "Bản thiết kế" (Interface) để TypeScript biết 1 công việc trông như thế nào
interface Task {

  id: string;
  name: string;
  isCompleted: boolean;
  userId?: string; // Thuộc tính này sẽ giúp mình biết công việc nào của ai (Dùng cho tính năng chia sẻ sau này)
}

// Lớp vỏ bọc giúp một component có thể kéo thả được
const SortableTaskItem = ({ task, children }: { task: Task, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

function App() {
  // Balo 1: Tự động "Load Game" từ localStorage khi vừa mở web
  const [tasks, setTasks] = useState<Task[]>([]);

  const [inputValue, setInputValue] = useState("");

  const [filter, setFilter] = useState("all");

  // Nhớ ID của công việc đang được sửa (Nếu null là không sửa gì cả)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Nhớ nội dung chữ đang được sửa
  const [editingText, setEditingText] = useState("");
  // Hệ thống Đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Chưa đăng nhập thì là false
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userUid, setUserUid] = useState<string | null>(null); // Lưu mã căn cước
  // Hệ thống Auto-Save
  // Hệ thống tự động gọi API 1 lần duy nhất khi vừa mở App
  useEffect(() => {
    // Nhớ THAY ĐƯỜNG LINK CỦA BẠN vào chữ 'LINK_MOCK_API_CỦA_BẠN_Ở_ĐÂY' nhé!
    axios
      .get(`${MOCK_API_URL}?userId=${userUid}`)
      .then((response) => {
        setTasks(response.data);
      })
      .catch(() => message.error("Lỗi tải dữ liệu cá nhân!"));
  }, [userUid]); // Dấu ngoặc vuông rỗng [] nghĩa là "Chỉ chạy 1 lần lúc mới mở App"
  // Hàm Thêm
  // Hàm Thêm (Đã nâng cấp để nói chuyện với Server)
  const handleAddTask = () => {
    if (inputValue.trim() === "") return;

    // 1. Gói hàng gửi đi (Không cần ID vì Server sẽ tự tạo ID)
    const newTaskData = {
      name: inputValue,
      isCompleted: false,
      userId: userUid, // <-- THÊM DÒNG NÀY: Gắn tên chủ sở hữu vào
    };

    // 2. Gọi Shipper mang hàng lên Server (dùng axios.post)
    axios
      .post(MOCK_API_URL, newTaskData)
      .then((response) => {
        // 3. Nếu Server gật đầu OK, nó sẽ trả về món hàng (đã có ID).
        // Lúc này mình mới lấy bỏ vào Balo hiện tại
        setTasks([...tasks, response.data]);
        setInputValue("");
        message.success("Đã đồng bộ lên Server!");
      })
      .catch((error) => {
        // Nếu rớt mạng hoặc lỗi
        message.error("Lưu thất bại, vui lòng thử lại!");
      });
  };

  // Hàm Xóa (Bây giờ xóa theo ID cho chính xác tuyệt đối, không sợ nhầm vị trí)
  // Hàm Xóa (Đã nâng cấp kết nối Server)
  // Đổi 'number' thành 'string' để hết báo lỗi đỏ
  const handleDeleteTask = (idToRemove: string) => {
    // Gọi API xóa dữ liệu trên Server (nhớ truyền ID vào cuối đường link)
    axios
      .delete(`${MOCK_API_URL}/${idToRemove}`)
      .then(() => {
        // Server xóa thành công thì mình mới xóa ở màn hình (Balo)
        const newTasks = tasks.filter((task) => task.id !== idToRemove);
        setTasks(newTasks);
        message.warning("Đã xóa công việc khỏi Server!");
      })
      .catch((error) => {
        message.error("Xóa thất bại, Server không phản hồi!");
      });
  };

  // TÍNH NĂNG MỚI: Hàm đổi trạng thái (Đã kết nối Server)
  const handleToggleTask = (idToToggle: string) => {
    // 1. Tìm xem công việc bạn vừa click là công việc nào trong Balo
    const taskToUpdate = tasks.find((task) => task.id === idToToggle);
    if (!taskToUpdate) return; // Nếu không tìm thấy thì bỏ qua

    // 2. Tạo một bản sao của công việc đó, nhưng lật ngược trạng thái (Xong <-> Chưa xong)
    const updatedTaskData = {
      ...taskToUpdate,
      isCompleted: !taskToUpdate.isCompleted,
    };

    // 3. Gọi Shipper mang bản sao này lên Server dán đè vào bản cũ (dùng axios.put)
    // Nhớ truyền ID vào cuối đường link để Server biết cần sửa cái nào
    axios
      .put(`${MOCK_API_URL}/${idToToggle}`, updatedTaskData)
      .then((response) => {
        // 4. Server báo OK, mình lấy dữ liệu mới từ Server cập nhật lại Balo hiển thị
        const newTasks = tasks.map((task) =>
          task.id === idToToggle ? response.data : task,
        );
        setTasks(newTasks);
        message.info("Đã lưu trạng thái lên Server!");
      })
      .catch((error) => {
        message.error("Lưu trạng thái thất bại, thử lại sau!");
      });
  };
  // 1. Hàm kích hoạt khi bấm nút cây bút (Mở bàn độ súng)
  const handleStartEdit = (task: Task) => {
    setEditingId(task.id); // Đánh dấu task này đang được sửa
    setEditingText(task.name); // Lấy tên cũ bỏ vào ô nhập liệu
  };

  // 2. Hàm kích hoạt khi gõ xong và bấm Enter (Lưu lên Server)
  const handleSaveEdit = (idToSave: string) => {
    if (editingText.trim() === "") return; // Không cho phép sửa thành rỗng

    // Lấy công việc hiện tại và bọc lại với cái tên mới
    const taskToUpdate = tasks.find((task) => task.id === idToSave);
    if (!taskToUpdate) return;
    const updatedTaskData = { ...taskToUpdate, name: editingText };

    // Gọi Shipper mang tên mới lên Server lưu đè (Nhớ dùng chìa khóa bảo mật)
    axios
      .put(`${MOCK_API_URL}/${idToSave}`, updatedTaskData)
      .then((response) => {
        // Cập nhật lại Balo trên màn hình
        const newTasks = tasks.map((task) =>
          task.id === idToSave ? response.data : task,
        );
        setTasks(newTasks);
        setEditingId(null); // Lưu xong thì tắt chế độ sửa
        message.success("Đã cập nhật tên công việc!");
      })
      .catch(() => message.error("Lưu thất bại, thử lại sau!"));
  };
  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") {
      return task.isCompleted === true; // Chỉ lấy việc đã xong
    }
    if (filter === "incomplete") {
      return task.isCompleted === false; // Chỉ lấy việc chưa xong
    }
    return true; // Nếu filter là 'all' thì lấy hết
  });

  // Hệ thống tự động kiểm tra xem người dùng đã đăng nhập từ lần trước chưa
  useEffect(() => {
    // onAuthStateChanged sẽ liên tục lắng nghe trạng thái từ Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUsername(user.displayName || "Sếp");
        setUserUid(user.uid); // <-- THÊM: Lấy mã UID thật của Firebase
      } else {
        setIsLoggedIn(false);
        setUsername("");
        setUserUid(null);     // <-- THÊM: Xóa mã UID
        setTasks([]);         // <-- THÊM: Đổ hết rác trong Balo ra để người sau không thấy
      }
    });

    // Dọn dẹp bộ nhớ khi tắt App
    return () => unsubscribe();
  }, []); // [] đảm bảo chỉ gắn camera giám sát 1 lần lúc mới mở web

  // 1. Hàm Đăng nhập truyền thống (Kiểm tra admin / 123456)
  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      setIsLoggedIn(true);
      setUserUid("admin_fake_uid_123"); // <-- THÊM: Cấp cho admin một cái ID giả
    } else {
      message.error("Sai tài khoản hoặc mật khẩu rồi!");
    }
  };

  // 2. Hàm Đăng nhập bằng Google (Bật Popup)
  const handleGoogleLogin = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        setIsLoggedIn(true);
        setUsername(result.user.displayName || "Sếp");
        setUserUid(result.user.uid); // <-- THÊM DÒNG NÀY
      })
      .catch((error) => {
        console.error("LỖI FIREBASE:", error);
        message.error("Đăng nhập bằng Google thất bại!");
      });
  };

  const handleLogout = () => {
    // 1. Dọn dẹp nhà cửa (Áp dụng cho cả Google và Admin)
    setIsLoggedIn(false);
    setUsername("");
    setUserUid(null);     // Xóa thẻ căn cước
    setTasks([]);         // Đổ sạch rác trong Balo ra
    message.info("Đã đăng xuất!");

    // 2. Báo cho Firebase biết (nếu trước đó đăng nhập bằng Google)
    if (auth.currentUser) {
      signOut(auth);
    }
  };

  // 1. Cảm biến nhận diện kéo thả (Chỉ kích hoạt khi di chuột 5px, để không bị nhầm với lúc bạn click nút Xóa/Sửa)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // 2. Hàm xử lý khi bạn thả chuột ra
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // Nếu vị trí thả khác vị trí ban đầu
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        // Đảo vị trí 2 phần tử trong Balo
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (

    <div style={{ padding: "50px", maxWidth: "600px", margin: "0 auto" }}>

      {!isLoggedIn ? (/* NẾU FALSE: HIỆN FORM ĐĂNG NHẬP */
        <LoginScreen
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
        />
      ) : (<Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Title level={3} style={{ textAlign: "center" }} >
          ✅ Todo App Của {username}
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
          <SortableContext items={filteredTasks} strategy={verticalListSortingStrategy}>
            <List
              bordered
              dataSource={filteredTasks}
              renderItem={(task) => (
                <SortableTaskItem key={task.id} task={task}>
                  <List.Item
                    // Vẫn giữ nút Xóa, nhưng truyền id vào thay vì index
                    actions={[
                      <Button
                        icon={<EditOutlined />}
                        type="text"
                        onClick={() => handleStartEdit(task)}
                      />,
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        type="text"
                        onClick={() => handleDeleteTask(task.id)}
                      />,
                      <Button
                        icon={<CheckOutlined />}
                        type="text"
                        onClick={() => handleSaveEdit(task.id)}
                      />
                    ]}
                  >
                    {/* Thêm Checkbox để tích chọn */}
                    <Checkbox
                      checked={task.isCompleted}
                      onChange={() => handleToggleTask(task.id)}
                    >
                      {/* Nếu isCompleted là true, thêm hiệu ứng gạch ngang chữ */}
                      {editingId === task.id ? (
                        // Nếu đang ở chế độ sửa: Hiện ô gõ chữ
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onPressEnter={() => handleSaveEdit(task.id)} // Bấm Enter để Lưu
                          onBlur={() => handleSaveEdit(task.id)} // Click chuột ra ngoài cũng tự Lưu
                          autoFocus // Tự động trỏ chuột vào luôn
                        />

                      ) : (
                        <span
                          style={{
                            textDecoration: task.isCompleted
                              ? "line-through"
                              : "none",
                            color: task.isCompleted ? "gray" : "black",
                          }}
                        >
                          {task.name}
                        </span>
                      )}
                    </Checkbox>
                  </List.Item>
                </SortableTaskItem>
              )}
            />
          </SortableContext>
        </DndContext>
      </Card>)}
    </div>
  );
}

export default App;
