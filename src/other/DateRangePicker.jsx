import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  TextField,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
const DIAS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

const clave = (d) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const fmt = (d) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
const timeStr = (d) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const PRESETS = [
  ['Hoy', (h) => [new Date(h), new Date(h)]],
  ['Ayer', (h) => { const d = new Date(h); d.setDate(d.getDate() - 1); return [d, new Date(d)]; }],
  ['Últimos 2 días', (h) => { const d = new Date(h); d.setDate(d.getDate() - 2); return [d, new Date(h)]; }],
  ['Últimos 3 días', (h) => { const d = new Date(h); d.setDate(d.getDate() - 3); return [d, new Date(h)]; }],
  ['Esta semana', (h) => { const a = new Date(h); a.setDate(a.getDate() - ((a.getDay() + 6) % 7)); return [a, new Date(h)]; }],
  ['Semana pasada', (h) => { const a = new Date(h); a.setDate(a.getDate() - ((a.getDay() + 6) % 7) - 7); const b = new Date(a); b.setDate(b.getDate() + 6); return [a, b]; }],
  ['Este mes', (h) => [new Date(h.getFullYear(), h.getMonth(), 1), new Date(h)]],
  ['Mes pasado', (h) => [new Date(h.getFullYear(), h.getMonth() - 1, 1), new Date(h.getFullYear(), h.getMonth(), 0)]],
];

const useStyles = makeStyles()((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.25, 1.5, 1.25, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  cal: { flex: 'none', color: theme.palette.primary.main },
  title: { flex: 1, fontWeight: 700, fontSize: '1rem' },
  presets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
    marginBottom: theme.spacing(1.5),
  },
  preset: {
    padding: theme.spacing(0.75, 1.25),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    background: theme.palette.background.default,
    color: theme.palette.text.secondary,
    font: '500 12px inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': { background: theme.palette.action.hover, color: theme.palette.text.primary },
  },
  presetOn: {
    background: theme.palette.action.selected,
    color: theme.palette.text.primary,
    borderColor: theme.palette.text.secondary,
  },
  calendar: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 11,
    padding: theme.spacing(1),
    background: theme.palette.action.hover,
  },
  calHead: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(0.75),
  },
  calMonth: { flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
    textAlign: 'center',
  },
  dayName: {
    font: '600 10px inherit',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    paddingBottom: 4,
  },
  day: {
    height: 30,
    border: 0,
    borderRadius: 7,
    background: theme.palette.action.hover,
    color: theme.palette.text.primary,
    font: '500 12px inherit',
    fontVariantNumeric: 'tabular-nums',
    cursor: 'pointer',
    '&:hover': { background: theme.palette.action.selected },
  },
  off: { background: 'none', color: theme.palette.text.disabled },
  today: { boxShadow: `inset 0 0 0 1.5px ${theme.palette.primary.main}` },
  between: { background: `${theme.palette.primary.main}28`, color: theme.palette.text.primary },
  selected: {
    background: theme.palette.primary.main,
    color: '#fff',
    fontWeight: 700,
  },
  range: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(2),
  },
  field: { flex: 1, minWidth: 0 },
  dash: { color: theme.palette.text.secondary, paddingBottom: theme.spacing(1) },
}));

const DateRangePicker = ({ open, initialFrom, initialTo, onClose, onApply }) => {
  const { classes, cx } = useStyles();

  const [base, setBase] = useState(firstOfMonth(new Date()));
  const [d1, setD1] = useState(new Date());
  const [d2, setD2] = useState(new Date());
  const [t1, setT1] = useState('00:00');
  const [t2, setT2] = useState('23:59');

  useEffect(() => {
    if (open) {
      const a = initialFrom ? new Date(initialFrom) : new Date();
      const b = initialTo ? new Date(initialTo) : new Date();
      setD1(a);
      setD2(b);
      setT1(timeStr(a));
      setT2(timeStr(b));
      setBase(firstOfMonth(a));
    }
  }, [open, initialFrom, initialTo]);

  const today = new Date();
  const kToday = clave(today);
  const kMin = Math.min(clave(d1), clave(d2));
  const kMax = Math.max(clave(d1), clave(d2));

  const pickPreset = (fn) => {
    const [a, z] = fn(today);
    setD1(a);
    setD2(z);
    setBase(firstOfMonth(a));
  };

  const pickDay = (d) => {
    if (clave(d) < clave(d1) || clave(d1) !== clave(d2)) {
      setD1(d);
      setD2(new Date(d));
    } else {
      setD2(d);
    }
  };

  const buildDays = () => {
    const y = base.getFullYear();
    const m = base.getMonth();
    const off = (new Date(y, m, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(y, m, 1 - off + i));
  };

  const handleApply = () => {
    const [h1, mi1] = t1.split(':').map(Number);
    const [h2, mi2] = t2.split(':').map(Number);
    let from = new Date(Math.min(clave(d1), clave(d2)) === clave(d1) ? d1 : d2);
    let to = new Date(kMax === clave(d2) ? d2 : d1);
    from = new Date(from.getFullYear(), from.getMonth(), from.getDate(), h1 || 0, mi1 || 0, 0);
    to = new Date(to.getFullYear(), to.getMonth(), to.getDate(), h2 || 23, mi2 || 59, 59);
    onApply(from, to);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <div className={classes.header}>
        <CalendarMonthIcon className={classes.cal} />
        <Typography className={classes.title}>Seleccionar fecha</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <DialogContent>
        <div className={classes.presets}>
          {PRESETS.map(([label, fn]) => (
            <button
              key={label}
              type="button"
              className={classes.preset}
              onClick={() => pickPreset(fn)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={classes.calendar}>
          <div className={classes.calHead}>
            <IconButton
              size="small"
              onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1))}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <span className={classes.calMonth}>{`${MESES[base.getMonth()]} ${base.getFullYear()}`}</span>
            <IconButton
              size="small"
              onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1))}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </div>
          <div className={classes.grid}>
            {DIAS.map((d) => (
              <span key={d} className={classes.dayName}>{d}</span>
            ))}
            {buildDays().map((d) => {
              const k = clave(d);
              const outside = d.getMonth() !== base.getMonth();
              const isSel = k === clave(d1) || k === clave(d2);
              const isBetween = k > kMin && k < kMax;
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className={cx(classes.day, {
                    [classes.off]: outside,
                    [classes.today]: k === kToday,
                    [classes.between]: isBetween,
                    [classes.selected]: isSel,
                  })}
                  onClick={() => pickDay(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        <div className={classes.range}>
          <div className={classes.field}>
            <Typography variant="caption" color="textSecondary">Desde</Typography>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextField size="small" value={fmt(clave(d1) <= clave(d2) ? d1 : d2)} slotProps={{ input: { readOnly: true } }} />
              <TextField size="small" type="time" value={t1} onChange={(e) => setT1(e.target.value)} sx={{ width: 110 }} />
            </div>
          </div>
          <span className={classes.dash}>—</span>
          <div className={classes.field}>
            <Typography variant="caption" color="textSecondary">A</Typography>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextField size="small" value={fmt(clave(d1) <= clave(d2) ? d2 : d1)} slotProps={{ input: { readOnly: true } }} />
              <TextField size="small" type="time" value={t2} onChange={(e) => setT2(e.target.value)} sx={{ width: 110 }} />
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleApply}>Establecer fecha</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateRangePicker;
