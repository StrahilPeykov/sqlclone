import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Paper,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Snackbar,
  Container,
} from '@mui/material';
import {
  PlayArrow,
  Save,
  ContentCopy,
  Clear,
  Download,
  Info,
} from '@mui/icons-material';
import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';
import { useDatabase } from '@/features/database/hooks/useDatabase';
import { databaseConfigs } from '@/features/database/schemas';
import { useLocalStorage } from '@/shared/hooks';

interface QueryHistory {
  query: string;
  timestamp: Date;
  success: boolean;
  rowCount?: number;
}

export default function PlaygroundPage() {
  const [selectedDatabase, setSelectedDatabase] = useState<keyof typeof databaseConfigs>('intermediate');
  const [query, setQuery] = useState('SELECT * FROM companies LIMIT 10;');
  const [currentTab, setCurrentTab] = useState(0);
  const [history, setHistory] = useLocalStorage<QueryHistory[]>('sql-playground-history', []);
  const [savedQueries, setSavedQueries] = useLocalStorage<{ name: string; query: string }[]>('sql-playground-queries', []);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  
  const {
    executeQuery,
    queryResult,
    queryError,
    isLoading: isExecuting,
    tableNames,
    resetDatabase,
  } = useDatabase(databaseConfigs[selectedDatabase]);
  
  const handleExecute = async () => {
    try {
      const result = await executeQuery(query);
      
      // Add to history
      const newHistoryEntry: QueryHistory = {
        query,
        timestamp: new Date(),
        success: true,
        rowCount: result?.[0]?.values?.length || 0,
      };
      
      setHistory((prev) => [newHistoryEntry, ...prev.slice(0, 49)]); // Keep last 50 queries
      
      setSnackbar({
        open: true,
        message: `Query executed successfully (${result?.[0]?.values?.length || 0} rows)`,
        severity: 'success',
      });
    } catch (error) {
      const newHistoryEntry: QueryHistory = {
        query,
        timestamp: new Date(),
        success: false,
      };
      
      setHistory((prev) => [newHistoryEntry, ...prev.slice(0, 49)]);
      
      setSnackbar({
        open: true,
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }
  };
  
  const handleSaveQuery = () => {
    const name = prompt('Enter a name for this query:');
    if (name) {
      const newSavedQueries = [...savedQueries, { name, query }];
      setSavedQueries(newSavedQueries);
      
      setSnackbar({
        open: true,
        message: 'Query saved successfully',
        severity: 'success',
      });
    }
  };
  
  const handleLoadQuery = (savedQuery: { name: string; query: string }) => {
    setQuery(savedQuery.query);
    setSnackbar({
      open: true,
      message: `Loaded: ${savedQuery.name}`,
      severity: 'info',
    });
  };
  
  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setSnackbar({
        open: true,
        message: 'Query copied to clipboard',
        severity: 'info',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to copy query',
        severity: 'error',
      });
    }
  };
  
  const handleClearQuery = () => {
    setQuery('');
  };
  
  const handleExportResults = () => {
    if (!queryResult || queryResult.length === 0) return;
    
    const data = queryResult[0];
    const csv = [
      data.columns.join(','),
      ...data.values.map((row: any[]) => row.map((cell: any) => JSON.stringify(cell)).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    setSnackbar({
      open: true,
      message: 'Results exported as CSV',
      severity: 'success',
    });
  };
  
  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to reset the database to its initial state?')) {
      try {
        await resetDatabase();
        setSnackbar({
          open: true,
          message: 'Database reset successfully',
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to reset database',
          severity: 'error',
        });
      }
    }
  };
  
  const handleDeleteSavedQuery = (index: number) => {
    const newSavedQueries = savedQueries.filter((_, i) => i !== index);
    setSavedQueries(newSavedQueries);
    setSnackbar({
      open: true,
      message: 'Query deleted',
      severity: 'info',
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          SQL Playground
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Experiment with SQL queries on sample databases. Your changes are temporary and won't affect exercises.
        </Typography>
      </Box>
      
      {/* Database Selector and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Database</InputLabel>
          <Select
            value={selectedDatabase}
            onChange={(e) => setSelectedDatabase(e.target.value as keyof typeof databaseConfigs)}
            label="Database"
          >
            <MenuItem value="basic">Basic (Companies)</MenuItem>
            <MenuItem value="intermediate">Intermediate (Companies + Positions)</MenuItem>
            <MenuItem value="advanced">Advanced (Employees + Projects)</MenuItem>
            <MenuItem value="fullPlayground">Full Playground (All Tables)</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleResetDatabase}>
            Reset Database
          </Button>
          <Tooltip title="Database schema info">
            <IconButton>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Available Tables */}
      {tableNames.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Available tables: {tableNames.join(', ')}
        </Alert>
      )}
      
      {/* SQL Editor */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <ButtonGroup size="small">
            <Button
              startIcon={<PlayArrow />}
              onClick={handleExecute}
              disabled={!query.trim() || isExecuting}
              variant="contained"
            >
              Execute
            </Button>
            <Button startIcon={<Save />} onClick={handleSaveQuery}>
              Save
            </Button>
            <Button startIcon={<ContentCopy />} onClick={handleCopyQuery}>
              Copy
            </Button>
            <Button startIcon={<Clear />} onClick={handleClearQuery}>
              Clear
            </Button>
            {queryResult && queryResult.length > 0 && (
              <Button startIcon={<Download />} onClick={handleExportResults}>
                Export CSV
              </Button>
            )}
          </ButtonGroup>
        </Box>
        
        <SQLEditor
          value={query}
          onChange={setQuery}
          height="300px"
          onExecute={handleExecute}
          showResults={false}
        />
      </Paper>
      
      {/* Results/History Tabs */}
      <Paper>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Results" />
          <Tab label="History" />
          <Tab label="Saved Queries" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {currentTab === 0 && (
            <>
              {queryError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {queryError instanceof Error ? queryError.message : 'Query execution failed'}
                </Alert>
              )}
              
              {queryResult && queryResult.length > 0 ? (
                <DataTable data={queryResult[0]} />
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Execute a query to see results
                </Typography>
              )}
            </>
          )}
          
          {currentTab === 1 && (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {history.length > 0 ? (
                history.map((item, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      bgcolor: item.success ? 'action.hover' : 'error.light',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                    onClick={() => setQuery(item.query)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '70%'
                        }}
                      >
                        {item.query}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {item.success && item.rowCount !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        {item.rowCount} rows returned
                      </Typography>
                    )}
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary" align="center">
                  No query history yet
                </Typography>
              )}
            </Box>
          )}
          
          {currentTab === 2 && (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {savedQueries.length > 0 ? (
                savedQueries.map((saved, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => handleLoadQuery(saved)}>
                        <Typography variant="subtitle2" gutterBottom>
                          {saved.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontFamily: 'monospace', 
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {saved.query}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSavedQuery(index)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary" align="center">
                  No saved queries yet
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}
