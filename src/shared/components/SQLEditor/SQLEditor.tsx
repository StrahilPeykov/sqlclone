import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Button,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';

import { QueryResults } from './QueryResults';
import { useDatabase } from '@/features/database/hooks/useDatabase';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: (query: string) => Promise<void>;
  readOnly?: boolean;
  height?: string;
  database?: string;
  showResults?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SQLEditor({
  value,
  onChange,
  onExecute,
  readOnly = false,
  height = '200px',
  database = 'default',
  showResults = true,
  placeholder = 'Enter your SQL query...',
  autoFocus = false,
}: SQLEditorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { executeQuery } = useDatabase(database);

  const handleExecute = useCallback(async () => {
    if (!value.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      if (onExecute) {
        await onExecute(value);
      } else {
        const queryResult = await executeQuery(value);
        setResult(queryResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setIsExecuting(false);
    }
  }, [value, isExecuting, onExecute, executeQuery]);

  const extensions = [
    sql(),
    EditorView.theme({
      '&': { fontSize: '14px' },
      '.cm-content': { padding: '12px' },
      '.cm-focused .cm-cursor': { borderLeftColor: '#c81919' },
      '.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: '#c8191933',
      },
    }),
    EditorView.lineWrapping,
    keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          handleExecute();
          return true;
        },
      },
    ]),
  ];

  return (
    <Box>
      {/* SQL Editor */}
      <Paper
        elevation={2}
        sx={{
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: showResults ? 2 : 0,
        }}
      >
        {!readOnly && (
          <Box
            sx={{
              p: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={isExecuting ? <Stop /> : <PlayArrow />}
              onClick={handleExecute}
              disabled={!value.trim() || isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Run Query'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              Press Ctrl+Enter to execute
            </Typography>
            {isExecuting && <CircularProgress size={16} />}
          </Box>
        )}
        
        <CodeMirror
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          theme={oneDark}
          extensions={extensions}
          height={height}
          editable={!readOnly}
          autoFocus={autoFocus}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
          }}
        />
      </Paper>

      {/* Results/Error Display */}
      {showResults && (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          {result && !error && (
            <QueryResults result={result} />
          )}
        </>
      )}
    </Box>
  );
}