import { Typography, Box } from '@mui/material';

export function Story() {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Typography variant="body1">
        You are a fresh graduate looking for your first job in tech. Rumour has it there is a database of companies
        that you can explore to find the perfect opportunity.
      </Typography>
      <Typography variant="body1">
        But wait you have never even heard of a database before. What is it, and why is everyone using it to make
        decisions?
      </Typography>
    </Box>
  );
}

export default Story;
