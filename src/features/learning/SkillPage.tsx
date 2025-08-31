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
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Code as CodeIcon,
  Lightbulb,
  MenuBook,
  Storage,
  School,
  ExpandMore,
  CheckCircle,
  PlayArrow,
} from '@mui/icons-material';
import { useAppStore } from '@/store';
import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';
import { useDatabase } from '@/features/database/DatabaseService';
import { databaseConfigs } from '@/features/database/schemas';

// Mock skill data with everything in one place
const skillData: Record<string, any> = {
  'filter-rows': {
    name: 'Filter Rows',
    description: 'Use WHERE clause to filter data based on conditions',
    database: 'basic',
    theory: `
# Filtering Rows in SQL

Filtering is one of the most fundamental operations in SQL. It allows you to select only the rows that meet specific criteria.

## The WHERE Clause

The \`WHERE\` clause is used to filter records based on specific conditions:

\`\`\`sql
SELECT * FROM companies
WHERE country = 'Netherlands';
\`\`\`

## Comparison Operators

- \`=\` Equal to
- \`<>\` or \`!=\` Not equal to
- \`<\` Less than
- \`>\` Greater than
- \`<=\` Less than or equal to
- \`>=\` Greater than or equal to

## Pattern Matching

Use \`LIKE\` with wildcards:
- \`%\` matches any sequence of characters
- \`_\` matches a single character

\`\`\`sql
SELECT * FROM companies
WHERE company_name LIKE 'Meta%';
\`\`\`
    `,
    reference: {
      syntax: "SELECT column1, column2, ...\nFROM table_name\nWHERE condition;",
      examples: [
        {
          title: "Filter by exact value",
          sql: "SELECT * FROM companies WHERE country = 'Netherlands';",
          description: "Returns all companies from the Netherlands"
        },
        {
          title: "Filter with comparison",
          sql: "SELECT * FROM positions WHERE salary > 100000;",
          description: "Returns all positions with salary greater than 100,000"
        },
        {
          title: "Filter with pattern",
          sql: "SELECT * FROM companies WHERE company_name LIKE 'M%';",
          description: "Returns all companies whose name starts with 'M'"
        }
      ],
      commonMistakes: [
        {
          mistake: "Using = with NULL values",
          correction: "Use IS NULL or IS NOT NULL instead"
        },
        {
          mistake: "Forgetting quotes around string values",
          correction: "Always wrap string values in single quotes"
        }
      ]
    },
    exercises: [
      {
        id: 1,
        title: "Filter by Country",
        description: "Find all companies from the Netherlands",
        expectedQuery: "SELECT * FROM companies WHERE country = 'Netherlands';",
        hints: [
          "Use the WHERE clause to filter rows",
          "Remember to use quotes around string values",
          "The country column contains 'Netherlands'"
        ]
      },
      {
        id: 2,
        title: "Filter by Salary Range",
        description: "Find all positions with salary greater than 100,000",
        expectedQuery: "SELECT * FROM positions WHERE salary > 100000;",
        hints: [
          "Use the > operator for greater than",
          "Numeric values don't need quotes",
          "The column name is 'salary'"
        ]
      },
      {
        id: 3,
        title: "Pattern Matching",
        description: "Find all companies whose name starts with 'A'",
        expectedQuery: "SELECT * FROM companies WHERE company_name LIKE 'A%';",
        hints: [
          "Use the LIKE operator for pattern matching",
          "Use % as a wildcard for any characters",
          "The pattern should be 'A%'"
        ]
      }
    ]
  },
  'choose-columns': {
    name: 'Choose Columns',
    description: 'Select specific columns and rename them with aliases',
    database: 'basic',
    theory: `
# Selecting Columns in SQL

Instead of selecting all columns with \`*\`, you can choose specific columns to display in your results.

## Basic Column Selection

\`\`\`sql
SELECT company_name, country 
FROM companies;
\`\`\`

## Column Aliases

You can rename columns in the output using aliases:

\`\`\`sql
SELECT 
    company_name AS "Company Name",
    country AS "Location"
FROM companies;
\`\`\`

## Benefits of Column Selection

- **Performance**: Only retrieve data you need
- **Clarity**: Focus on relevant information
- **Security**: Hide sensitive columns
- **Bandwidth**: Reduce data transfer
    `,
    reference: {
      syntax: "SELECT column1, column2 AS alias\nFROM table_name;",
      examples: [
        {
          title: "Select specific columns",
          sql: "SELECT company_name, country FROM companies;",
          description: "Returns only the name and country columns"
        },
        {
          title: "Using aliases",
          sql: "SELECT company_name AS name, country AS location FROM companies;",
          description: "Renames columns in the output"
        }
      ]
    },
    exercises: [
      {
        id: 1,
        title: "Select Company Names",
        description: "Select only the company names from the companies table",
        expectedQuery: "SELECT company_name FROM companies;",
        hints: ["List the specific column name after SELECT", "Don't use * for this exercise"]
      }
    ]
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
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [query, setQuery] = useState('');
  const [currentExercise, setCurrentExercise] = useState(0);
  const updateProgress = useAppStore((state) => state.updateProgress);
  const user = useAppStore((state) => state.user);

  const skill = skillData[skillId!];
  
  const {
    executeQuery,
    queryResult,
    queryError,
    isExecuting,
    tableNames,
  } = useDatabase(skill ? databaseConfigs[skill.database as keyof typeof databaseConfigs] : databaseConfigs.basic);

  useEffect(() => {
    if (skillId) {
      updateProgress(skillId, { 
        lastAccessed: new Date(),
        type: 'skill'
      });
    }
  }, [skillId, updateProgress]);

  if (!skill) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Skill not found. <Button onClick={() => navigate('/learn')}>Return to learning</Button>
        </Alert>
      </Container>
    );
  }

  const progress = user?.progress[skillId!];
  const exercisesCompleted = progress?.exercisesCompleted || 0;
  const totalExercises = skill.exercises?.length || 0;

  const handleExecuteQuery = async () => {
    try {
      await executeQuery(query);
    } catch (error) {
      console.error('Query execution failed:', error);
    }
  };

  const formatContent = (content: string) => {
    const lines = content.trim().split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <Typography key={index} variant="h5" sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>{line.replace('# ', '')}</Typography>;
      } else if (line.startsWith('## ')) {
        return <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{line.replace('## ', '')}</Typography>;
      } else if (line.startsWith('```sql')) {
        return null; // Handle code blocks separately
      } else if (line.startsWith('```')) {
        return null;
      } else if (line.startsWith('- ')) {
        return <Typography key={index} variant="body1" sx={{ ml: 2, mb: 0.5 }}>{line}</Typography>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <Typography key={index} variant="body1" paragraph>{line}</Typography>;
      }
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/learn')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <CodeIcon color="secondary" sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {skill.name}
        </Typography>
      </Box>

      {/* Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {skill.description}
        </Typography>
      </Box>

      {/* Progress */}
      {totalExercises > 0 && exercisesCompleted > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Progress: {exercisesCompleted} of {totalExercises} exercises completed
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Content */}
        <Grid item xs={12} lg={6}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} variant="fullWidth">
                <Tab label="Practice" icon={<PlayArrow />} iconPosition="start" />
                <Tab label="Theory" icon={<Lightbulb />} iconPosition="start" />
                <Tab label="Reference" icon={<MenuBook />} iconPosition="start" />
                <Tab label="Schema" icon={<Storage />} iconPosition="start" />
              </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Exercises</Typography>
                
                {skill.exercises?.map((exercise: any, index: number) => (
                  <Accordion key={exercise.id} expanded={currentExercise === index}>
                    <AccordionSummary 
                      expandIcon={<ExpandMore />}
                      onClick={() => setCurrentExercise(index)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {exercisesCompleted > index ? (
                          <CheckCircle color="success" />
                        ) : (
                          <School color="action" />
                        )}
                        <Typography variant="h6">{exercise.title}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1" paragraph>
                        {exercise.description}
                      </Typography>
                      
                      {exercise.hints && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Hints:</Typography>
                          {exercise.hints.map((hint: string, hintIndex: number) => (
                            <Typography key={hintIndex} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                              • {hint}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => setQuery(exercise.expectedQuery)}
                      >
                        Show Solution
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Theory</Typography>
                {formatContent(skill.theory)}
              </CardContent>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <CardContent>
                <Typography variant="h5" gutterBottom>SQL Reference</Typography>
                
                {skill.reference && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Syntax</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', mb: 2 }}>
                      <pre>{skill.reference.syntax}</pre>
                    </Paper>
                    
                    {skill.reference.examples && (
                      <>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Examples</Typography>
                        {skill.reference.examples.map((example: any, index: number) => (
                          <Box key={index} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">{example.title}</Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.875rem', mb: 1 }}>
                              <code>{example.sql}</code>
                            </Paper>
                            <Typography variant="body2" color="text.secondary">
                              {example.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                    
                    {skill.reference.commonMistakes && (
                      <>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Common Mistakes</Typography>
                        {skill.reference.commonMistakes.map((mistake: any, index: number) => (
                          <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>Mistake:</strong> {mistake.mistake}<br />
                              <strong>Correction:</strong> {mistake.correction}
                            </Typography>
                          </Alert>
                        ))}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Database Schema</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Available tables: {tableNames.join(', ')}
                </Alert>
                <Typography variant="body1">
                  This skill uses the <strong>{skill.database}</strong> database configuration.
                </Typography>
              </CardContent>
            </TabPanel>
          </Card>
        </Grid>

        {/* Right Column - SQL Editor & Results */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>SQL Practice</Typography>
              <SQLEditor
                value={query}
                onChange={setQuery}
                onExecute={handleExecuteQuery}
                height="300px"
                placeholder="Write your SQL query here..."
              />
              
              {queryError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {queryError instanceof Error ? queryError.message : 'Query execution failed'}
                </Alert>
              )}
              
              {queryResult && queryResult.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Results</Typography>
                  <DataTable data={queryResult[0]} maxHeight={400} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}