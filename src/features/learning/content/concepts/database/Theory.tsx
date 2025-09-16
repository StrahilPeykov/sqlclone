import type { ReactNode } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import DatabaseGlyph from '@/assets/glyphs/Database.svg';
import ServerGlyph from '@/assets/glyphs/Server.svg';
import UserGlyph from '@/assets/glyphs/User.svg';

const requirements: { title: string; body: string }[] = [
  {
    title: 'Deal with large amounts of data',
    body:
      'When the number of records grows into the millions it no longer fits in a single file or even in memory. We need tooling that scales.',
  },
  {
    title: 'Ask questions easily',
    body:
      'We want to slice and dice the data to answer questions such as "How many data science companies are in the Netherlands right now?" without heavy manual work.',
  },
  {
    title: 'Handle concurrent updates',
    body:
      'Applications and users must be able to insert and update data at the same time without conflicts, so the tooling has to orchestrate concurrency.',
  },
];

export function Theory() {
  const theme = useTheme();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="body1">
        Suppose that we have a list of all the tech companies in the world, including a large number of
        properties of each. How would we store this data? Could we just put it in something like an Excel file?
      </Typography>

      <TableFigure ariaLabel="Example table layout" color={alpha(theme.palette.primary.main, 0.18)} />

      <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
        Why databases? A list of requirements
      </Typography>
      <Typography variant="body1">
        For many small-scale use cases, storing data in a single file works fine. When we scale up, several
        issues start to appear.
      </Typography>

      <Box component="ul" sx={{ pl: 3, display: 'grid', gap: 1 }}>
        {requirements.map(item => (
          <Typography key={item.title} component="li" variant="body1">
            <Typography component="span" fontWeight={600} mr={0.5}>
              {item.title}:
            </Typography>
            {item.body}
          </Typography>
        ))}
      </Box>

      <Typography variant="body1">
        To meet these requirements, databases and corresponding software tools have been created.
      </Typography>

      <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
        Database: a collection of tables
      </Typography>
      <Typography variant="body1">
        A <strong>database</strong> stores data. Most databases do so purely in table form. The easiest way to
        picture a database is therefore as a collection of tables, each filled with potentially large amounts of
        entries. A small database consists of a few small tables, but larger databases can have dozens of
        enormous tables that are all linked to each other in some way.
      </Typography>

      <TableFigure ariaLabel="Multiple tables" color={alpha(theme.palette.primary.main, 0.18)} />

      <InfoBox>
        There are databases that deviate from this setup and do not exclusively store tables. Some store objects
        like <Link href="https://www.mongodb.com/" target="_blank" rel="noreferrer">MongoDB</Link>, others graphs
        like <Link href="https://neo4j.com/" target="_blank" rel="noreferrer">Neo4j</Link>, and some key-value
        pairs like <Link href="https://redis.io/" target="_blank" rel="noreferrer">Redis</Link>. Since this only
        involves a subset of all databases, we focus on table-based databases for now.
      </InfoBox>

      <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
        The database management system (DBMS)
      </Typography>
      <Typography variant="body1">
        The database is the collection of all data that is stored somewhere. To get this data stored in the
        desired way, we use specialized software called a <strong>Database Management System</strong> (DBMS).
        Examples include{' '}
        <Link href="https://www.postgresql.org/" target="_blank" rel="noreferrer">PostgreSQL</Link>,{' '}
        <Link href="https://www.mysql.com/" target="_blank" rel="noreferrer">MySQL</Link>,{' '}
        <Link href="https://www.oracle.com/database/" target="_blank" rel="noreferrer">Oracle</Link>,{' '}
        <Link href="https://sqlite.org/" target="_blank" rel="noreferrer">SQLite</Link>, and dozens more. The DBMS
        handles all functionality around the database, allowing users to read and write data.
      </Typography>

      <FigureDatabaseUsage />

      <Typography variant="body1">
        Every DBMS has its own way of storing data. As a result, a DBMS and a database are tightly linked you
        cannot simply take a database and plug it into a different DBMS. It is possible (and common) for a single
        DBMS to host multiple databases on the same machine, for instance to power different applications.
      </Typography>

      <InfoBox severity="warning">
        Because a database and its DBMS are so closely linked, people often use the word database when they
        actually mean DBMS. Hey, which database are you using at SQL Valley? Oh, we are using SQLite!
      </InfoBox>
    </Box>
  );
}

interface TableFigureProps {
  ariaLabel: string;
  color: string;
}

