import { useEffect, useMemo, useState } from 'react';
import { Paper, Tabs, Tab, IconButton, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import { formatSpeed, formatTime } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import { useAttributePreference } from '../common/util/preferences';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    height: 'min(42vh, 380px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: `${theme.shape.borderRadius * 1.2}px ${theme.shape.borderRadius * 1.2}px 0 0`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingRight: theme.spacing(1),
  },
  tabs: {
    flex: 1,
    minHeight: 44,
    '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 },
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
  table: {
    '& th': {
      whiteSpace: 'nowrap',
      fontWeight: 600,
      fontSize: '0.72rem',
      color: theme.palette.text.secondary,
    },
    '& td': {
      whiteSpace: 'nowrap',
      fontSize: '0.75rem',
      fontVariantNumeric: 'tabular-nums',
    },
  },
  trip: {
    listStyle: 'none',
    margin: 0,
    padding: theme.spacing(1, 2),
  },
  tripItem: {
    display: 'grid',
    gridTemplateColumns: 'auto 10px minmax(0, 1fr) auto',
    gap: theme.spacing(1.5),
    alignItems: 'baseline',
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: '0.8rem',
  },
  time: {
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    alignSelf: 'center',
  },
  value: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  empty: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const RouteDetails = ({ positions, deviceId, from, to, onClose }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const speedUnit = useAttributePreference('speedUnit');

  const [tab, setTab] = useState(0);
  const [events, setEvents] = useState(null);

  const attributeKeys = useMemo(
    () => Array.from(new Set(positions.flatMap((p) => Object.keys(p.attributes || {})))),
    [positions],
  );

  const columns = useMemo(
    () => [
      { key: 'fixTime', label: t('positionFixTime'), get: (p) => formatTime(p.fixTime, 'seconds') },
      { key: 'latitude', label: t('positionLatitude'), get: (p) => p.latitude?.toFixed(6) },
      { key: 'longitude', label: t('positionLongitude'), get: (p) => p.longitude?.toFixed(6) },
      { key: 'speed', label: t('positionSpeed'), get: (p) => formatSpeed(p.speed, speedUnit, t) },
      { key: 'course', label: t('positionCourse'), get: (p) => p.course },
      { key: 'altitude', label: t('positionAltitude'), get: (p) => p.altitude },
      { key: 'address', label: t('positionAddress'), get: (p) => p.address || '' },
    ],
    [t, speedUnit],
  );

  const loadEvents = useCatch(async () => {
    const query = new URLSearchParams({ from, to, deviceId, type: 'allEvents' });
    const response = await fetchOrThrow(`/api/reports/events?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    setEvents(await response.json());
  });

  useEffect(() => {
    if (tab === 1 && events === null) {
      loadEvents();
    }
  }, [tab]);

  return (
    <Paper elevation={6} className={classes.root}>
      <div className={classes.header}>
        <Tabs className={classes.tabs} value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Registro de datos" />
          <Tab label={t('reportEvents')} />
        </Tabs>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className={classes.body}>
        {tab === 0 && (
          <Table size="small" stickyHeader className={classes.table}>
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.key}>{c.label}</TableCell>
                ))}
                {attributeKeys.map((k) => (
                  <TableCell key={k}>{k}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((p) => (
                <TableRow key={p.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>{c.get(p)}</TableCell>
                  ))}
                  {attributeKeys.map((k) => (
                    <TableCell key={k}>
                      {p.attributes?.[k] === undefined ? '—' : String(p.attributes[k])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === 1 && (
          events && events.length ? (
            <ul className={classes.trip}>
              {events.map((event) => (
                <li key={event.id} className={classes.tripItem}>
                  <span className={classes.time}>{formatTime(event.eventTime, 'time')}</span>
                  <span className={classes.dot} />
                  <span>{t(prefixString('event', event.type))}</span>
                  <span className={classes.value}>
                    {event.attributes?.speed !== undefined
                      ? formatSpeed(event.attributes.speed, speedUnit, t)
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Typography className={classes.empty}>
              {events === null ? '…' : t('sharedNoData')}
            </Typography>
          )
        )}
      </div>
    </Paper>
  );
};

export default RouteDetails;
