import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Alert,
} from '@mui/material';

interface QueryResult {
  columns: string[];
  values: any[][];
}

interface QueryResultsProps {
  result: QueryResult[] | QueryResult;
  maxRows?: number;
}

export function QueryResults({ result, maxRows = 1000 }: QueryResultsProps) {
  // Handle both single result and array of results
  const results = Array.isArray(result) ? result : [result];
  
  if (!results || results.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          Query executed successfully but returned no results.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {results.map((queryResult, index) => (
        <Box key={index} sx={{ mb: index < results.length - 1 ? 2 : 0 }}>
          {results.length > 1 && (
            <Typography variant="h6" gutterBottom>
              Result Set {index + 1}
            </Typography>
          )}
          
          <ResultTable result={queryResult} maxRows={maxRows} />
        </Box>
      ))}
    </Box>
  );
}

function ResultTable({ result, maxRows }: { result: QueryResult; maxRows: number }) {
  if (!result.columns || result.columns.length === 0) {
    return (
      <Alert severity="success">
        <Typography variant="body2">
          Query executed successfully. No data returned.
        </Typography>
      </Alert>
    );
  }

  const { columns, values } = result;
  const displayValues = values.slice(0, maxRows);
  const hasMoreRows = values.length > maxRows;

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return (
        <Chip 
          label="NULL" 
          size="small" 
          variant="outlined" 
          sx={{ 
            fontSize: '0.75rem',
            height: '20px',
            color: 'text.disabled'
          }} 
        />
      );
    }
    
    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'TRUE' : 'FALSE'}
          size="small"
          color={value ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontSize: '0.75rem', height: '20px' }}
        />
      );
    }
    
    if (typeof value === 'number') {
      return (
        <Typography
          component="span"
          sx={{ 
            fontFamily: 'monospace', 
            color: 'info.main',
            fontSize: '0.875rem'
          }}
        >
          {value.toLocaleString()}
        </Typography>
      );
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return (
        <Typography
          component="span"
          title={value}
          sx={{
            display: 'block',
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.875rem'
          }}
        >
          {value}
        </Typography>
      );
    }
    
    return (
      <Typography component="span" sx={{ fontSize: '0.875rem' }}>
        {String(value)}
      </Typography>
    );
  };

  return (
    <Paper elevation={1}>
      {/* Results Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {values.length} {values.length === 1 ? 'row' : 'rows'} returned
          {hasMoreRows && ` (showing first ${maxRows})`}
        </Typography>
      </Box>

      {/* Results Table */}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={index}
                  sx={{
                    fontWeight: 'bold',
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    borderBottom: 2,
                    borderColor: 'primary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayValues.length > 0 ? (
              displayValues.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      bgcolor: 'action.hover',
                    },
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      sx={{
                        py: 1,
                        fontSize: '0.875rem',
                        maxWidth: 300,
                      }}
                    >
                      {formatCellValue(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No data returned
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {hasMoreRows && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          <Typography variant="body2">
            Only showing first {maxRows} rows of {values.length} total rows.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}