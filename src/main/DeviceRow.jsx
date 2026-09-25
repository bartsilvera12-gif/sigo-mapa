import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { IconButton, Tooltip, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatSpeed,
  formatStatus,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAdministrator } from '../common/util/permissions';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';

dayjs.extend(relativeTime);

// SIGO status: marcha (verde) / quieto (amarillo) / noreporta (rojo) / nunca (gris)
const sigoStatus = (item, position) => {
  if (item.status === 'online') {
    const moving = position?.attributes?.motion ?? (position?.speed > 0);
    return moving ? 'moving' : 'idle';
  }
  if (item.status === 'offline') {
    return 'offline';
  }
  return 'never';
};

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.25, 1.75),
    cursor: 'pointer',
    borderLeft: '2px solid transparent',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
    borderLeftColor: theme.palette.primary.main,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 500,
    fontSize: '0.8125rem',
  },
  meta: {
    fontSize: '0.72rem',
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
  code: {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  speed: {
    fontWeight: 600,
    fontSize: '0.75rem',
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  dot: {
    flex: 'none',
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  moving: { backgroundColor: theme.palette.status.moving },
  idle: { backgroundColor: theme.palette.status.idle },
  offline: {
    backgroundColor: theme.palette.status.offline,
    boxShadow: `0 0 0 3px ${theme.palette.status.offline}47`,
  },
  never: { backgroundColor: theme.palette.status.never },
  alarm: {
    color: theme.palette.error.main,
  },
}));

const DeviceRow = ({ devices, index, style }) => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const speedUnit = useAttributePreference('speedUnit');
  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const resolveFieldValue = (field) => {
    if (field === 'geofenceIds') {
      const geofenceIds = position?.geofenceIds;
      return geofenceIds?.length ? <GeofencesValue geofenceIds={geofenceIds} /> : null;
    }
    if (field === 'driverUniqueId') {
      const driverUniqueId = position?.attributes?.driverUniqueId;
      return driverUniqueId ? <DriverValue driverUniqueId={driverUniqueId} /> : null;
    }
    if (field === 'motion') {
      return <MotionBar deviceId={item.id} />;
    }
    return item[field];
  };

  const primaryValue = resolveFieldValue(devicePrimary);
  const secondaryValue = deviceSecondary ? resolveFieldValue(deviceSecondary) : item.uniqueId;

  const timeText = () => {
    if (item.status === 'online' || !item.lastUpdate) {
      return formatStatus(item.status, t);
    }
    return dayjs(item.lastUpdate).fromNow();
  };

  const status = sigoStatus(item, position);
  const disabled = !admin && item.disabled;

  return (
    <div style={style}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && dispatch(devicesActions.selectId(item.id))}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            dispatch(devicesActions.selectId(item.id));
          }
        }}
        className={cx(classes.row, {
          [classes.selected]: selectedDeviceId === item.id,
          [classes.disabled]: disabled,
        })}
      >
        <div className={classes.text}>
          <Typography noWrap className={classes.name}>
            {primaryValue}
          </Typography>
          <Typography noWrap component="div" className={classes.meta}>
            {secondaryValue && (
              <>
                <span className={classes.code}>{secondaryValue}</span>
                {' · '}
              </>
            )}
            {timeText()}
          </Typography>
        </div>
        {position?.attributes?.hasOwnProperty('alarm') && (
          <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
            <IconButton size="small">
              <ErrorIcon fontSize="small" className={classes.alarm} />
            </IconButton>
          </Tooltip>
        )}
        {position && (
          <span className={classes.speed}>{formatSpeed(position.speed, speedUnit, t)}</span>
        )}
        <Tooltip title={formatStatus(item.status, t)}>
          <span className={cx(classes.dot, classes[status])} />
        </Tooltip>
      </div>
    </div>
  );
};

export default DeviceRow;
