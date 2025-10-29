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

/* ------------------ Custom Node Component ------------------ */
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

/* ------------------ Sample JSON ------------------ */
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

/* ------------------ App ------------------ */
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

  const generateTree = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setError('');
      const { nodes: builtNodes, edges: builtEdges } = buildTree(parsed);
      const layouted = layoutNodes(builtNodes, builtEdges);
      setNodes(layouted);
      setEdges(builtEdges);
      setSearchMessage('');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      setNodes([]);
      setEdges([]);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchMessage('Please enter a search query');
      setTimeout(() => setSearchMessage(''), 2000);
      return;
    }

    let found = false;
    const updated = nodes.map(node => {
      const p = node.data?.path || '';
      const q = searchQuery.trim();

      const isExact = p === q || p === q.replace(/^\$/, '');
      const contains = p.includes(q.replace(/^\$\.?/, '')) || q.includes(p);
      const match = p === q || p.includes(q) || q.includes(p) || p.endsWith(q.replace(/^\$\.?/, ''));

      if (match && !found) {
        found = true;
        if (reactFlowInstance) {
          setTimeout(() => {
            reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 700 });
          }, 80);
        }
      }

      return {
        ...node,
        data: { ...node.data, isHighlighted: match },
      };
    });

    setNodes(updated);
    setSearchMessage(found ? 'Match found!' : 'No match found');
    setTimeout(() => setSearchMessage(''), 2000);
  };

  const handleClear = () => {
    setJsonInput('');
    setNodes([]);
    setEdges([]);
    setSearchQuery('');
    setError('');
    setSearchMessage('');
  };

  const handleDownload = async () => {
    if (!reactFlowInstance || nodes.length === 0) return;
    
    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm')).default;
      
      // Get the React Flow wrapper element
      const flowElement = document.querySelector('.reactflow-wrapper');
      if (!flowElement) return;

      // Capture the element as canvas
      const canvas = await html2canvas(flowElement, {
        backgroundColor: darkMode ? '#0f172a' : '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Add watermark
      const ctx = canvas.getContext('2d');
      ctx.font = '16px Arial';
      ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
      ctx.fillText('JSON Tree Visualizer', 20, canvas.height - 20);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = `json-tree-${Date.now()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              JSON Tree Visualizer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Visualize and explore JSON data interactively</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
  <Sun size={20} className="text-yellow-400" />
) : (
  <Moon size={20} className="text-white" />
)}


          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">📝 Paste or type JSON data</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-3 border-2 rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Enter your JSON here..."
              />
              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded text-sm flex items-start gap-2">
                  <XCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={generateTree} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105">
                🌳 Generate Tree
              </button>
              <button onClick={handleClear} className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">
                <Trash2 size={18} />
              </button>
              <button onClick={handleDownload} className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md" disabled={nodes.length === 0}>
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">🔍 Search by JSON path</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., $.user.address.city or $.user.items[0].name"
                  className="flex-1 px-4 py-2 border-2 rounded-lg dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button onClick={handleSearch} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-md">
                  <Search size={16} /> <span className="ml-2">Search</span>
                </button>
              </div>

              {searchMessage && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${searchMessage.includes('found') ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300' : 'bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300'}`}>
                  {searchMessage.includes('found') ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  <span>{searchMessage}</span>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
              <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-200">📚 How to Use</h3>
              <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                <li>Paste valid JSON and click <strong>Generate Tree</strong>.</li>
                <li>Search with JSON path e.g., <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">$.user.name</code>.</li>
                <li>Hover nodes for details, click copy icon to copy path.</li>
                <li>Use Controls (bottom-left) to zoom / fit view.</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-200">🎨 Node Types</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-white"><div className="w-4 h-4 rounded bg-blue-500" /> <span className="text-sm">Object nodes</span></div>
                <div className="flex items-center gap-3 text-white"><div className="w-4 h-4 rounded bg-green-500" /> <span className="text-sm">Array nodes</span></div>
                <div className="flex items-center gap-3 text-white"><div className="w-4 h-4 rounded bg-orange-500" /> <span className="text-sm">Primitive values</span></div>
                <div className="flex items-center gap-3 text-white"><div className="w-4 h-4 rounded bg-yellow-400 ring-2 ring-yellow-300" /> <span className="text-sm">Highlighted search result</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden" style={{ height: '600px' }}>
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={(instance) => setReactFlowInstance(instance)}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{ animated: false, style: { strokeWidth: 2 } }}
              className="reactflow-wrapper"
            >
              <Background color={darkMode ? '#374151' : '#e5e7eb'} gap={16} />
              <Controls className="bg-white dark:bg-gray-700 rounded-lg shadow-lg" showInteractive={false} />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center space-y-3">
                <div className="text-6xl">🌳</div>
                <p className="text-xl font-semibold">No tree to display</p>
                <p className="text-sm">Enter JSON data and click "Generate Tree" to visualize</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Made with ❤️ — JSON Tree Visualizer</p>
        </div>
      </div>
    </div>
  );
}