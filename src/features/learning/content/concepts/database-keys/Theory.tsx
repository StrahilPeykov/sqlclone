import { Alert, Box, Typography } from '@mui/material';

export function Theory() {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Alert severity="warning">
        This theory page is still under development. The contents below only offer a meta-description of what will
        be taught in this component.
      </Alert>
      <Typography variant="body1">
        In a database table we need reliable ways to uniquely identify a row. These identifiers are known as
        <strong> keys</strong>.
      </Typography>
      <Typography variant="body1">
        A <strong>super key</strong> uniquely identifies each row (assuming no duplicates). A <strong>candidate key</strong>
        is a minimal super key with no unnecessary columns. The <strong>primary key</strong> is the candidate key we pick
        and enforce in practice.
      </Typography>
    </Box>
  );
}

export default Theory;
