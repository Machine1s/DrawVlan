# DrawVLAN - 技术架构文档

## 📐 系统架构

### 高层架构概览

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        用户界面层                          ┃
┃   ┌──────────┐      ┌──────────┐      ┌──────────┐       ┃
┃   │  工具栏  │      │   画布   │      │  侧边栏  │       ┃
┃   │  控制器  │      │ReactFlow │      │ 对象列表 │       ┃
┃   └──────────┘      └──────────┘      └──────────┘       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            │
                            ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                       状态管理层                           ┃
┃   ┌──────────┐      ┌──────────┐      ┌──────────┐       ┃
┃   │ 节点状态 │      │ 边缘状态 │      │ UI 状态  │       ┃
┃   │ReactFlow │      │ReactFlow │      │ useState │       ┃
┃   └──────────┘      └──────────┘      └──────────┘       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            │
                            ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                      业务逻辑层                            ┃
┃   ┌──────────┐      ┌──────────┐      ┌──────────┐       ┃
┃   │端口吸附  │      │流量计算  │      │验证规则  │       ┃
┃   │  逻辑    │      │  引擎    │      │          │       ┃
┃   └──────────┘      └──────────┘      └──────────┘       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            │
                            ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        渲染层                              ┃
┃   ┌──────────┐      ┌──────────┐      ┌──────────┐       ┃
┃   │交换机节点│      │终端节点  │      │网络边缘  │       ┃
┃   │  组件    │      │  组件    │      │  组件    │       ┃
┃   └──────────┘      └──────────┘      └──────────┘       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🗂 组件架构

### 核心组件

#### 1. TopologyMap.jsx
**角色**：应用根组件和状态编排器

**职责**：
- 全局状态管理（节点、边缘、UI 状态）
- 事件处理协调
- 数据注入管道
- 撤销/重做历史管理

**关键状态变量**：
```javascript
{
  nodes: Node[],                    // 所有网络元素
  edges: Edge[],                    // 所有连接
  selectedSwitchId: string | null,  // 激活的交换机面板
  labelConfig: {                    // 标签可见性
    showCableLabels: boolean,
    showTerminalLabels: boolean
  },
  showList: boolean,                // 侧边栏可见性
  showLabelMenu: boolean            // 下拉菜单状态
}
```

**关键函数**：
- `onNodeDragStop()`：终端吸附逻辑
- `onAddTerminalToPort()`：程序化终端创建
- `onAddCable()`：带验证的线缆创建
- `handleUpdateData()`：统一数据更新处理器

---

#### 2. SwitchNode.jsx
**角色**：网络交换机的可视化表示

**Props**：
```javascript
{
  data: {
    label: string,              // 交换机名称
    ports: Port[],              // 20 个端口配置
    connectedPorts: string[],   // 已占用的端口 ID
    trafficMap: {               // 实时流量状态
      [portId]: { hasTX, hasRX }
    }
  },
  selected: boolean
}
```

**渲染逻辑**：
1. 渲染 16 个接入端口（8x2 网格）
2. 渲染 4 个上行端口（2x2 网格）
3. 对于每个端口：
   - 显示连接 LED
   - 显示 TX/RX 指示器（如果已连接）
   - 渲染端口号标签
   - 附加不可见的连接手柄

**视觉状态**：
- 空闲：深色背景，灰色边框
- 已连接：绿色发光，绿色边框
- 已选中：蓝色高亮，环形效果

---

#### 3. SwitchFaceplate.jsx
**角色**：交换机的高级配置模态框

**架构**：
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              头部（交换机信息）                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃          物理端口网格（20 个端口）                ┃
┃   ┌────────────┐        ┌────────────┐          ┃
┃   │ 接入端口   │        │ 上行端口   │          ┃
┃   │  (1-16)    │        │  (17-20)   │          ┃
┃   └────────────┘        └────────────┘          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃               标签页导航                          ┃
┃    [VLAN] [终端] [线缆] [状态]                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃            活动标签页内容                         ┃
┃   ┌──────────┐          ┌──────────┐            ┃
┃   │左侧面板  │          │右侧面板  │            ┃
┃   │ (配置)   │          │ (预览)   │            ┃
┃   └──────────┘          └──────────┘            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**标签页系统**：
1. **VLAN 设置**：PVID 和 VLAN 列表配置
2. **终端属性**（如果已连接终端）：名称、PVID、流量模式
3. **添加终端**（如果端口空闲）：设备类型、初始配置
4. **线缆属性**（如果已连接线缆）：标签、方向
5. **添加线缆**（如果端口空闲）：目标选择、方向

