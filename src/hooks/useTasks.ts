import { useState, useEffect } from "react";
import axios from "axios";
import { message } from "antd";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Task } from "../components/TaskItem";

const MOCK_API_URL = import.meta.env.VITE_MOCK_API_URL;

// Hộp đen này cần xin Mẹ cái ID của user để biết đường gọi API
export function useTasks(userUid: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFetching, setIsFetching] = useState(true); // Trạng thái loading từ Ticket 1

  // 1. TỰ ĐỘNG GỌI API KHI CÓ USER ID
  useEffect(() => {
    if (!userUid) return;
   
    axios.get(`${MOCK_API_URL}?userId=${userUid}`)
      .then((response) => { setTasks(response.data); setIsFetching(false); })
      .catch((error) => {
        if (error.response?.status === 404) setTasks([]);
        setIsFetching(false);
      });
  }, [userUid]);

  // 2. HÀM THÊM: Cần ai đó truyền cho cái 'tên công việc' (name)
  const addTask = (name: string) => {
    axios.post(MOCK_API_URL, { name, isCompleted: false, userId: userUid }).then((res) => {
      setTasks([...tasks, res.data]);
      message.success("Đã đồng bộ!");
    });
  };

  // 3. HÀM XÓA: Cần ID
  const deleteTask = (id: string) => {
    axios.delete(`${MOCK_API_URL}/${id}`).then(() => setTasks(tasks.filter(t => t.id !== id)));
  };

  // 4. HÀM ĐỔI TRẠNG THÁI:
  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    axios.put(`${MOCK_API_URL}/${id}`, { ...task, isCompleted: !task.isCompleted })
         .then((res) => setTasks(tasks.map(t => t.id === id ? res.data : t)));
  };

  // 5. HÀM SỬA TÊN: Cần ID và tên mới
  const editTask = (id: string, newName: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    axios.put(`${MOCK_API_URL}/${id}`, { ...task, name: newName })
         .then((res) => setTasks(tasks.map(t => t.id === id ? res.data : t)));
  };

  // 6. HÀM KÉO THẢ
  const reorderTasks = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Trả về Balo và các nút bấm cho App.tsx xài
  return {
    tasks,
    setTasks,
    isFetching,
    addTask,
    deleteTask,
    toggleTask,
    editTask,
    reorderTasks
  };
}