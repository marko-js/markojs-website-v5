import '@docsearch/css';
import docsearch from '@docsearch/js';

export function init(container) {
  docsearch({
    container,
    indexName: 'markojs',
    appId: 'GB0QQV5RQM',
    apiKey: '82f1b630f11e1afa4767f051af953a28',
  });
}
