const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const Project = require('../models/Project');
const Profile = require('../models/Profile');
const Skill = require('../models/Skill');
const Education = require('../models/Education');
const Experience = require('../models/Experience');
const projectController = require('../controllers/projectController');
const { getEntirePortfolio } = require('../controllers/portfolioController');

const createMemoryModel = (initialRecords = []) => {
  const records = initialRecords.map((record) => ({ ...record }));
  return {
    records,
    find() {
      return { sort: async () => records };
    },
    async create(record) {
      const created = { _id: `memory-${records.length + 1}`, ...record };
      records.push(created);
      return created;
    },
    async findByIdAndUpdate(id, update) {
      const record = records.find((item) => item._id === id);
      if (!record) return null;
      Object.assign(record, update);
      return record;
    },
  };
};

async function run() {
  const projects = createMemoryModel([{ _id: 'existing', title: 'Legacy project', order: 1 }]);
  const profile = { name: 'Sajith' };
  const skills = [{ name: 'JavaScript' }];
  const education = [{ degree: 'Diploma' }];
  const experience = [{ role: 'Developer' }];

  Project.find = projects.find.bind(projects);
  Project.create = projects.create.bind(projects);
  Project.findByIdAndUpdate = projects.findByIdAndUpdate.bind(projects);
  Profile.findOne = async () => profile;
  Skill.find = () => ({ sort: async () => skills });
  Education.find = () => ({ sort: async () => education });
  Experience.find = () => ({ sort: async () => experience });

  const app = express();
  app.use(express.json());
  app.post('/api/admin/projects', projectController.createProject);
  app.put('/api/admin/projects/:id', projectController.updateProject);
  app.get('/api/portfolio', getEntirePortfolio);

  const allowedDescription = 'a'.repeat(200);
  const created = await request(app)
    .post('/api/admin/projects')
    .send({ title: 'Dashboard project', description: allowedDescription, order: '2' });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.description.length, 200);

  const tooLongDescription = 'a'.repeat(201);
  const rejectedCreate = await request(app)
    .post('/api/admin/projects')
    .send({ title: 'Too long project', description: tooLongDescription });
  assert.equal(rejectedCreate.status, 400);
  assert.equal(projects.records.length, 2);

  let publicPortfolio = await request(app).get('/api/portfolio');
  assert.equal(publicPortfolio.status, 200);
  assert.deepEqual(publicPortfolio.body.data.projects.map((project) => project.title), [
    'Legacy project',
    'Dashboard project',
  ]);
  assert.equal(publicPortfolio.body.data.profile.name, 'Sajith');
  assert.equal(publicPortfolio.body.data.skills[0].name, 'JavaScript');
  assert.equal(publicPortfolio.body.data.education[0].degree, 'Diploma');
  assert.equal(publicPortfolio.body.data.experience[0].role, 'Developer');

  const projectId = created.body.data._id;
  const updated = await request(app)
    .put(`/api/admin/projects/${projectId}`)
    .send({ description: 'Updated in admin' });
  assert.equal(updated.status, 200);

  const rejectedUpdate = await request(app)
    .put(`/api/admin/projects/${projectId}`)
    .send({ description: tooLongDescription });
  assert.equal(rejectedUpdate.status, 400);

  publicPortfolio = await request(app).get('/api/portfolio');
  const updatedProject = publicPortfolio.body.data.projects.find((project) => project._id === projectId);
  assert.equal(updatedProject.description, 'Updated in admin');
  assert.equal(projects.records.length, 2);

  console.log('Portfolio sync tests passed: admin create/edit results appear in the public portfolio API.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
