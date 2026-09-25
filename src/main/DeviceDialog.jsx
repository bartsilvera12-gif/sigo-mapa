import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Typography,
  Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import { devicesActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SelectField from '../common/components/SelectField';
import LinkField from '../common/components/LinkField';
import deviceCategories from '../common/util/deviceCategories';
import EditAttributesAccordion from '../settings/components/EditAttributesAccordion';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';

const useStyles = makeStyles()((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 1.5, 1.5, 2.5),
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
  titleText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: 700,
    fontSize: '1.05rem',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: 44,
    '& .MuiTab-root': {
      minHeight: 44,
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(2.5),
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(4, 2),
    color: theme.palette.text.secondary,
  },
  emptyIcon: {
    fontSize: 40,
    color: theme.palette.text.disabled,
  },
}));

const EmptyTab = ({ icon, text, actionLabel, onAction }) => {
  const { classes } = useStyles();
  return (
    <div className={classes.empty}>
      <Box className={classes.emptyIcon}>{icon}</Box>
      <Typography variant="body2">{text}</Typography>
      {onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

const DeviceDialog = ({ open, onClose, deviceId }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const storedDevice = useSelector((state) => (deviceId ? state.devices.items[deviceId] : null));

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [item, setItem] = useState({});
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (open) {
      setTab(0);
      setItem(deviceId && storedDevice ? { ...storedDevice } : {});
    }
  }, [open, deviceId, storedDevice]);

  const editing = Boolean(deviceId);
  const attributes = item.attributes || {};
  const setAttr = (key, value) => setItem({ ...item, attributes: { ...attributes, [key]: value } });

  const handleSave = useCatch(async () => {
    const url = editing ? `/api/devices/${deviceId}` : '/api/devices';
    await fetchOrThrow(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const response = await fetchOrThrow('/api/devices');
    dispatch(devicesActions.refresh(await response.json()));
    onClose();
  });

  const openFullSettings = () => {
    onClose();
    navigate(`/settings/device/${deviceId}`);
  };

  const otherTabAction = editing
    ? { actionLabel: t('sharedEdit'), onAction: openFullSettings }
    : {};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <div className={classes.header}>
        <span className={classes.pin} />
        <div className={classes.titleText}>
          <Typography noWrap className={classes.title}>
            {editing ? item.name || t('sharedEdit') : t('sharedAdd')}
          </Typography>
          {editing && item.uniqueId && (
            <Typography noWrap className={classes.subtitle}>
              {item.uniqueId}
            </Typography>
          )}
        </div>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <Tabs
        className={classes.tabs}
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Principal" />
        <Tab label="Usuarios" />
        <Tab label="Iconos" />
        <Tab label="Avanzado" />
        <Tab label="Servicios" />
      </Tabs>

      <DialogContent>
        {tab === 0 && (
          <div className={classes.content}>
            <FormControlLabel
              control={
                <Switch
                  checked={!item.disabled}
                  onChange={(e) => setItem({ ...item, disabled: !e.target.checked })}
                />
              }
              label="Activo"
            />
            <TextField
              required
              label={t('sharedName')}
              value={item.name || ''}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
            />
            <TextField
              required
              label={t('deviceIdentifier')}
              helperText={t('deviceIdentifierHelp')}
              value={item.uniqueId || ''}
              onChange={(e) => setItem({ ...item, uniqueId: e.target.value })}
            />
            <TextField
              label={t('sharedPhone')}
              value={item.phone || ''}
              onChange={(e) => setItem({ ...item, phone: e.target.value })}
            />
            <TextField
              label="Número de placa"
              value={attributes.plate || ''}
              onChange={(e) => setAttr('plate', e.target.value)}
            />
            <TextField
              label={t('deviceModel')}
              value={item.model || ''}
              onChange={(e) => setItem({ ...item, model: e.target.value })}
            />
            <TextField
              label={t('deviceContact')}
              value={item.contact || ''}
              onChange={(e) => setItem({ ...item, contact: e.target.value })}
            />
            <SelectField
              value={item.groupId}
              onChange={(e) => setItem({ ...item, groupId: Number(e.target.value) })}
              endpoint="/api/groups"
              label={t('groupParent')}
            />
            <TextField
              label="Notas"
              multiline
              minRows={2}
              value={attributes.notes || ''}
              onChange={(e) => setAttr('notes', e.target.value)}
            />
          </div>
        )}
        {tab === 1 && (
          editing ? (
            <div className={classes.content}>
              <LinkField
                endpointAll="/api/users"
                endpointLinked={`/api/users?deviceId=${deviceId}`}
                baseId={deviceId}
                keyBase="deviceId"
                keyLink="userId"
                label="Usuarios con acceso"
              />
            </div>
          ) : (
            <EmptyTab
              icon={<PeopleIcon fontSize="inherit" />}
              text="Guardá el dispositivo primero para asignar qué usuarios lo ven."
            />
          )
        )}
        {tab === 2 && (
          <div className={classes.content}>
            <SelectField
              value={item.category || 'default'}
              onChange={(e) => setItem({ ...item, category: e.target.value })}
              data={deviceCategories
                .map((category) => ({
                  id: category,
                  name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                }))
                .sort((a, b) => a.name.localeCompare(b.name))}
              label="Icono en el mapa"
            />
            <Typography variant="caption" color="textSecondary">
              El color del marcador es automático según el estado (verde en marcha,
              amarillo detenido, rojo sin reportar, gris nunca reportó).
            </Typography>
          </div>
        )}
        {tab === 3 && (
          <div className={classes.content}>
            <EditAttributesAccordion
              attributes={attributes}
              setAttributes={(next) => setItem({ ...item, attributes: next })}
              definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
            />
            <Typography variant="overline" color="textSecondary">
              Sensores
            </Typography>
            {editing ? (
              <LinkField
                endpointAll="/api/attributes/computed"
                endpointLinked={`/api/attributes/computed?deviceId=${deviceId}`}
                baseId={deviceId}
                keyBase="deviceId"
                keyLink="attributeId"
                label="Sensores / atributos computados"
              />
            ) : (
              <Typography variant="body2" color="textSecondary">
                Guardá el dispositivo primero para asignar sensores.
              </Typography>
            )}
          </div>
        )}
        {tab === 4 && (
          <EmptyTab
            icon={<BuildIcon fontSize="inherit" />}
            text="Programá mantenimientos y servicios desde los ajustes completos."
            {...otherTabAction}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose}>{t('sharedCancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!item.name || !item.uniqueId}
        >
          {t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceDialog;
