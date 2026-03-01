module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:prettier/recommended'],
  rules: {
    'linebreak-style': 'off',
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