**智能标签页切换**：
```javascript
if (端口有终端) → "终端属性"
else if (端口有线缆) → "线缆属性"
else if (端口已占用) → "VLAN 设置"
else → "添加终端" 或 "添加线缆"
```

---

#### 4. TerminalNode.jsx
**角色**：终端设备的可视化表示

**设备类别**：
- `pc`：显示器图标（标准工作站）
- `server`：服务器图标（数据中心设备）
- `laptop`：笔记本图标（移动设备）
- `tablet`：平板图标（移动终端）

**状态**：
- **浮动**：未连接，可在任意位置拖拽
- **已吸附**：连接到交换机端口，作为交换机节点的子节点
- **已选中**：黄色环形高亮

**流向指示器逻辑**：
```javascript
direction === 'both'    → 双箭头（黄色 + 绿色）
direction === 'a-to-b'  → 黄色箭头向下（TX）
direction === 'b-to-a'  → 绿色箭头向上（RX）
```

---

#### 5. NetworkEdge.jsx
**角色**：网络线缆的可视化表示

**路径计算**：
- 使用 ReactFlow 的 `getSimpleBezierPath()`
- 双路径渲染用于双向链路
- 路径偏移用于视觉分离

**颜色编码**：
- **黄色路径**（`#f59e0b`）：a-to-b 方向（从源发送）
- **绿色路径**（`#10b981`）：b-to-a 方向（到源接收）
- `direction: 'both'` 时两条路径均可见

**标签定位**：
- 基于源端口号的动态偏移
- 避免多条线缆重叠
- 悬停或 `showLabel` 为 true 时显示

**交互状态**：
- **悬停**：线条加粗，动画虚线
- **已选中**：高亮，标签始终可见
- **聚焦**：放大，发光效果

---

## 🔄 数据流模式

### 1. 流量映射计算

**触发器**：节点或边缘的任何更改

**处理流程**：
```javascript
// 在 TopologyMap.jsx - nodesWithData useMemo 中
for each 交换机节点:
  for each 已连接端口:
    查找连接的终端或线缆
    
    if 终端:
      direction = terminal.data.direction
      // 互斥映射
      if direction === 'a-to-b':
        switch.port.RX = true  // 终端 TX → 交换机 RX
      else if direction === 'b-to-a':
        switch.port.TX = true  // 终端 RX → 交换机 TX
    
    if 线缆:
      direction = cable.data.direction
      isSource = (cable.source === switch.id)
      
      if direction === 'a-to-b':
        if isSource: switch.port.TX = true
        else: switch.port.RX = true
      else if direction === 'b-to-a':
        if isSource: switch.port.RX = true
        else: switch.port.TX = true
    
    trafficMap[portId] = { hasTX, hasRX }
```

**输出**：作为 `trafficMap` 注入到交换机节点数据中

---

### 2. 端口占用追踪

**触发器**：终端吸附/分离、线缆添加/删除

**处理流程**：
```javascript
// 在 TopologyMap.jsx - useEffect 中
for each 交换机:
  cablePorts = 边缘 where (source 或 target === switch.id)
  terminalPorts = 终端 where (parentId === switch.id)
  
  connectedPorts = unique(cablePorts + terminalPorts)
  
  if 已更改:
    更新 switch.data.connectedPorts
```

**用途**：
- 在 `onConnect` 中防止重复预订
- 端口渲染中的视觉反馈
- 配置面板中的验证

---

### 3. 终端吸附算法

**触发器**：终端节点的 `onNodeDragStop` 事件

