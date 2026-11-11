const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', '..', 'portfolio-cms.js'), 'utf8');

const createNode = () => ({
  innerHTML: '',
  textContent: '',
  style: {},
  attributes: {},
  childNodes: [],
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
  removeAttribute(name) {
    delete this.attributes[name];
  },
  prepend(node) {
    this.prepended = node;
  },
});

async function renderWith(data, fetchFails = false) {
  const nodes = {
    projGrid: createNode(),
    timelineBox: createNode(),
    bento: createNode(),
  };
  nodes.projGrid.innerHTML = 'built-in project cards';
  nodes.bento.innerHTML = 'built-in skills';
  nodes.timelineBox.innerHTML = 'built-in timeline';
  const status = createNode();
  const wrap = createNode();
  const document = {
    getElementById(id) {
      return nodes[id] || (id === 'portfolioCmsStatus' ? status : null);
    },
    createElement() {
      return createNode();
    },
    querySelector(selector) {
      if (selector === '#arsenal .bento') return nodes.bento;
      if (selector === '#projects .wrap') return wrap;
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const context = {
    document,
    location: { hostname: '127.0.0.1', port: '5500', origin: 'http://127.0.0.1:5500', href: 'http://127.0.0.1:5500/' },
    Node: { TEXT_NODE: 3 },
    URL,
    fetch: async () => {
      if (fetchFails) throw new Error('Backend is unavailable.');
      return { ok: true, json: async () => ({ success: true, data }) };
    },
    console: { error() {} },
  };
  vm.runInNewContext(source, context);
  await new Promise((resolve) => setImmediate(resolve));
  return { nodes, status, wrap };
}

async function run() {
  const empty = await renderWith({
    profile: null,
    projects: [],
    skills: [],
    education: [],
    experience: [],
  });
  assert.match(empty.nodes.projGrid.innerHTML, /No projects have been published/);
  assert.match(empty.nodes.bento.innerHTML, /No skills have been added/);
  assert.match(empty.nodes.timelineBox.innerHTML, /No education or experience/);
  assert.match(empty.status.textContent, /Backend connected/);
  assert.notEqual(empty.nodes.projGrid.innerHTML, 'built-in project cards');

  const offline = await renderWith({}, true);
  assert.match(offline.nodes.projGrid.innerHTML, /backend is not connected/);
  assert.doesNotMatch(offline.nodes.projGrid.innerHTML, /built-in project cards/);
  assert.equal(offline.nodes.projGrid.hidden, false);
  assert.match(offline.status.textContent, /Backend not connected/);
  assert.equal(offline.status.attributes['data-state'], 'error');

  const populated = await renderWith({
    profile: { name: 'Sajith' },
    projects: [{
      title: '<Business Web>',
      description: 'Portfolio project',
      category: 'frontend',
      technologies: ['HTML'],
      imageUrl: '/uploads/project.jpg',
      liveUrl: 'https://example.com',
      githubUrl: '#contact',
      isFeatured: false,
    }],
    skills: [{ name: 'JavaScript', category: 'Frontend' }],
    education: [{ institution: 'College', degree: 'Diploma', order: 1 }],
    experience: [],
  });
  assert.match(populated.nodes.projGrid.innerHTML, /&lt;Business Web&gt;/);
  assert.match(populated.nodes.projGrid.innerHTML, /http:\/\/localhost:5000\/uploads\/project.jpg/);
  assert.doesNotMatch(populated.nodes.projGrid.innerHTML, /href="#contact"/);
  assert.match(populated.nodes.bento.innerHTML, /JavaScript/);
  assert.match(populated.nodes.timelineBox.innerHTML, /Diploma/);
  assert.match(populated.status.textContent, /Backend connected/);

  console.log('Portfolio CMS tests passed: MongoDB results replace hardcoded content, including empty collections.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
