import { Box, Typography } from '@mui/material';

export function Summary() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        Keys make rows addressable. Super keys uniquely identify rows, candidate keys do so with the smallest
        possible set of columns, and the primary key is the candidate key chosen for everyday use.
      </Typography>
      <Typography variant="body1">
        Defining keys is essential for joins, updates, and preventing duplicate data.
      </Typography>
    </Box>
  );
}

export default Summary;