**算法**：
```javascript
SNAP_DISTANCE = 40px

for each 交换机:
  for each 端口手柄:
    if 端口被其他终端或线缆占用:
      跳过
    
    distance = 欧几里得距离(terminal.position, port.position)
    
    if distance < SNAP_DISTANCE and distance < minDistance:
      bestSnap = { switch, port, relativePosition }
      minDistance = distance

if 找到 bestSnap:
  terminal.parentId = bestSnap.switch
  terminal.position = bestSnap.relativePosition
  terminal.extent = 'parent'
  terminal.data.isSnapped = true
else:
  terminal.parentId = null
  terminal.position = absolutePosition
  terminal.data.isSnapped = false
```

---

### 4. 撤销/重做系统

**实现**：基于快照的历史记录

**数据结构**：
```javascript
{
  past: [
    { nodes: Node[], edges: Edge[] },
    { nodes: Node[], edges: Edge[] },
    ...
  ],
  future: [
    { nodes: Node[], edges: Edge[] },
    ...
  ]
}
```

**操作**：

**快照（任何变更之前）**：
```javascript
past.push(deepClone({ nodes, edges }))
future.clear()
```

**撤销**：
```javascript
current = { nodes, edges }
previous = past.pop()
future.unshift(current)
setState(previous)
```

**重做**：
```javascript
current = { nodes, edges }
next = future.shift()
past.push(current)
setState(next)
```

---

## 🎯 关键算法

### 端口独占性验证

**位置**：`TopologyMap.jsx` - `onConnect` 回调

```javascript
function validateConnection(params) {
  sourceNode = findNode(params.source)
  targetNode = findNode(params.target)
  
  isSourceOccupied = sourceNode.connectedPorts.includes(params.sourceHandle)
  isTargetOccupied = targetNode.connectedPorts.includes(params.targetHandle)
  
  if (isSourceOccupied || isTargetOccupied) {
    reject("端口已被占用")
    return false
  }
  
  return true
}
```

---

### 标签可见性逻辑

**线缆**（NetworkEdge.jsx）：
```javascript
isLabelVisible = data.showLabel || hovered || selected
```

**终端**（TerminalNode.jsx）：
```javascript
isLabelVisible = data.showLabel || !isSnapped || selected
```

**原理**：
- 明确启用时始终显示标签
- 浮动（未吸附）终端始终显示标签
- 悬停/选中时始终显示标签
- 默认隐藏已吸附终端的标签（减少混乱）

---

## 🔐 数据验证规则

### 端口配置
- **PVID**：必须是 1-4094 之间的整数
- **VLAN 列表**：逗号分隔的整数或范围（例如 "1,10-20,100"）

### 连接规则
- **每端口一个连接**：在 `onConnect` 和终端吸附中强制执行
- **无自环**：交换机不能连接到自身
- **无终端到终端**：仅允许交换机到交换机或交换机到终端

### 方向值
- **有效值**：`'both'`、`'a-to-b'`、`'b-to-a'`
- **默认值**：`'both'`（全双工）

---

## 🎨 样式架构

### 调色板

```javascript
{
  // 主要操作
  primary: '#3b82f6',      // Blue-500
  
  // 数据流
  transmit: '#f59e0b',     // Amber-500 (TX)
  receive: '#10b981',      // Green-500 (RX)
  
  // 状态
  connected: '#22c55e',    // Green-400
  selected: '#eab308',     // Yellow-400
  error: '#ef4444',        // Red-500
  
  // UI 框架
  background: '#0a0a0a',   // 近黑色
  surface: '#1e293b',      // Slate-800
  border: '#334155',       // Slate-700
  text: '#e2e8f0',         // Slate-200
}
```

### 组件特定样式

**交换机端口**：
- 空闲：`bg-black border-slate-800`
- 已连接：`border-green-500/40 bg-green-500/5`
- 已选中：`border-blue-500 bg-blue-500/20 ring-blue-500/50`

