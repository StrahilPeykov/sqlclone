import { Box, Typography } from '@mui/material';

export function Summary() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        Every column in a relational database has a data type that controls which values can be stored. Text, numbers,
        dates, and booleans all carry different behaviours and constraints.
      </Typography>
      <Typography variant="body1">
        SQL uses the special value <strong>NULL</strong> to represent missing or unknown data, which behaves differently
        from regular values in comparisons and calculations.
      </Typography>
    </Box>
  );
}

export default Summary;
