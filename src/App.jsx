import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import TopologyMap from './components/TopologyMap';

function App() {
  return (
    <div className="w-full h-full bg-slate-900 text-white overflow-hidden">
      <ReactFlowProvider>
        <TopologyMap />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
