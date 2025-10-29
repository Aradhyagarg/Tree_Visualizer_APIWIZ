import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Search, Moon, Sun, Trash2, Copy, Download, CheckCircle, XCircle } from 'lucide-react';

const CustomNode = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.path).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <div
      className={`group relative px-4 py-2 rounded-lg shadow-sm border-2 transition-all duration-200 ${data.nodeColor} ${data.isHighlighted ? 'ring-4 ring-yellow-300 scale-105' : 'border-gray-200 dark:border-gray-700'}`}
      title={`Path: ${data.path}${data.value !== undefined && data.value !== null ? `\nValue: ${String(data.value)}` : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className="font-semibold text-sm truncate">{data.label}</div>
        {data.value !== undefined && data.value !== null && (
          <div className="text-xs opacity-80 max-w-[180px] truncate">: {String(data.value)}</div>
        )}
      </div>

      <button
        onClick={handleCopy}
        className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-transform hover:scale-110"
        title="Copy path"
      >
        <Copy size={12} className="text-gray-700 dark:text-gray-200" />
      </button>

      {copied && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-3 py-1 rounded-full shadow">
          Copied!
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const sampleJSON = `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "address": {
      "city": "New York",
      "country": "USA",
      "zipCode": "10001"
    },
    "items": [
      { "name": "item1", "price": 29.99 },
      { "name": "item2", "price": 49.99 }
    ],
    "active": true
  }
}`;

export default function App() {
  const [jsonInput, setJsonInput] = useState(sampleJSON);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const getNodeColor = (type) => {
    switch (type) {
      case 'object':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'array':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      default:
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
    }
  };

  const buildTree = useCallback((obj) => {
    const nodesList = [];
    const edgesList = [];
    let nodeId = 0;

    const traverse = (value, parent, keyName, currentPath) => {
      const id = `node-${nodeId++}`;
      if (Array.isArray(value)) {
        nodesList.push({
          id,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { label: keyName, path: currentPath, nodeColor: getNodeColor('array'), isHighlighted: false },
        });
        if (parent) edgesList.push({ id: `edge-${parent}-${id}`, source: parent, target: id, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } });
        value.forEach((item, idx) => traverse(item, id, `[${idx}]`, `${currentPath}[${idx}]`));
      } else if (typeof value === 'object' && value !== null) {
        nodesList.push({
          id,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { label: keyName, path: currentPath, nodeColor: getNodeColor('object'), isHighlighted: false },
        });
        if (parent) edgesList.push({ id: `edge-${parent}-${id}`, source: parent, target: id, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } });
        Object.entries(value).forEach(([k, v]) => traverse(v, id, k, `${currentPath}.${k}`));
      } else {
        nodesList.push({
          id,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { label: keyName, value: value, path: currentPath, nodeColor: getNodeColor('primitive'), isHighlighted: false },
        });
        if (parent) edgesList.push({ id: `edge-${parent}-${id}`, source: parent, target: id, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } });
      }
      return id;
    };

    traverse(obj, null, 'root', '$');
    return { nodes: nodesList, edges: edgesList };
  }, []);

  const layoutNodes = (nodesArr, edgesArr) => {
    const levels = {};
    const getLevel = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      const parents = edgesArr.filter(e => e.target === nodeId);
      if (parents.length === 0) return 0;
      return 1 + Math.max(...parents.map(p => getLevel(p.source, visited)));
    };

    nodesArr.forEach(node => {
      const level = getLevel(node.id);
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
    });

    const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
    const levelHeight = 110;
    const nodeWidth = 220;

    levelKeys.forEach(level => {
      const arr = levels[level];
      const levelWidth = arr.length * nodeWidth;
      arr.forEach((node, i) => {
        node.position = {
          x: i * nodeWidth - levelWidth / 2 + nodeWidth / 2,
          y: level * levelHeight,
        };
      });
    });

    return nodesArr;
  };
}