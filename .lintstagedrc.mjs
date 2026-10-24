export default {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.html': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix', 'prettier --write'],
  '*.{json,yaml,yml,md}': ['prettier --write'],
};
