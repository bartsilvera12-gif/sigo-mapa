import { IconButton, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import usePersistedState from '../common/util/usePersistedState';

const useStyles = makeStyles()((theme) => ({
  button: {
    position: 'fixed',
    right: 12,
    bottom: 96,
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 8px 22px rgba(12, 18, 32, 0.28)',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const ThemeToggle = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const [, setThemeMode] = usePersistedState('sigoThemeMode', 'auto');
  const isDark = theme.palette.mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'} placement="left">
      <IconButton
        className={classes.button}
        onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
