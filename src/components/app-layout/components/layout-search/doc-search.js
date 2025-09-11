import '@docsearch/css';
import docsearch from '@docsearch/js';

export function init(container) {
  docsearch({
    container,
    indexName: 'v5 Documentation',
    appId: 'QP0FPVNIF3',
    apiKey: 'efae11e98934f2fd2cd6c00faf79cdbd',
  });
}
