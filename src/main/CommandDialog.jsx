import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import BoltIcon from '@mui/icons-material/Bolt';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import BaseCommandView from '../settings/components/BaseCommandView';

const useStyles = makeStyles()((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 1.5, 1.5, 2.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  bolt: {
    flex: 'none',
    color: theme.palette.primary.main,
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(2.5),
  },
}));

const CommandDialog = ({ open, onClose, deviceId }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const device = useSelector((state) => (deviceId ? state.devices.items[deviceId] : null));

  const [item, setItem] = useState({});
  const [savedId, setSavedId] = useState(0);

  useEffect(() => {
    if (open) {
      setItem({});
      setSavedId(0);
    }
  }, [open]);

  const handleSend = useCatch(async () => {
    let command;
    if (savedId) {
      const response = await fetchOrThrow(`/api/commands/${savedId}`);
      command = await response.json();
    } else {
      command = item;
    }
    command.deviceId = parseInt(deviceId, 10);
    await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    onClose();
  });

  const validate = () => savedId || (item && item.type);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <div className={classes.header}>
        <BoltIcon className={classes.bolt} />
        <div className={classes.titleText}>
          <Typography noWrap className={classes.title}>
            {t('commandTitle')}
          </Typography>
          {device && (
            <Typography noWrap className={classes.subtitle}>
              {device.name}
              {device.uniqueId ? ` · ${device.uniqueId}` : ''}
            </Typography>
          )}
        </div>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent>
        <div className={classes.content}>
          {open && deviceId && (
            <BaseCommandView
              deviceId={deviceId}
              item={item}
              setItem={setItem}
              includeSaved
              savedId={savedId}
              setSavedId={setSavedId}
            />
          )}
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose}>{t('sharedCancel')}</Button>
        <Button variant="contained" onClick={handleSend} disabled={!validate()}>
          {t('commandSend')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommandDialog;