function TableFigure({ ariaLabel, color }: TableFigureProps) {
  const theme = useTheme();

  return (
    <Box
      component="figure"
      aria-label={ariaLabel}
      sx={{
        m: 0,
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
      }}
    >
      <Box component="svg" viewBox="0 0 800 200" role="img" sx={{ width: '100%', height: 'auto' }}>
        <title>{ariaLabel}</title>
        <text x={50} y={20} fontSize={14} fontWeight={600} fill={theme.palette.text.primary}>
          Example table (conceptual)
        </text>
        {[50, 290, 530].map(x => (
          <rect key={x} x={x} y={32} width={200} height={150} rx={12} ry={12} fill={color} />
        ))}
      </Box>
    </Box>
  );
}

interface InfoBoxProps {
  children: ReactNode;
  severity?: 'info' | 'warning';
}

function InfoBox({ children, severity = 'info' }: InfoBoxProps) {
  const theme = useTheme();
  const palette = severity === 'info' ? theme.palette.info : theme.palette.warning;

  return (
    <Box
      sx={{
        borderLeft: `4px solid ${palette.main}`,
        bgcolor: alpha(palette.main, 0.12),
        px: 2,
        py: 1.5,
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" color={palette.main} fontWeight={600} gutterBottom>
        {severity === 'info' ? 'Note' : 'Warning'}
      </Typography>
      <Typography variant="body1" color="text.primary">
        {children}
      </Typography>
    </Box>
  );
}

export function FigureDatabaseUsage() {
  const theme = useTheme();
  const arrowColor = alpha(theme.palette.primary.main, 0.6);
  const textColor = theme.palette.text.primary;

  return (
    <Box component="figure" sx={{ m: 0, width: '100%', maxWidth: 820, alignSelf: 'center' }}>
      <Box component="svg" viewBox="0 0 820 220" role="img" sx={{ width: '100%', height: 'auto' }}>
        <title>How a user, DBMS, and database interact</title>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill={arrowColor} />
          </marker>
        </defs>

        <image href={UserGlyph} x={40} y={40} width={110} height={110} />
        <text x={95} y={170} textAnchor="middle" fontSize={16} fontWeight={600} fill={textColor}>
          User
        </text>

        <image href={ServerGlyph} x={355} y={40} width={110} height={110} />
        <text x={410} y={170} textAnchor="middle" fontSize={16} fontWeight={600} fill={textColor}>
          DBMS
        </text>

        <image href={DatabaseGlyph} x={640} y={40} width={110} height={110} />
        <text x={695} y={170} textAnchor="middle" fontSize={16} fontWeight={600} fill={textColor}>
          Database
        </text>

        <CurvedArrow
          from={{ x: 110, y: 30 }}
          control={{ x: 250, y: -30 }}
          to={{ x: 375, y: 30 }}
          label="Get me the country with the most Data Science vacancies"
          labelPosition="above"
          arrowColor={arrowColor}
          textColor={textColor}
        />

        <CurvedArrow
          from={{ x: 480, y: 30 }}
          control={{ x: 560, y: -30 }}
          to={{ x: 650, y: 30 }}
          label="Pull up all relevant records"
          labelPosition="above"
          arrowColor={arrowColor}
          textColor={textColor}
        />

        <CurvedArrow
          from={{ x: 650, y: 150 }}
          control={{ x: 560, y: 210 }}
          to={{ x: 480, y: 150 }}
          label="Give all requested records"
          labelPosition="below"
          arrowColor={arrowColor}
          textColor={textColor}
        />

        <CurvedArrow
          from={{ x: 375, y: 150 }}
          control={{ x: 250, y: 210 }}
          to={{ x: 120, y: 150 }}
          label="The Netherlands"
          labelPosition="below"
          arrowColor={arrowColor}
          textColor={textColor}
        />
      </Box>
    </Box>
  );
}

interface CurvedArrowProps {
  from: { x: number; y: number };
  control: { x: number; y: number };
  to: { x: number; y: number };
  label: string;
  labelPosition: 'above' | 'below';
  arrowColor: string;
  textColor: string;
}

function CurvedArrow({ from, control, to, label, labelPosition, arrowColor, textColor }: CurvedArrowProps) {
  const labelY = labelPosition === 'above' ? Math.min(from.y, to.y, control.y) - 12 : Math.max(from.y, to.y, control.y) + 20;
  const midX = (from.x + to.x) / 2;

  return (
    <>
      <path
        d={`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`}
        fill="transparent"
        stroke={arrowColor}
        strokeWidth={2}
        markerEnd="url(#arrow)"
      />
      <text
        x={midX}
        y={labelY}
        textAnchor="middle"
        fontSize={12}
        fontWeight={500}
        fill={textColor}
      >
        {label}
      </text>
    </>
  );
}

export default Theory;

