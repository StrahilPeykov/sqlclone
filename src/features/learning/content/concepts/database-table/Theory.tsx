import { Alert, Box, Typography } from '@mui/material';

export function Theory() {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Alert severity="warning">
        This theory page is still under development. The contents below only offer a meta-description of what will
        be taught in this component.
      </Alert>
      <Typography variant="body1">
        When a database consists of tables (a relational database), these tables are called <strong>relations</strong>.
        Tables have columns known as <strong>attributes</strong> and rows known as <strong>tuples</strong>. A single
        element in the database is a <strong>field</strong> or <strong>cell</strong>.
      </Typography>
      <Typography variant="body1">
        The blueprint of the database—the structure of its tables and how they relate—is called the
        <strong> schema</strong>, while the actual stored values at any moment form the <strong>instance</strong>.
      </Typography>
    </Box>
  );
}

export default Theory;
