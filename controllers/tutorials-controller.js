const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const Tutorials = require('../models/tutorials');
const User = require('../models/user');
const mongoose = require('mongoose');
const fs = require('fs');

const getTutorialById = async (req, res, next) => {
  const tutorialsId = req.params.tuid; //{pid: p1}
  let tutorials;
  try {
    tutorials = await Tutorials.findById(tutorialsId)
      .populate({
        path: 'type',
        select: 'name',
      })
      .populate({
        path: 'difficulty',
        select: 'name',
      })
      .populate({
        path: 'instrument',
        select: 'name',
      });
  } catch (e) {
    const error = new HttpError(
      'Something went wrong, could not find a tutorials.',
      500
    );
    return next(error);
  }
  if (!tutorials) {
    const error = new HttpError(
      'Could not find tutorials for the provided id.',
      404
    );
    return next(error);
  }
  res.json({ tutorials: tutorials.toObject({ getters: true }) }); //{id: place} => { place: place}
};
const getTutorials = async (req, res, next) => {
  let tutorials;
  try {
    tutorials = await Tutorials.find({})
      .populate({
        path: 'type',
        select: 'name',
      })
      .populate({
        path: 'difficulty',
        select: 'name',
      })
      .populate({
        path: 'instrument',
        select: 'name',
      });
  } catch (e) {
    console.log(e);
  }
  if (!tutorials || tutorials.length === 0) {
    return next(
      new HttpError('Could not find tutorials for the provided user id.', 404)
    );
  }
  res.json({
    tutorials: tutorials.map((tutorial) =>
      tutorial.toObject({ getters: true })
    ),
  }); //{creactor: place} => { place: place}
};
const getLastTutorials = async (req, res, next) => {
  let tutorials;
  try {
    tutorials = await Tutorials.find({}).limit(4);
  } catch (e) {
    console.log(e);
  }
  if (!tutorials || tutorials.length === 0) {
    return next(
      new HttpError('Could not find tutorials for the provided user id.', 404)
    );
  }
  res.json({
    tutorials: tutorials.map((tutorial) =>
      tutorial.toObject({ getters: true })
    ),
  }); //{creactor: place} => { place: place}
};

const getProjectsByUserId = async (req, res, next) => {
  const userId = req.params.uid; //{pid: p1}

  let projects;
  try {
    projects = await Project.find({ creator: userId });
  } catch (e) {
    const error = new HttpError(
      'Fetching projects failed, please try again.',
      500
    );
    return next(error);
  }
  if (!projects || projects.length === 0) {
    return next(
      new HttpError('Could not find projects for the provided user id.', 404)
    );
  }
  res.json({
    projects: projects.map((project) => project.toObject({ getters: true })),
  }); //{creactor: place} => { place: place}
};

const createTutorials = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid input passed, please check your data.', 422)
    );
  }
  const { name, chanteur, type, difficulty, instrument, link, tab } = req.body;
  // const title = req.body.title
  const createdTutorials = new Tutorials({
    name,
    chanteur,
    type,
    difficulty,
    instrument,
    link,
    tab,
    date: new Date(),
    creator: req.userData.userId,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (e) {
    const error = new HttpError(
      'Creating project failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdTutorials.save({ session: session });
    user.tutorials.push(createdTutorials);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    console.log(error);
  }

  res.status(201).json({ tutorials: createdTutorials });
};

const updateProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      'Invalid input passed, please check your data.',
      422
    );
    return next(error);
  }
  const { title, description, technos, lien, repository } = req.body;
  const projectId = req.params.pid; //{pid: p1}

  let project;
  try {
    project = await Project.findById(projectId);
  } catch (e) {
    const error = new HttpError(
      'Something went wrong, could not update project.',
      500
    );
    return next(error);
  }

  if (project.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to edit this project.',
      401
    );
    return next(error);
  }
  project.title = title;
  project.description = description;
  project.technos = technos;
  project.lien = lien;
  project.repository = repository;

  try {
    await project.save();
  } catch (e) {
    const error = new HttpError(
      'Something went wrong, could not update project.',
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ project: (await project).toObject({ getters: true }) });
};

const deleteProject = async (req, res, next) => {
  const projectId = req.params.pid; //{pid: p1}
  let project;
  try {
    project = await Project.findById(projectId).populate('creator');
  } catch (e) {
    const error = new HttpError(
      'Something went wrong, could not delete project.',
      500
    );
    return next(error);
  }

  if (!project) {
    const error = new HttpError('Could not find project.', 404);
    return next(error);
  }

  if (project.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this project.',
      401
    );
    return next(error);
  }

  const imagePath = project.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await project.remove({ session: session });
    project.creator.projects.pull(project);
    await project.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete project.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: 'Project deleted.' });
};

exports.getTutorialById = getTutorialById;
exports.getTutorials = getTutorials;
exports.getLastTutorials = getLastTutorials;
exports.getProjectsByUserId = getProjectsByUserId;
exports.createTutorials = createTutorials;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
