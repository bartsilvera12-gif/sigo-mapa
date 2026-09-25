
export default {

  MuiUseMediaQuery: {

    defaultProps: {

      noSsr: true,

    },

  },

  MuiOutlinedInput: {

    styleOverrides: {

      root: ({ theme }) => ({

        backgroundColor: theme.palette.background.default,

        borderRadius: 10,

      }),

    },

  },

  MuiButton: {

    styleOverrides: {

      root: {

        borderRadius: 10,

        paddingLeft: 20,

        paddingRight: 20,

      },

      sizeMedium: {

        height: '40px',

      },

    },

  },

  MuiFormControl: {

    defaultProps: {

      size: 'small',

    },

  },

  MuiSnackbar: {

    defaultProps: {

      anchorOrigin: {

        vertical: 'bottom',

        horizontal: 'center',

      },

    },

  },

  MuiTooltip: {

    defaultProps: {

      enterDelay: 500,

      enterNextDelay: 500,

    },

  },

  MuiTableCell: {

    styleOverrides: {

      root: ({ theme }) => ({

        padding: '12px 16px',

        '@media print': {

          color: theme.palette.alwaysDark.main,

        },

      }),

    },

  },

  MuiPaper: {

    styleOverrides: {

      root: {

        borderRadius: 14,

      },

    },

  },

  MuiCard: {

    styleOverrides: {

      root: {

        borderRadius: 14,

        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',

      },

    },

  },

  MuiChip: {

    styleOverrides: {

      root: {

        borderRadius: 8,

      },

    },

  },

  MuiDialog: {

    styleOverrides: {

      paper: {

        borderRadius: 16,

      },

    },

  },

};

