import { Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    minHeight: '100vh',
    height: '100%',
  },
  sidebar: {
    flex: '1.05 1 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(5),
    position: 'relative',
    overflow: 'hidden',
    background: '#161E2F',
    padding: theme.spacing(9, 7),
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  logoWrap: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: 'min(420px, 80%)',
    marginTop: theme.spacing(-4),
  },
  video: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    display: 'block',
    mixBlendMode: 'lighten',
    transition: 'opacity .25s',
  },
  poster: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    mixBlendMode: 'lighten',
    opacity: 0,
    transition: 'opacity .25s',
    pointerEvents: 'none',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: theme.spacing(2.5),
    maxWidth: 440,
    marginTop: theme.spacing(-6),
  },
  tagline: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontStyle: 'italic',
    fontWeight: 500,
    fontSize: 32,
    lineHeight: 1.15,
    color: '#FFFFFF',
    letterSpacing: '-.01em',
  },
  desc: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#8A93A6',
    maxWidth: 360,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing(3.5),
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '8px 20px',
    fontSize: 10,
    fontWeight: 500,
    color: '#D9E1E8',
    letterSpacing: '.1em',
  },
  sep: {
    color: '#384358',
  },
  paper: {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: theme.palette.background.default,
    borderRadius: 0,
    [theme.breakpoints.up('md')]: {
      boxShadow: '-2px 0 16px rgba(0, 0, 0, 0.12)',
    },
  },
  form: {
    maxWidth: theme.spacing(52),
    padding: theme.spacing(5),
    width: '100%',
  },
}));

const initVideo = (el) => {
  if (!el || el.dataset.sigoInit) {
    return;
  }
  el.dataset.sigoInit = '1';
  el.muted = true;
  el.loop = false;
  el.addEventListener('ended', () => {
    el.style.opacity = '0';
    const poster = el.parentElement?.querySelector('[data-sigo-poster]');
    if (poster) {
      poster.style.opacity = '1';
    }
  });
  const start = () => el.play().catch(() => {});
  if (el.readyState >= 3) {
    start();
  } else {
    el.addEventListener('canplaythrough', start, { once: true });
  }
};

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();

  return (
    <main className={classes.root}>
      <div className={classes.sidebar}>
        <div className={classes.logoWrap}>
          <img
            data-sigo-poster
            className={classes.poster}
            src="/sigo/sigo-logo-anim-poster.png"
            alt="SIGO"
          />
          <video
            ref={initVideo}
            className={classes.video}
            src="/sigo/sigo-logo-anim.mp4"
            poster="/sigo/sigo-logo-anim-poster.png"
            aria-label="SIGO"
            autoPlay
            muted
            playsInline
            preload="auto"
          />
        </div>
        <div className={classes.brandText}>
          <div className={classes.tagline}>Donde esté, lo sabés.</div>
          <div className={classes.desc}>
            Rastreo simple, siempre encendido. Entrá y mirá dónde está lo tuyo, a la hora que sea.
          </div>
        </div>
        <div className={classes.footer}>
          <span>SIGO PARAGUAY</span>
          <span className={classes.sep}>·</span>
          <span>@SIGO_PY</span>
        </div>
      </div>
      <Paper className={classes.paper} elevation={0}>
        <form className={classes.form}>{children}</form>
      </Paper>
    </main>
  );
};

export default LoginLayout;
