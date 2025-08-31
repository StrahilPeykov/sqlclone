import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  School,
  Lightbulb,
  MenuBook,
} from '@mui/icons-material';
import { useAppStore } from '@/store';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

// Mock concept data - this would come from your content JSON
const conceptData: Record<string, any> = {
  'database': {
    name: 'What is a Database?',
    description: 'Understanding databases, tables, and database management systems',
    theory: `
A database is a structured collection of data that is stored and organized in a way that allows for efficient retrieval and manipulation. Think of it as a digital filing cabinet where information is stored in an organized manner.

## Key Components:
- **Tables**: Store data in rows and columns
- **Records**: Individual entries (rows) in a table
- **Fields**: Individual data points (columns) in a record
- **Database Management System (DBMS)**: Software that manages the database

## Why Use Databases?
- **Organization**: Data is structured and easy to find
- **Efficiency**: Fast retrieval of specific information
- **Reliability**: Data integrity and backup capabilities
- **Scalability**: Can handle large amounts of data
- **Security**: Access control and permissions
    `,
    summary: `
Databases are essential for storing and managing data efficiently. They consist of tables with rows (records) and columns (fields), managed by a DBMS. Key benefits include organization, efficiency, reliability, scalability, and security.
    `,
    examples: [
      {
        title: 'Company Database',
        content: 'A company might have tables for employees, departments, and projects, all linked together.'
      },
      {
        title: 'E-commerce Database',
        content: 'An online store would have tables for products, customers, orders, and inventory.'
      }
    ],
    nextConcepts: ['database-table']
  },
  'database-table': {
    name: 'Database Tables',
    description: 'Learn about rows, columns, and how data is structured in tables',
    theory: `
Database tables are the fundamental building blocks of relational databases. They organize data into rows and columns, similar to a spreadsheet.

## Table Structure:
- **Rows (Records/Tuples)**: Each row represents a single entity or record
- **Columns (Fields/Attributes)**: Each column represents a specific property or characteristic
- **Cells**: The intersection of a row and column contains a single data value

## Table Properties:
- **Table Name**: Unique identifier for the table
- **Schema**: The structure definition of the table
- **Primary Key**: Unique identifier for each row
- **Data Types**: Define what kind of data each column can store
    `,
    summary: `
Tables organize data in rows and columns. Rows represent individual records, columns represent attributes, and cells contain individual data values. Each table has a schema that defines its structure.
    `,
    examples: [
      {
        title: 'Employee Table',
        content: 'Columns: ID, Name, Department, Salary, Hire_Date'
      },
      {
        title: 'Product Table', 
        content: 'Columns: Product_ID, Name, Price, Category, Stock_Quantity'
      }
    ],
    prerequisites: ['database'],
    nextConcepts: ['data-types', 'database-keys']
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`concept-tabpanel-${index}`}
      aria-labelledby={`concept-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ConceptPage() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const updateProgress = useAppStore((state) => state.updateProgress);
  const user = useAppStore((state) => state.user);

  const concept = conceptData[conceptId!];

  useEffect(() => {
    if (conceptId) {
      updateProgress(conceptId, { 
        lastAccessed: new Date(),
        type: 'concept'
      });
    }
  }, [conceptId, updateProgress]);

  if (!concept) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Concept not found. <Button onClick={() => navigate('/learn')}>Return to learning</Button>
        </Alert>
      </Container>
    );
  }

  const isCompleted = user?.progress[conceptId!]?.completed || false;

  const handleComplete = () => {
    updateProgress(conceptId!, {
      completed: true,
      type: 'concept',
    });
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    const lines = content.trim().split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{line.replace('## ', '')}</Typography>;
      } else if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
        return match ? (
          <Typography key={index} variant="body1" sx={{ ml: 2, mb: 0.5 }}>
            • <strong>{match[1]}</strong>: {match[2]}
          </Typography>
        ) : <Typography key={index} variant="body1" sx={{ ml: 2 }}>{line}</Typography>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <Typography key={index} variant="body1" paragraph>{line}</Typography>;
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/learn')}
          sx={{ mr: 2 }}
        >
          Back to Learning
        </Button>
        <School color="primary" sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {concept.name}
          {isCompleted && <CheckCircle color="success" sx={{ ml: 1 }} />}
        </Typography>
      </Box>

      {/* Concept Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {concept.description}
        </Typography>
      </Box>

      {/* Prerequisites */}
      {concept.prerequisites && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Prerequisites:</strong> {concept.prerequisites.join(', ')}
        </Alert>
      )}

      {/* Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Theory" icon={<Lightbulb />} iconPosition="start" />
            <Tab label="Summary" icon={<MenuBook />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Theory</Typography>
            {formatContent(concept.theory)}
          </CardContent>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Summary</Typography>
            {formatContent(concept.summary)}
            
            {concept.examples && concept.examples.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Examples</Typography>
                {concept.examples.map((example: any, index: number) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>{example.title}</Typography>
                    <Typography variant="body2">{example.content}</Typography>
                  </Box>
                ))}
              </>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <div /> {/* Spacer */}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isCompleted && (
            <Button
              variant="contained"
              onClick={handleComplete}
              startIcon={<CheckCircle />}
            >
              Mark as Complete
            </Button>
          )}
          
          {concept.nextConcepts && concept.nextConcepts.length > 0 && (
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate(`/concept/${concept.nextConcepts[0]}`)}
            >
              Next: {conceptData[concept.nextConcepts[0]]?.name}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}