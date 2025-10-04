import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person,
  Engineering,
  BusinessCenter,
  School,
  Code,
  DataObject,
} from '@mui/icons-material';

export interface DialogueLine {
  character: string;
  text: string;
  role?: 'intern' | 'senior' | 'pm' | 'mentor' | 'data-analyst' | 'developer';
  delay?: number; // Optional delay before showing this line (in ms)
}

interface DialogueBoxProps {
  dialogue: DialogueLine[];
  autoPlay?: boolean;
  typingSpeed?: number; // Characters per second
  onComplete?: () => void;
}

const characterStyles = {
  intern: {
    avatar: { bgcolor: '#98bc37', color: 'white' },
    icon: School,
    title: 'Intern',
  },
  senior: {
    avatar: { bgcolor: '#c8102e', color: 'white' },
    icon: Engineering,
    title: 'Senior Developer',
  },
  pm: {
    avatar: { bgcolor: '#262626', color: 'white' },
    icon: BusinessCenter,
    title: 'Product Manager',
  },
  mentor: {
    avatar: { bgcolor: '#61afef', color: 'white' },
    icon: Person,
    title: 'Mentor',
  },
  'data-analyst': {
    avatar: { bgcolor: '#e5c07b', color: 'black' },
    icon: DataObject,
    title: 'Data Analyst',
  },
  developer: {
    avatar: { bgcolor: '#98bc37', color: 'white' },
    icon: Code,
    title: 'Developer',
  },
};

function TypingText({ text, speed = 30, onComplete }: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 1000 / speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <Typography variant="body1" sx={{ minHeight: '1.5em' }}>
      {displayedText}
      {currentIndex < text.length && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '2px',
            height: '1.2em',
            bgcolor: 'text.primary',
            ml: 0.5,
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0 },
            },
          }}
        />
      )}
    </Typography>
  );
}

export function DialogueBox({ 
  dialogue, 
  autoPlay = true, 
  typingSpeed = 40,
  onComplete 
}: DialogueBoxProps) {
  const theme = useTheme();
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showLine, setShowLine] = useState(false);
  const [visibleLines, setVisibleLines] = useState<DialogueLine[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Auto-scroll to bottom when new message appears
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Check scroll position for fade indicators
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setCanScrollUp(scrollTop > 10);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10);
    }
  };

  useEffect(() => {
    if (!autoPlay || currentLineIndex >= dialogue.length) return;

    const currentLine = dialogue[currentLineIndex];
    const delay = currentLine.delay || 0;

    const timer = setTimeout(() => {
      setShowLine(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentLineIndex, dialogue, autoPlay]);

  useEffect(() => {
    if (showLine && currentLineIndex < dialogue.length) {
      setVisibleLines(prev => [...prev, dialogue[currentLineIndex]]);
      // Auto-scroll after message is added
      setTimeout(scrollToBottom, 100);
      setTimeout(checkScrollPosition, 200);
    }
  }, [showLine, currentLineIndex, dialogue]);

  const handleTypingComplete = () => {
    // Move to next line after a brief pause
    setTimeout(() => {
      if (currentLineIndex < dialogue.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
        setShowLine(false);
      } else {
        onComplete?.();
      }
    }, 800);
  };

  if (!dialogue.length) return null;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      {/* Chat Container */}
      <Paper
        elevation={1}
        sx={{
          height: 420,
          position: 'relative',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fade indicator at top */}
        {canScrollUp && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, transparent)`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Scrollable messages area */}
        <Box
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(theme.palette.text.secondary, 0.3),
              borderRadius: 3,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.secondary, 0.5),
              },
            },
          }}
        >
          {visibleLines.map((line, index) => {
            const isCurrentLine = index === currentLineIndex;
            const characterStyle = characterStyles[line.role || 'developer'];
            const IconComponent = characterStyle.icon;

            return (
              <Fade key={index} in={true} timeout={600}>
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    {/* Character Avatar */}
                    <Avatar sx={{ ...characterStyle.avatar, width: 40, height: 40 }}>
                      <IconComponent fontSize="small" />
                    </Avatar>

                    {/* Speech Bubble */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Character Name */}
                      <Typography 
                        variant="caption"
                        sx={{ 
                          display: 'block',
                          mb: 0.5, 
                          color: 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        {line.character} • {characterStyle.title}
                      </Typography>

                      {/* Message Bubble */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.background.default, 0.6)
                            : alpha(theme.palette.grey[100], 0.8),
                          borderRadius: 1.5,
                          border: isCurrentLine ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                          transition: 'border-color 0.3s ease',
                          position: 'relative',
                        }}
                      >
                        {isCurrentLine && showLine ? (
                          <TypingText 
                            text={line.text} 
                            speed={typingSpeed}
                            onComplete={handleTypingComplete}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {line.text}
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            );
          })}
        </Box>

        {/* Fade indicator at bottom */}
        {canScrollDown && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: `linear-gradient(to top, ${alpha(theme.palette.background.paper, 0.9)}, transparent)`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}
      </Paper>

      {/* Progress Indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
        {dialogue.map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: index <= currentLineIndex ? 'primary.main' : 'action.disabled',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}