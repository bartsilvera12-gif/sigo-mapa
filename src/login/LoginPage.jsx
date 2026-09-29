import { useEffect, useRef, useState } from 'react';
import {
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  Button,
  TextField,
  Link,
  Snackbar,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import CountryFlag from 'react-country-flag';
import { motion } from 'framer-motion';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import LoginLayout from './LoginLayout';
import usePersistedState from '../common/util/usePersistedState';
import {
  generateLoginToken,
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from '../common/components/NativeInterface';
import LogoImage from './LogoImage';
import { useCatch } from '../reactHelper';
import QrCodeDialog from '../common/components/QrCodeDialog';
import PasswordField from '../common/components/PasswordField';

// Animación de entrada escalonada (fade + subida) para el formulario
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const Item = ({ children }) => (
  <motion.div variants={itemVariants} style={{ width: '100%' }}>
    {children}
  </motion.div>
);

const useStyles = makeStyles()((theme) => ({
  options: {
    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
    '& .MuiOutlinedInput-root': {
      borderRadius: 12,
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#161E2F',
      borderWidth: 2,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#161E2F',
    },
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    fontWeight: 700,
    fontSize: '0.95rem',
    backgroundColor: '#161E2F',
    color: '#FFFFFF',
    '&:hover': {
      backgroundColor: '#0C1220',
    },
  },
  title: {
    fontWeight: 700,
    fontSize: '1.85rem',
    lineHeight: 1.1,
    letterSpacing: '-.02em',
    color: theme.palette.text.primary,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  extraContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(4),
    marginTop: theme.spacing(2),
  },
  registerButton: {
    minWidth: 'unset',
  },
  link: {
    cursor: 'pointer',
  },
  flag: {
    marginRight: theme.spacing(1),
  },
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();

  const { languages, language, setLocalLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({
    code: values[0],
    country: values[1].country,
    name: values[1].name,
  }));

  const [failed, setFailed] = useState(false);

  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showServerTooltip, setShowServerTooltip] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const languageEnabled = useSelector((state) => {
    const attributes = state.session.server.attributes;
    return !attributes.language && !attributes['ui.disableLoginLanguage'];
  });
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector(
    (state) => state.session.server.openIdEnabled && state.session.server.openIdForce,
  );
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector((state) => state.session.server.announcement);

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem('postLogin') || '/';
        window.sessionStorage.removeItem('postLogin');
        navigate(target, { replace: true });
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetch(`/api/session?token=${encodeURIComponent(token)}`);
    if (response.ok) {
      const user = await response.json();
      dispatch(sessionActions.updateUser(user));
      navigate('/');
    } else if (response.status === 401) {
      nativePostMessage('logout');
    }
  });

  const handleTokenLoginRef = useRef(handleTokenLogin);
  handleTokenLoginRef.current = handleTokenLogin;

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLoginRef.current(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('hostname') !== window.location.hostname) {
      window.localStorage.setItem('hostname', window.location.hostname);
      setShowServerTooltip(true);
    }
  }, []);

  return (
    <LoginLayout>
      <div className={classes.options}>
        {nativeEnvironment && changeEnabled && (
          <IconButton color="primary" onClick={() => navigate('/change-server')}>
            <Tooltip
              title={`${t('settingsServer')}: ${window.location.hostname}`}
              open={showServerTooltip}
              arrow
            >
              <VpnLockIcon />
            </Tooltip>
          </IconButton>
        )}
        {!nativeEnvironment && (
          <IconButton color="primary" onClick={() => setShowQr(true)}>
            <QrCode2Icon />
          </IconButton>
        )}
        {languageEnabled && (
          <FormControl>
            <Select value={language} onChange={(e) => setLocalLanguage(e.target.value)}>
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <span className={classes.flag}>
                    <CountryFlag countryCode={it.country} svg />
                  </span>
                  {it.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      <motion.div
        className={classes.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {useMediaQuery(theme.breakpoints.down('lg')) && (
          <Item>
            <LogoImage color={theme.palette.primary.main} />
          </Item>
        )}
        <Item>
          <Typography className={classes.title}>Iniciá sesión</Typography>
          <Typography className={classes.subtitle}>
            Entrá con tu cuenta para ver tu vehículo.
          </Typography>
        </Item>
        {!openIdForced && (
          <>
            <Item>
              <TextField
                required
                fullWidth
                error={failed}
                label={t('userEmail')}
                name="email"
                value={email}
                autoComplete="email"
                autoFocus={!email}
                onChange={(e) => setEmail(e.target.value)}
                helperText={failed && 'Invalid username or password'}
              />
            </Item>
            <Item>
              <PasswordField
                required
                fullWidth
                error={failed}
                label={t('userPassword')}
                name="password"
                value={password}
                autoComplete="current-password"
                autoFocus={!!email}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Item>
            {codeEnabled && (
              <Item>
                <TextField
                  required
                  fullWidth
                  error={failed}
                  label={t('loginTotpCode')}
                  name="code"
                  value={code}
                  type="number"
                  onChange={(e) => setCode(e.target.value)}
                />
              </Item>
            )}
            <Item>
              <Button
                onClick={handlePasswordLogin}
                type="submit"
                variant="contained"
                fullWidth
                className={classes.loginButton}
                disabled={!email || !password || (codeEnabled && !code)}
              >
                {t('loginLogin')}
              </Button>
            </Item>
          </>
        )}
        {openIdEnabled && (
          <Item>
            <Button
              onClick={() => handleOpenIdLogin()}
              variant="contained"
              fullWidth
              color="secondary"
            >
              {t('loginOpenId')}
            </Button>
          </Item>
        )}
        {!openIdForced && (
          <Item>
            <div className={classes.extraContainer}>
              {registrationEnabled && (
                <Link
                  onClick={() => navigate('/register')}
                  className={classes.link}
                  underline="none"
                  variant="caption"
                >
                  {t('loginRegister')}
                </Link>
              )}
              {emailEnabled && (
                <Link
                  onClick={() => navigate('/reset-password')}
                  className={classes.link}
                  underline="none"
                  variant="caption"
                >
                  {t('loginReset')}
                </Link>
              )}
            </div>
          </Item>
        )}
      </motion.div>
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </LoginLayout>
  );
};

export default LoginPage;
