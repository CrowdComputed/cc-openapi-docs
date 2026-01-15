require('dotenv').config();

module.exports = {
  $schema: 'https://docs.tolgee.io/cli-schema.json',
  projectId: 2,
  format: 'JSON_TOLGEE',
  patterns: ['./src/**/*.ts?(x)'],
  push: {
    filesTemplate: './message/{languageTag}.json',
    language: ['en', 'zh'],
  },
  pull: {
    path: './message',
    minify: true,
    format: 'JSON_TOLGEE',
    filesTemplate: './message/{languageTag}.json',
    language: ['en', 'zh'],
    filePattern: '{languageTag}.*.json',
  },
  apiKey: process.env.NEXT_PUBLIC_TOLGEE_API_KEY,
  apiUrl: process.env.NEXT_PUBLIC_TOLGEE_API_URL,
};