**流量指示器**：
- TX LED：`bg-amber-400 shadow-[0_0_4px_#fbbf24]`
- RX LED：`bg-green-400 shadow-[0_0_4px_#10b981]`
- 未激活：`bg-slate-800`

---

## 🚀 性能优化

### 1. 记忆化策略

**重计算**：
```javascript
// 流量映射计算
const nodesWithData = useMemo(() => {
  // 昂贵操作：遍历所有节点、边缘、终端
  // 仅在依赖项更改时重新计算
}, [nodes, edges, labelConfig.showTerminalLabels])

// 边缘数据注入
const edgesWithData = useMemo(() => {
  // 注入回调和标签配置
}, [edges, labelConfig.showCableLabels])
```

### 2. 事件处理器优化

**useCallback 保持稳定引用**：
```javascript
const onNodeDragStop = useCallback((evt, node) => {
  // 防止每次渲染时重新创建
}, [nodes, getInternalNode, setNodes])
```

### 3. 条件渲染

**避免渲染隐藏元素**：
```javascript
{showLabelMenu && (
  <div className="dropdown">
    {/* 仅在可见时渲染 */}
  </div>
)}
```

---

## 🧪 测试考虑

### 单元测试目标

1. **端口吸附逻辑**
   - 测试距离计算
   - 测试占用检测
   - 测试相对定位

2. **流量映射计算**
   - 测试终端互斥映射
   - 测试线缆方向逻辑
   - 测试双向场景

3. **验证规则**
   - 测试端口独占性
   - 测试 PVID 范围验证
   - 测试连接类型限制

### 集成测试场景

1. **端到端工作流**
   - 添加交换机 → 添加终端 → 吸附到端口 → 配置
   - 创建线缆 → 更改方向 → 验证指示器
   - 撤销/重做序列 → 验证状态一致性

2. **边缘情况**
   - 拖拽终端到已占用端口
   - 删除带有连接终端的交换机
   - 在选中时更改线缆方向

---

## 📊 性能指标

### 目标基准

- **初始渲染**：< 100ms
- **节点添加**：< 50ms
- **流量映射重新计算**：< 20ms
- **撤销/重做**：< 30ms
- **流畅动画**：60 FPS

### 优化机会

1. **虚拟滚动**：用于 100+ 项的对象列表
2. **Web Workers**：用于复杂的 VLAN 计算
3. **Canvas 渲染**：用于超大型拓扑（500+ 节点）

---

## 🔮 可扩展性

### 添加新设备类型

1. 在 `TerminalNode.jsx` 中添加图标：
```javascript
const icons = {
  pc: Monitor,
  server: Server,
  router: Router,  // 新类型
  // ...
}
```

2. 在 `SwitchFaceplate.jsx` 中添加到类别选择器

### 添加新端口类型

1. 在 `TopologyMap.jsx` 中扩展 `generatePorts()`
2. 在 `SwitchNode.jsx` 中更新渲染逻辑
3. 在 `SwitchFaceplate.jsx` 中添加配置选项

### 自定义流量模式

1. 定义新的方向值
2. 更新流量计算逻辑
3. 添加视觉指示器
4. 更新配置 UI

---

## 📝 代码规范

### 命名约定

- **组件**：PascalCase（例如 `SwitchNode`）
- **函数**：camelCase（例如 `handleUpdateData`）
- **常量**：UPPER_SNAKE_CASE（例如 `SNAP_DISTANCE`）
- **CSS 类**：通过 Tailwind 实用类使用 kebab-case

### 文件组织

- 每个文件一个组件
- 相关实用程序放在一起
- 分离关注点（UI vs. 逻辑）

### 注释风格

```javascript
// 简短说明使用单行注释

/**
 * 复杂逻辑使用多行注释
 * 解释为什么，而不是做什么
 */
```

---

## 🛠 开发工具

### 推荐的 VS Code 扩展

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### 调试工具

**React DevTools**：组件层级检查
**ReactFlow DevTools**：节点/边缘状态检查
**控制台日志**：在事件处理器中战略性放置

---

本文档提供了 DrawVLAN 架构的全面技术概述。有关面向用户的文档，请参阅 README.md。
