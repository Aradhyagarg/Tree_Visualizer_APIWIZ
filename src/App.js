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

export default function App() {
  const [jsonInput, setJsonInput] = useState(sampleJSON);
const [searchQuery, setSearchQuery] = useState('');
const [searchMessage, setSearchMessage] = useState('');
const [error, setError] = useState('');
const [darkMode, setDarkMode] = useState(false);
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
const [reactFlowInstance, setReactFlowInstance] = useState(null);
  return <div>JSON Tree Visualizer</div>;
}