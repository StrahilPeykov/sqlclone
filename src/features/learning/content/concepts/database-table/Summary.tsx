import { Box, Typography } from '@mui/material';

export function Summary() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        Database tables (relations) organise data into rows and columns. Columns describe attributes, rows contain
        individual records, and each cell holds a single value.
      </Typography>
      <Typography variant="body1">
        The database <strong>schema</strong> defines the structure of these tables. The concrete values currently in
        the database make up the <strong>instance</strong>.
      </Typography>
    </Box>
  );
}

export default Summary;
