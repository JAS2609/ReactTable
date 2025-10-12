// src/App.tsx
import React from "react";
import ArtTable from "./components/DataTable";

const App: React.FC = () => {
  return (
    <div className="p-m-4">
      <h2 className="mb-4">PrimeReact DataTable Example</h2>
      <ArtTable />
    </div>
  );
};

export default App;
