import { useState } from 'react';
import { renderToString } from 'react-dom/server'


interface SQLResult {
  columns: string[];
  rows: any[][];
  error?: string;
}

interface SQLViewerProps {
  query: string;
}

const SQLViewer: React.FC<SQLViewerProps> = ({ query }) => {
  const [result, setResult] = useState<SQLResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [executed, setExecuted] = useState<boolean>(false);

  query = renderToString(query).replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, '\'').trim()
  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setExecuted(true);
    
    try {
      console.log('Executing SQL query:', query);
      const url = `http://127.0.0.1:8008/sql?query=${query}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      const data = await response.json();
      console.log('Query response:', data);
      setResult(data);
    } catch (err) {
      console.error('Error executing SQL query:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute SQL query');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!executed && !loading && query.trim()) {
    executeQuery();
  }

  if (loading) {
    return (
      <div className="sql-viewer-loading">
        <div className="spinner"></div>
        <p>Executing query...</p>
      </div>
    );
  }

  // Add a manual execute button
  const ExecuteButton = () => (
    <button 
      className="sql-execute-button" 
      onClick={executeQuery}
      disabled={loading || !query.trim()}
    >
      {loading ? 'Executing...' : 'Refresh'}
    </button>
  );

  if (error || (result && result.error)) {
    return (
      <div className="sql-viewer-error">
        <h3>Error</h3>
        <pre>{error || result?.error}</pre>
        <div className="sql-query">
          <h4>Query</h4>
          <pre>{query}</pre>
          <ExecuteButton />
        </div>
      </div>
    );
  }

  if (!result || !result.columns || result.columns.length === 0) {
    return (
      <div className="sql-viewer-no-results">
        <p>{executed ? 'No results returned' : 'Query not executed yet'}</p>
        <div className="sql-query">
          <h4>Query</h4>
          <pre>{query}</pre>
          <ExecuteButton />
        </div>
      </div>
    );
  }

  return (
    <div className="sql-viewer">
      <div className="sql-results">
        {/* <h4> <ExecuteButton /> Results ({result.rows.length} rows)</h4> */}
        <div className="sql-table-container">
          <table className="sql-table">
            <thead>
              <tr>
                {result.columns.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{
                      cell === null ? 
                        <span className="null-value">NULL</span> : 
                        String(cell)
                    }</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .sql-viewer {
          font-family: system-ui, -apple-system, sans-serif;
          color: #e0e0e0;
        }
        
        .sql-query pre {
          background-color: #1e1e1e;
          padding: 0.75rem;
          overflow-x: auto;
          white-space: pre-wrap;
          color: #d4d4d4;
        }
        
        .sql-execute-button {
          margin-top: 10px;
          padding: 8px 16px;
          background-color:rgb(121, 121, 121);
          color: white;
          cursor: pointer;
          font-size: 14px;
        }
        
        .sql-execute-button:hover {
          background-color:rgb(92, 92, 92);
        }
        
        .sql-execute-button:disabled {
          background-color: #333333;
          color: #666666;
          cursor: not-allowed;
        }
        
        .sql-table-container {
          overflow-x: auto;
          max-width: 100%;
        }
        
        .sql-table {
          width: 100%;
          background-color: #1a1a1a;
        }
        
        .sql-table th, .sql-table td {
          padding: 8px;
          text-align: left;
        }
        
        .sql-table th {
          background-color: #252525;
          font-weight: bold;
          color: #eaeaea;
        }
        
        .sql-table tr:nth-child(even) {
          background-color: #222222;
        }
        
        .null-value {
          color: #888;
          font-style: italic;
        }
        
        .sql-viewer-error {
          color: #ff6b6b;
          background-color: #331a1a;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .sql-viewer-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          color: #e0e0e0;
        }
        
        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #6366f1;
          animation: spin 1s linear infinite;
        }
        
        .sql-viewer-no-results {
          color: #e0e0e0;
          background-color: #1a1a1a;
          padding: 1rem;
        }
        
        .sql-results h4, .sql-query h4 {
          color: #e0e0e0;
          margin-bottom: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SQLViewer;
