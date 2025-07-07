import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [availableNodes, setAvailableNodes] = useState([]);
  const [coordinatorNodes, setCoordinatorNodes] = useState([]);
  const [sensorNodes, setSensorNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState('hub');
  const [nodeType, setNodeType] = useState('sensor'); // 'sensor' or 'coordinator'
  const [isScanning, setIsScanning] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [useMockData, setUseMockData] = useState(true);

  const API_BASE = 'http://localhost:3001';

  // Mock data representing the three-tier architecture
  const mockAvailableNodes = [
    { mac: 'AA:BB:CC:DD:EE:01', type: 'sensor' },
    { mac: 'AA:BB:CC:DD:EE:02', type: 'coordinator' },
    { mac: 'AA:BB:CC:DD:EE:03', type: 'sensor' },
    { mac: 'AA:BB:CC:DD:EE:04', type: 'sensor' }
  ];

  const mockCoordinatorNodes = [
    'BB:BB:CC:DD:EE:10',
    'BB:BB:CC:DD:EE:11'
  ];

  const mockSensorNodes = [
    { mac: 'CC:CC:DD:EE:FF:20', coordinator: 'BB:BB:CC:DD:EE:10', temp: 22, humidity: 65 },
    { mac: 'CC:CC:DD:EE:FF:21', coordinator: 'BB:BB:CC:DD:EE:10', temp: 24, humidity: 62 },
    { mac: 'CC:CC:DD:EE:FF:22', coordinator: 'BB:BB:CC:DD:EE:11', temp: 23, humidity: 68 }
  ];

  // Fetch functions
  const fetchAvailableNodes = async () => {
    if (useMockData) {
      setAvailableNodes(mockAvailableNodes);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/nodes/available`);
      if (response.ok) {
        const nodes = await response.json();
        setAvailableNodes(nodes);
      } else {
        setStatusMessage('Failed to fetch available nodes');
      }
    } catch (error) {
      setStatusMessage('Error connecting to API - Using demo data');
      setAvailableNodes(mockAvailableNodes);
      console.error('Error fetching available nodes:', error);
    }
  };

  const fetchCoordinatorNodes = async () => {
    if (useMockData) {
      setCoordinatorNodes(mockCoordinatorNodes);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/nodes/coordinators`);
      if (response.ok) {
        const nodes = await response.json();
        setCoordinatorNodes(nodes);
      } else {
        setStatusMessage('Failed to fetch coordinator nodes');
      }
    } catch (error) {
      setStatusMessage('Error connecting to API - Using demo data');
      setCoordinatorNodes(mockCoordinatorNodes);
      console.error('Error fetching coordinator nodes:', error);
    }
  };

  const fetchSensorNodes = async () => {
    if (useMockData) {
      setSensorNodes(mockSensorNodes);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/nodes/sensors`);
      if (response.ok) {
        const nodes = await response.json();
        setSensorNodes(nodes);
      } else {
        setStatusMessage('Failed to fetch sensor nodes');
      }
    } catch (error) {
      setStatusMessage('Error connecting to API - Using demo data');
      setSensorNodes(mockSensorNodes);
      console.error('Error fetching sensor nodes:', error);
    }
  };

  // Handle scan for new nodes
  const handleScan = async () => {
    setIsScanning(true);
    setStatusMessage('Scanning for new nodes...');
    
    if (useMockData) {
      setTimeout(() => {
        const newMockNodes = [
          { mac: 'AA:BB:CC:DD:EE:05', type: 'sensor' },
          { mac: 'AA:BB:CC:DD:EE:06', type: 'coordinator' }
        ];
        setAvailableNodes([...mockAvailableNodes, ...newMockNodes]);
        setIsScanning(false);
        setStatusMessage('Scan completed - Found 2 new nodes');
      }, 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/commands/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setStatusMessage('Scan initiated. Waiting for results...');
        
        // Wait 5 seconds then fetch available nodes
        setTimeout(() => {
          fetchAvailableNodes();
          setIsScanning(false);
          setStatusMessage('Scan completed');
        }, 5000);
      } else {
        setStatusMessage('Failed to start scan');
        setIsScanning(false);
      }
    } catch (error) {
      setStatusMessage('Error starting scan');
      setIsScanning(false);
      console.error('Error starting scan:', error);
    }
  };

  // Handle node pairing
  const handlePair = async () => {
    if (!selectedNode) return;

    setIsPairing(true);
    setStatusMessage('Pairing node...');

    if (useMockData) {
      setTimeout(() => {
        if (nodeType === 'coordinator') {
          setCoordinatorNodes([...coordinatorNodes, selectedNode.mac]);
        } else {
          const newSensorNode = {
            mac: selectedNode.mac,
            coordinator: selectedDestination === 'hub' ? 'hub' : selectedDestination,
            temp: Math.floor(Math.random() * 10) + 20,
            humidity: Math.floor(Math.random() * 20) + 50
          };
          setSensorNodes([...sensorNodes, newSensorNode]);
        }
        
        setAvailableNodes(availableNodes.filter(node => node.mac !== selectedNode.mac));
        setSelectedNode(null);
        setSelectedDestination('hub');
        setStatusMessage('Node paired successfully');
        setIsPairing(false);
      }, 2000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/commands/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeToPair: selectedNode,
          destination: selectedDestination === 'coordinator' ? 'coordinator' : selectedDestination,
        }),
      });

      if (response.ok) {
        setStatusMessage('Node paired successfully');
        setSelectedNode(null);
        setSelectedDestination('coordinator');
        
        // Refresh both lists
        fetchAvailableNodes();
        fetchCoordinatorNodes();
        fetchSensorNodes();
      } else {
        setStatusMessage('Failed to pair node');
      }
    } catch (error) {
      setStatusMessage('Error pairing node');
      console.error('Error pairing node:', error);
    }
    
    setIsPairing(false);
  };

  // Load initial data
  useEffect(() => {
    fetchAvailableNodes();
    fetchCoordinatorNodes();
    fetchSensorNodes();
  }, []);

  // Clear status message after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Construction Site Sensor Network Dashboard
          </h1>
          
          {/* Demo Mode Toggle */}
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">Demo Mode (Mock Data)</span>
            </label>
          </div>

          {statusMessage && (
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="mb-8 text-center">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isScanning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isScanning ? 'Scanning...' : 'Scan for New Nodes'}
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Available Nodes */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                Available Nodes ({availableNodes.length})
              </h2>
              
              {availableNodes.length === 0 ? (
                <p className="text-gray-500 italic">No available nodes found</p>
              ) : (
                <div className="space-y-3">
                  {availableNodes.map((node, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          node.type === 'coordinator' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <span className={`text-xs font-bold ${
                            node.type === 'coordinator' ? 'text-purple-600' : 'text-blue-600'
                          }`}>
                            {node.type === 'coordinator' ? 'C' : 'S'}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-700">
                            {node.mac}
                          </div>
                          <div className="text-xs text-gray-500">
                            ESP32 {node.type === 'coordinator' ? 'Coordinator' : 'Sensor'} Node
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedNode(node);
                          setNodeType(node.type);
                        }}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          selectedNode?.mac === node.mac
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {selectedNode?.mac === node.mac ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Pairing & Network View */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Pairing Section */}
              {selectedNode && (
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Pair Selected {nodeType === 'coordinator' ? 'Coordinator' : 'Sensor'} Node
                  </h3>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Node to Pair:
                    </label>
                    <div className="flex items-center font-mono text-sm bg-white px-3 py-2 border rounded">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                        nodeType === 'coordinator' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <span className={`text-xs font-bold ${
                          nodeType === 'coordinator' ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {nodeType === 'coordinator' ? 'C' : 'S'}
                        </span>
                      </div>
                      {selectedNode.mac}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connect to:
                    </label>
                    <select
                      value={selectedDestination}
                      onChange={(e) => setSelectedDestination(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {nodeType === 'coordinator' ? (
                        <option value="hub">🍓 Raspberry Pi Hub</option>
                      ) : (
                        <>
                          <option value="hub">🍓 Raspberry Pi Hub (Direct)</option>
                          {coordinatorNodes.map((node, index) => (
                            <option key={index} value={node}>
                              📡 Coordinator {node}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePair}
                      disabled={isPairing}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        isPairing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {isPairing ? 'Pairing...' : 'Confirm Pair'}
                    </button>
                    
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Network Architecture Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                  Network Architecture
                </h2>
                
                {/* Raspberry Pi Hub */}
                <div className="mb-6">
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <span className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4">
                      🍓
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Raspberry Pi Hub</span>
                      <div className="text-sm text-gray-600">Central processing hub running Linux</div>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coordinator Nodes */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    ESP32 Coordinator Nodes ({coordinatorNodes.length})
                  </h3>
                  {coordinatorNodes.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">No coordinator nodes paired</p>
                  ) : (
                    <div className="space-y-2">
                      {coordinatorNodes.map((node, index) => (
                        <div key={index} className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg ml-8">
                          <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            C
                          </span>
                          <div className="flex-1">
                            <span className="font-mono text-sm text-gray-900">{node}</span>
                            <div className="text-xs text-gray-600">ESP32 Coordinator Node</div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Connected
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sensor Nodes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    ESP32 Sensor Nodes ({sensorNodes.length})
                  </h3>
                  {sensorNodes.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">No sensor nodes paired</p>
                  ) : (
                    <div className="space-y-2">
                      {sensorNodes.map((node, index) => (
                        <div key={index} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg ml-16">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            S
                          </span>
                          <div className="flex-1">
                            <span className="font-mono text-sm text-gray-900">{node.mac}</span>
                            <div className="text-xs text-gray-600">
                              Connected via: {node.coordinator === 'hub' ? 'Hub (Direct)' : node.coordinator}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-xs text-gray-600">
                              🌡️ {node.temp}°C | 💧 {node.humidity}%
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Active
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Network Summary */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-800">
                    <strong>Network Status:</strong> 
                    <br />• 1 Raspberry Pi Hub (Online)
                    <br />• {coordinatorNodes.length} ESP32 Coordinator{coordinatorNodes.length !== 1 ? 's' : ''} 
                    <br />• {sensorNodes.length} ESP32 Sensor Node{sensorNodes.length !== 1 ? 's' : ''} collecting data
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
