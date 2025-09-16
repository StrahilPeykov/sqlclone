import { Box, Link, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { FigureDatabaseUsage } from './Theory';

export function Summary() {
  const theme = useTheme();
  const color = alpha(theme.palette.primary.main, 0.18);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="body1">
        In its essence, a <strong>database</strong> is a collection of tables, each filled with data. There may be
        millions of records that are constantly being updated by multiple applications at the same time.
      </Typography>

      <TwoTableFigure color={color} />

      <Typography variant="body1">
        A database is always accompanied by software used to efficiently insert, update, and retrieve the data.
        This collection of tooling is known as the <strong>Database Management System</strong> (DBMS). Popular
        examples include{' '}
        <Link href="https://www.postgresql.org/" target="_blank" rel="noreferrer">PostgreSQL</Link>,{' '}
        <Link href="https://www.mysql.com/" target="_blank" rel="noreferrer">MySQL</Link>,{' '}
        <Link href="https://www.oracle.com/database/" target="_blank" rel="noreferrer">Oracle</Link>, and{' '}
        <Link href="https://sqlite.org/" target="_blank" rel="noreferrer">SQLite</Link>.
      </Typography>

      <FigureDatabaseUsage />
    </Box>
  );
}

interface TwoTableFigureProps {
  color: string;
}

function TwoTableFigure({ color }: TwoTableFigureProps) {
  const theme = useTheme();

  return (
    <Box component="figure" sx={{ m: 0, width: '100%', maxWidth: 820, alignSelf: 'center' }}>
      <Box component="svg" viewBox="0 0 820 420" role="img" sx={{ width: '100%', height: 'auto' }}>
        <title>Two tables representing companies and vacancies</title>
        <text x={10} y={20} fontSize={14} fontWeight={600} fill={theme.palette.text.primary}>
          Table TechCompanies
        </text>
        {[0, 170, 340].map(x => (
          <rect key={`companies-${x}`} x={x} y={32} width={150} height={170} rx={12} ry={12} fill={color} />
        ))}

        <text x={320} y={230} fontSize={14} fontWeight={600} fill={theme.palette.text.primary}>
          Table Vacancies
        </text>
        {[310, 480, 650].map(x => (
          <rect key={`vacancies-${x}`} x={x} y={242} width={150} height={170} rx={12} ry={12} fill={color} />
        ))}
      </Box>
    </Box>
  );
}

export default Summary;
