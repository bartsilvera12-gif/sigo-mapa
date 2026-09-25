
import { grey } from '@mui/material/colors';



const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);



export default (server, darkMode) => ({

  mode: darkMode ? 'dark' : 'light',

  background: {

    default: darkMode ? '#0C1220' : '#F7F9FB',

    paper: darkMode ? '#161E2F' : '#FFFFFF',

  },

  primary: {

    main: validatedColor(server?.attributes?.colorPrimary) || '#B51A2B',

  },

  secondary: {

    main: validatedColor(server?.attributes?.colorSecondary) || '#2E8B57',

  },

  neutral: {

    main: darkMode ? '#8A93A6' : '#6B7589',

  },

  geometry: {

    main: '#384358',

  },

  alwaysDark: {

    main: grey[900],

  },

  divider: darkMode ? 'rgba(217,225,232,.14)' : 'rgba(22,30,47,.16)',

  text: {

    primary: darkMode ? '#FFFFFF' : '#161E2F',

    secondary: darkMode ? '#8A93A6' : '#6B7589',

  },

  status: {

    moving: '#2E8B57',

    idle: '#D9A320',

    offline: '#B51A2B',

    never: '#586072',

  },

});

