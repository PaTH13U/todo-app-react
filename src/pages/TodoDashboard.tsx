

import { Card, Typography, Input, Button, Radio, List, Empty, Skeleton } from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import { DndContext, closestCenter,useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Nhớ import TaskItem và kiểu Task từ components vào nhé
import TaskItem, { type Task } from "../components/TaskItem";

const { Title } = Typography;


interface TodoDashboardProps {
  loggedInName: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleAddTask: () => void;
  handleDeleteTask: (id: string) => void;
  handleToggleTask: (id: string) => void;
  handleLogout: () => void;
  filter: string;
  setFilter: (value: string) => void;
  filteredTasks: Task[];
  editingId: string | null;
  editingText: string;
  setEditingText: (value: string) => void;
  handleStartEdit: (task: Task) => void;
  handleSaveEdit: () => void;
  sensors: ReturnType<typeof useSensors>;
  handleDragEnd: (event: DragEndEvent) => void;
  isCompleted: number;
  inProgressCount: number;
  isFetching: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}


export default function TodoDashboard(props: TodoDashboardProps) {
  
  const {
    loggedInName,
    inputValue,
    setInputValue,
    handleAddTask,
    handleDeleteTask,
    handleToggleTask,
    handleLogout,
    filter,
    setFilter,
    filteredTasks,
    editingId,
    editingText,
    setEditingText,
    handleStartEdit,
    handleSaveEdit,
    sensors,
    handleDragEnd,
    isCompleted,
    inProgressCount,
    isFetching,
    setSearchQuery,
    searchQuery,
    // ... lấy thêm đồ ở đây ...
  } = props;

  // 4. DÁN CỤC <Card> TỪ APP.TSX VÀO ĐÂY
  return (
    <Skeleton active loading={isFetching} paragraph={{ rows: 8 }}>
       <Card style={{ border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <Title level={3} style={{ textAlign: "center" }}>✅ Todo App Của {loggedInName}</Title>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Input placeholder="Nhập công việc cần làm..." size="large" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onPressEnter={handleAddTask} />
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddTask}>Thêm</Button>
        <Button type="primary" danger icon={<LogoutOutlined />} size="large" onClick={handleLogout}>Thoát</Button>
      </div>

      <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
        <Radio.Button value="all">Tất cả</Radio.Button><Radio.Button value="incomplete">Đang làm</Radio.Button><Radio.Button value="completed">Đã xong</Radio.Button>
      
      </Radio.Group>
      <Input.Search placeholder="Tìm kiếm công việc..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <div>
        <Title level={4}>Thống kê</Title>
        Công việc đã hoàn thành: {isCompleted}
      </div>

      <div>
        Công việc đang làm: {inProgressCount}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {filteredTasks.length === 0 ? (<Empty description="Không có công việc nào ở đây..." />) : (<List bordered dataSource={filteredTasks} renderItem={(task) => (
            <TaskItem key={task.id} task={task} editingId={editingId} editingText={editingText} setEditingText={setEditingText} onStartEdit={handleStartEdit} onSaveEdit={handleSaveEdit} onDelete={handleDeleteTask} onToggle={handleToggleTask} />
          )} />)}
        </SortableContext>
      </DndContext>
    </Card>
    </Skeleton>
  );
}