import { Typography, Box } from '@mui/material';

export function Story() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        Imagine mailing letters to thousands of customers. Without unique identifiers you would never know whether
        two entries refer to the same person. Keys give every record a dependable label.
      </Typography>
    </Box>
  );
}

export default Story;
