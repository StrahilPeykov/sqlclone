import { Typography, Box } from '@mui/material';

export function Story() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        While cleaning up a customer spreadsheet you notice that phone numbers and favourite colours live in the same
        column. Queries break instantly. Data types keep those mistakes from ever happening in your database tables.
      </Typography>
    </Box>
  );
}

export default Story;
