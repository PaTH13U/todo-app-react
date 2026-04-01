import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom' // <-- 1. Import cái này

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Tạm thời tắt StrictMode đi để kéo thả dnd-kit chạy mượt hơn, bọc BrowserRouter vào
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)