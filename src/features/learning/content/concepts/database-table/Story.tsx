import { Typography, Box } from '@mui/material';

export function Story() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        Picture a spreadsheet where each column describes a property—company name, country, number of employees—and
        each row captures one company. That structure is exactly what a database table formalises.
      </Typography>
      <Typography variant="body1">
        Understanding how rows, columns, and cells relate is the first step toward designing useful schemas.
      </Typography>
    </Box>
  );
}

export default Story;
