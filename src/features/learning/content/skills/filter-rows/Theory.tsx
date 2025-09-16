import { Typography, Box, Paper } from '@mui/material';

const exampleQueries = [
  "SELECT *\nFROM companies\nWHERE country = 'Netherlands';",
  "SELECT *\nFROM companies\nWHERE company_name LIKE 'M%';",
];

export function Theory() {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="body1">
        Filtering selects only the rows that match a condition.
      </Typography>
      <Typography variant="body1">
        Use the WHERE clause to apply conditions with comparison operators and pattern matching.
      </Typography>
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Examples
        </Typography>
        {exampleQueries.map((snippet, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{ p: 2, bgcolor: 'background.default', mb: index === 0 ? 2 : 0 }}
          >
            <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', whiteSpace: 'pre' }}>
              {snippet}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default Theory;
