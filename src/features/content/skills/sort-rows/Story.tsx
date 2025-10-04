import { Box, Typography } from '@mui/material';
import { DialogueBox, type DialogueLine } from '@/shared/components/DialogueBox';

const storyDialogue: DialogueLine[] = [
  {
    character: "Alex",
    role: "intern",
    text: "Hey Maya! I'm looking at this huge dataset of companies, but it's all jumbled up. How do I make sense of it?",
    delay: 500,
  },
  {
    character: "Maya",
    role: "mentor", 
    text: "Great question! That's where ORDER BY comes in. Think of it like organizing your desk – you want to put things in the right order so you can find what you need.",
    delay: 2000,
  },
  {
    character: "Alex",
    role: "intern",
    text: "So if I want to see which companies have the most employees, I'd sort by that column?",
    delay: 1500,
  },
  {
    character: "Maya", 
    role: "mentor",
    text: "Exactly! You'd use ORDER BY num_employees DESC to get the biggest companies first. DESC means descending – largest to smallest.",
    delay: 1800,
  },
  {
    character: "Alex",
    role: "intern", 
    text: "What about ASC?",
    delay: 1200,
  },
  {
    character: "Maya",
    role: "mentor",
    text: "ASC is ascending – smallest to largest. It's actually the default, so ORDER BY founded_year ASC is the same as just ORDER BY founded_year.",
    delay: 1500,
  },
  {
    character: "Alex",
    role: "intern",
    text: "Cool! But what if I want to sort by country first, then by number of employees within each country?",
    delay: 2000,
  },
  {
    character: "Maya",
    role: "mentor", 
    text: "Perfect! That's multi-column sorting. Just separate them with commas: ORDER BY country ASC, num_employees DESC. SQL will group by country first, then sort employees within each country.",
    delay: 2200,
  },
  {
    character: "Alex",
    role: "intern",
    text: "This is like creating a ranking system! What if I only want the top 5 results?",
    delay: 1800,
  },
  {
    character: "Maya",
    role: "mentor",
    text: "Add LIMIT 5 at the end! And if you want to skip the first few results, use OFFSET. It's like pagination on a website.",
    delay: 2000,
  },
  {
    character: "Alex", 
    role: "intern",
    text: "Awesome! So I can find the 2nd biggest company by using ORDER BY num_employees DESC LIMIT 1 OFFSET 1?",
    delay: 2500,
  },
  {
    character: "Maya",
    role: "mentor",
    text: "You got it! You're thinking like a data analyst now. ORDER BY is one of the most powerful tools for making data tell a story.",
    delay: 1500,
  }
];

export function Story() {
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          The Sorting Challenge
        </Typography>
        <Typography variant="body2" color="text.secondary">
          It's Alex's second week at SQL Valley, and they're about to learn one of the most essential skills in data analysis...
        </Typography>
      </Box>
      
      <DialogueBox 
        dialogue={storyDialogue}
        autoPlay={true}
        typingSpeed={45}
      />
    </Box>
  );
}

export default Story;