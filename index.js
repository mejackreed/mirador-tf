import React from 'react';
import Mirador from 'mirador/dist/es/src/index.js';
import TensorFlowTool from './TensorFlowTool';

Mirador.viewer({
  id: 'mirador',
  manifests: {
    'https://purl.stanford.edu/dq881jb6359/iiif/manifest': {},
    'https://purl.stanford.edu/hg676jb4964/iiif/manifest': {},
    'https://cdm16453.contentdm.oclc.org/iiif/info/p15426coll7/15435/manifest.json': {},
    'https://cdm16079.contentdm.oclc.org/iiif/info/p16079coll32/391570/manifest.json': {},
    'https://cdm16876.contentdm.oclc.org/iiif/info/p16876coll1/8491/manifest.json': {}
  },
  window: {
    defaultSideBarPanel: 'annotations',
    sideBarOpenByDefault: true,
  },
  windows: [
    {
      loadedManifest: 'https://purl.stanford.edu/hg676jb4964/iiif/manifest'
    }
  ]
}, [
  TensorFlowTool
]);
