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
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL; // Đọc biến môi trường từ file .env 
const { Title } = Typography;

// Đây là "Bản thiết kế" (Interface) để TypeScript biết 1 công việc trông như thế nào
interface Task {
  id: string;
  name: string;
  isCompleted: boolean;
}

function App() {
  // Balo 1: Tự động "Load Game" từ localStorage khi vừa mở web
  const [tasks, setTasks] = useState<Task[]>([]);

  const [inputValue, setInputValue] = useState("");

  const [filter, setFilter] = useState("all");

  // Hệ thống Auto-Save
  // Hệ thống tự động gọi API 1 lần duy nhất khi vừa mở App
  useEffect(() => {
    // Nhớ THAY ĐƯỜNG LINK CỦA BẠN vào chữ 'LINK_MOCK_API_CỦA_BẠN_Ở_ĐÂY' nhé!
    axios
      .get(MOCK_API_URL)
      .then((response) => {
        // Lấy dữ liệu thành công thì nhét vào Balo
        setTasks(response.data);
        message.success("Đã tải dữ liệu từ Server!");
      })
      .catch((error) => {
        // Nếu lỗi (đứt mạng, sai link) thì báo lỗi
        message.error("Lỗi kết nối Server!");
      });
  }, []); // Dấu ngoặc vuông rỗng [] nghĩa là "Chỉ chạy 1 lần lúc mới mở App"
  // Hàm Thêm
  // Hàm Thêm (Đã nâng cấp để nói chuyện với Server)
  const handleAddTask = () => {
    if (inputValue.trim() === "") return;

    // 1. Gói hàng gửi đi (Không cần ID vì Server sẽ tự tạo ID)
    const newTaskData = {
      name: inputValue,
      isCompleted: false,
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
      .put(
        `${MOCK_API_URL}/${idToToggle}`,
        updatedTaskData,
      )
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

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") {
      return task.isCompleted === true; // Chỉ lấy việc đã xong
    }
    if (filter === "incomplete") {
      return task.isCompleted === false; // Chỉ lấy việc chưa xong
    }
    return true; // Nếu filter là 'all' thì lấy hết
  });

  return (
    <div style={{ padding: "50px", maxWidth: "600px", margin: "0 auto" }}>
      <Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          ✅ Todo App Của Tôi
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
        <List
          bordered
          dataSource={filteredTasks}
          renderItem={(task) => (
            <List.Item
              // Vẫn giữ nút Xóa, nhưng truyền id vào thay vì index
              actions={[
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => handleDeleteTask(task.id)}
                />,
              ]}
            >
              {/* Thêm Checkbox để tích chọn */}
              <Checkbox
                checked={task.isCompleted}
                onChange={() => handleToggleTask(task.id)}
              >
                {/* Nếu isCompleted là true, thêm hiệu ứng gạch ngang chữ */}
                <span
                  style={{
                    textDecoration: task.isCompleted ? "line-through" : "none",
                    color: task.isCompleted ? "gray" : "black",
                  }}
                >
                  {task.name}
                </span>
              </Checkbox>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default App;
