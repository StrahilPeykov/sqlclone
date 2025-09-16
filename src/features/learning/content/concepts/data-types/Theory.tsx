import { Alert, Box, Typography } from '@mui/material';

export function Theory() {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Alert severity="warning">
        This theory page is still under development. The contents below only offer a meta-description of what will
        be taught in this component.
      </Alert>
      <Typography variant="body1">
        Fields in relational databases can store many kinds of values: numbers, text, dates, or even more specialised
        types. Every column is assigned a data type.
      </Typography>
      <Typography variant="body1">
        Number columns can distinguish between integers, decimals, and other numeric representations. SQL also has a
        special <strong>NULL</strong> value to indicate unknown or missing.
      </Typography>
    </Box>
  );
}

export default Theory;
