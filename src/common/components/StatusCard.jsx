import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  CardMedia,
  Link,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import fetchOrThrow from '../util/fetchOrThrow';

// SIGO status: marcha (verde) / quieto (amarillo) / noreporta (rojo) / nunca (gris)
const sigoStatus = (device, position) => {
  if (device?.status === 'online') {
    const moving = position?.attributes?.motion ?? (position?.speed > 0);
    return moving ? 'moving' : 'idle';
  }
  if (device?.status === 'offline') {
    return 'offline';
  }
  return 'never';
};

const useStyles = makeStyles()((theme, { desktopPadding }) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.25, 1, 1.25, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  pin: {
    flex: 'none',
    width: 13,
    height: 13,
    borderRadius: '50% 50% 50% 0',
    transform: 'rotate(-45deg)',
    backgroundColor: theme.palette.primary.main,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontWeight: 600,
    fontSize: '0.9rem',
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
  media: {
    height: theme.dimensions.popupImageHeight,
    '& > div': {
      color: theme.palette.common.white,
      mixBlendMode: 'difference',
    },
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  eyebrow: {
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    margin: theme.spacing(1.25, 0, 0.25),
  },
  address: {
    fontSize: '0.8125rem',
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  kvGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    columnGap: theme.spacing(2.5),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  kvRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: '0.78rem',
  },
  kvLabel: {
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  kvValue: {
    fontWeight: 500,
    textAlign: 'right',
    overflowWrap: 'anywhere',
  },
  details: {
    marginTop: theme.spacing(1.25),
    display: 'block',
  },
  actions: {
    justifyContent: 'space-between',
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  },
}));

const StatusCard = ({ deviceId, position, onClose, onEdit, disableActions, desktopPadding = 0 }) => {
  const { classes, cx } = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;

  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference(
    'positionItems',
    'fixTime,address,speed,totalDistance',
  );

  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);

  const [removing, setRemoving] = useState(false);

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/settings/geofence/${item.id}`);
  }, [navigate, position, t]);

  const status = sigoStatus(device, position);

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            dragHandleClassName="draggable-header"
            style={{ position: 'relative' }}
          >
            <Card elevation={3} className={classes.card}>
              {deviceImage ? (
                <CardMedia
                  className={`draggable-header ${classes.media}`}
                  image={`/api/media/${device.uniqueId}/${deviceImage}`}
                />
              ) : null}
              <div className={`draggable-header ${classes.header}`}>
                <span className={classes.pin} />
                <Typography noWrap className={classes.title}>
                  {device.name}
                  {device.uniqueId ? ` · ${device.uniqueId}` : ''}
                </Typography>
                <Tooltip title={t(`deviceStatus${device.status.charAt(0).toUpperCase()}${device.status.slice(1)}`)}>
                  <span className={cx(classes.dot, classes[status])} />
                </Tooltip>
                <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
              {position && (
                <CardContent className={classes.content}>
                  {position.address && (
                    <>
                      <Typography className={classes.eyebrow}>
                        {positionAttributes.address?.name || t('positionAddress')}
                      </Typography>
                      <Typography className={classes.address}>{position.address}</Typography>
                    </>
                  )}
                  <div className={classes.kvGrid}>
                    {positionItems
                      .split(',')
                      .filter(
                        (key) =>
                          key !== 'address' &&
                          (position.hasOwnProperty(key) || position.attributes.hasOwnProperty(key)),
                      )
                      .map((key) => (
                        <div key={key} className={classes.kvRow}>
                          <span className={classes.kvLabel}>
                            {positionAttributes[key]?.name || key}
                          </span>
                          <span className={classes.kvValue}>
                            <PositionValue
                              position={position}
                              property={position.hasOwnProperty(key) ? key : null}
                              attribute={position.hasOwnProperty(key) ? null : key}
                            />
                          </span>
                        </div>
                      ))}
                  </div>
                  <Link
                    component={RouterLink}
                    to={`/position/${position.id}`}
                    className={classes.details}
                    variant="body2"
                  >
                    {t('sharedShowDetails')}
                  </Link>
                </CardContent>
              )}
              <CardActions className={classes.actions} disableSpacing>
                <Tooltip title={t('sharedExtra')}>
                  <IconButton
                    color="secondary"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={!position}
                  >
                    <PendingIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('reportReplay')}>
                  <IconButton
                    onClick={() => navigate(`/replay?deviceId=${deviceId}`)}
                    disabled={disableActions || !position}
                  >
                    <RouteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('commandTitle')}>
                  <IconButton
                    onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                    disabled={disableActions}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedEdit')}>
                  <IconButton
                    onClick={() =>
                      onEdit ? onEdit(deviceId) : navigate(`/settings/device/${deviceId}`)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedRemove')}>
                  <IconButton
                    color="error"
                    onClick={() => setRemoving(true)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Rnd>
        )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={() => navigate(`/stream?deviceId=${deviceId}`)}
            disabled={position.protocol !== 'jt808'}
          >
            {t('linkLiveVideo')}
          </MenuItem>
          {!readonly && <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>}
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && navigationAppLink && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}>
              <Typography color="secondary">{t('sharedShare')}</Typography>
            </MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
