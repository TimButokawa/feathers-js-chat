'use strict';

const process = require('./process');

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;
const restrictToSender = require('./restrict-to-sender');

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [],
  create: [process()],
  update: [
    hooks.remove('sentBy'),
    restrictToSender()
  ],
  patch: [
    hooks.remove('sentBy'),
    restrictToSender()
  ],
  remove: []
};

const options = {
  service: 'users',
  field: 'sentBy'
};

exports.after = {
  all: [],
  find: [hooks.populate('sentBy', options)],
  get: [hooks.populate('sentBy', options)],
  create: [hooks.populate('sentBy', options)],
  update: [],
  patch: [],
  remove: []
};
