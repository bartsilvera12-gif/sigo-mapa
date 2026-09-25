
import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  TextField,

  Button,

} from '@mui/material';

import { useTranslation } from '../common/components/LocalizationProvider';

import { useCatch } from '../reactHelper';

import fetchOrThrow from '../common/util/fetchOrThrow';



const AddDeviceDialog = ({ open, onClose }) => {

  const navigate = useNavigate();

  const t = useTranslation();



  const [name, setName] = useState('');

  const [uniqueId, setUniqueId] = useState('');



  const handleClose = () => {

    setName('');

    setUniqueId('');

    onClose();

  };



  const handleSave = useCatch(async () => {

    await fetchOrThrow('/api/devices', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ name, uniqueId }),

    });

    handleClose();

  });



  const handleMoreOptions = () => {

    const query = uniqueId ? `?uniqueId=${encodeURIComponent(uniqueId)}` : '';

    handleClose();

    navigate(`/settings/device${query}`);

  };



  return (

    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">

      <DialogTitle>{t('sharedAdd')}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

        <TextField

          autoFocus

          value={name}

          onChange={(e) => setName(e.target.value)}

          label={t('sharedName')}

          fullWidth

        />

        <TextField

          value={uniqueId}

          onChange={(e) => setUniqueId(e.target.value)}

          label={t('deviceIdentifier')}

          helperText={t('deviceIdentifierHelp')}

          fullWidth

        />

      </DialogContent>

      <DialogActions>

        <Button onClick={handleMoreOptions}>{t('sharedExtra')}</Button>

        <Button onClick={handleClose}>{t('sharedCancel')}</Button>

        <Button variant="contained" onClick={handleSave} disabled={!name || !uniqueId}>

          {t('sharedSave')}

        </Button>

      </DialogActions>

    </Dialog>

  );

};



export default AddDeviceDialog;

