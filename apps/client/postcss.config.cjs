const openProps = require('open-props');

const theme = {
  ...openProps,
  fontSize0: '.85rem',
  fontSize00: '.75rem',
  fontSize000: '.5rem',
  '--font-size-0': '.85rem',
  '--font-size-00': '.75rem',
  '--font-size-000': '.5rem'
};
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano'),
    require('postcss-scrollbar'),
    require('postcss-inset'),
    require('./scripts/postcss-jit-fix')(theme),
    require('postcss-nesting')({ noIsPseudoSelector: false }),
    require('postcss-custom-media')({ preserve: false })
  ]
};
