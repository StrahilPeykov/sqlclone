import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { ArrowBack, RestartAlt } from '@mui/icons-material'

import { siteTitle } from 'settings'
import { useCurrentRoute } from 'routing'

import { Container } from './Container'

export function Header() {
    const navigate = useNavigate()

	// If the route indicated no header should be present, don't render a header.
	const route = useCurrentRoute()
	if (route.header === false)
		return null

	// Render the Header.
    const handleReset = () => {
        const confirmed = window.confirm('Reset all your data? This clears progress, settings, and history.')
        if (!confirmed)
            return
        try {
            // Remove app-specific keys from localStorage
            const keysToRemove = []
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i)
                if (!key) continue
                if (key === 'sql-valley-storage' || key.startsWith('component-'))
                    keysToRemove.push(key)
            }
            keysToRemove.forEach(k => window.localStorage.removeItem(k))

            window.location.reload()
        } catch (err) {
            console.error('Failed to reset data:', err)
            alert('Sorry, something went wrong resetting your data.')
        }
    }

    return <Box>
        <AppBar position="static" enableColorOnDark>
            <Container>
                <Toolbar disableGutters={true} sx={{ px: 1 }}>
                    <IconButton edge="start" color="inherit" sx={{ mr: 2 }} onClick={() => navigate(route.back || '/')}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" color="inherit" component="div">
                        {route.title || siteTitle}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Reset all data">
                        <IconButton color="inherit" onClick={handleReset} aria-label="reset all data">
                            <RestartAlt />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </Container>
        </AppBar>
    </Box>
}
