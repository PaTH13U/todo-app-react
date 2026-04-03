import { Button, Checkbox, Input, List } from "antd";
import { EditOutlined, DeleteFilled, CheckCircleOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Task {
  id: string;
  name: string;
  isCompleted: boolean;
  userId?: string;
}

interface TaskItemProps {
  task: Task;
  editingId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  onStartEdit: (task: Task) => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function TaskItem({
  task,
  editingId,
  editingText,
  setEditingText,
  onStartEdit,
  onSaveEdit,
  onDelete,
  onToggle,
}: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <List.Item
        actions={[
          <Button icon={<EditOutlined />} type="text" onClick={() => onStartEdit(task)} />,
          <Button danger icon={<DeleteFilled />} type="text" onClick={() => onDelete(task.id)} />,
          <Button icon={<CheckCircleOutlined />} type="text" onClick={() => onSaveEdit(task.id)} />,
        ]}
      >
        <Checkbox checked={task.isCompleted} onChange={() => onToggle(task.id)}>
          {editingId === task.id ? (
            <Input
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onPressEnter={() => onSaveEdit(task.id)}
              onBlur={() => onSaveEdit(task.id)}
              autoFocus
            />
          ) : (
            <span
              style={{
                textDecoration: task.isCompleted ? "line-through" : "none",
                color: task.isCompleted ? "gray" : "black",
              }}
            >
              {task.name}
            </span>
          )}
        </Checkbox>
        
      </List.Item>
    </div>
  );
}