const UserModel = require('./user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
/**
 * Request in database for find all user
 * without password
 * @returns {Promise<[UserModel]>}
 */
exports.getUsers = async () => {
  try {
    return UserModel.find({}, '-password')
  } catch (error) {
    console.error(error);
  }
};

/**
 * Return the last seven users
 * @returns {Promise<*>}
 */
exports.getLastSevenUsers = async () => {
  // L'ordre de requète est très important,
  // tu sort pour tire et seulement ensuite tu limit à 7
  // Et seulement après tu populate.
  console.log('/last-seven');
  /**
   * La façon dont tu l'avait fait
   * tu populate TOUTE la db
   * tu limite sur les 7 users qui arrive dans la db
   * et seulement ensuite tu sort sur c'est 7, tu n'aurai jamais le bon
   * résultat et t'façon, c'était pas bon
   */
  try {
    return UserModel.find({}, '-password')
      .sort({ date_inscription: -1 })
      .limit(7)
  } catch (e) {
    console.error(e);
  }
};

/**
 * Return the user by id
 * @returns {Promise<*>}
 */
exports.getUserById = async (id) => {
  console.log('/user-by-id');
  try {
    return UserModel.find({ _id: id }, '-password')
  } catch (e) {
    console.error(e);
  }
};

/**
 * Return token after signup
 * @returns {Promise<*>}
 */
exports.signup = async (user, file) => {
  console.log('/signup');
  let existingUser;
  let hashedPassword;
  let token;
  try {
    existingUser = await UserModel.findOne({ email: user.email });
  } catch (e) {
    throw new Error('Cette utilisateur existe déja.');
  }
  if (existingUser) throw new Error('Cette utilisateur existe déja.');

  hashedPassword = await bcrypt.hash(user.password, 12);

  const createdUser = new UserModel({
    firstname: user.firstname,
    name: user.name,
    pseudo: user.pseudo,
    email: user.email,
    password: hashedPassword,
    picture: file ? file.path : user.picture,
    tabs: [],
    tutorials: [],
    news: [],
    date_inscription: new Date(),
  });

  //jwt token
  try {
    await createdUser.save();
    token = jwt.sign(
        {userId: createdUser.id, email: createdUser.email},
        process.env.JWT_KEY,
        {expiresIn: '1h'}
    );

    return data = {
      userId: createdUser.id,
      email: createdUser.email,
      token: token,
      isAdmin: createdUser.isAdmin,
      pseudo: createdUser.pseudo,
    };
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Return token after login
 * @returns {Promise<*>}
 */
exports.login = async (user) => {
  console.log('/login');
  let existingUser;
  try {
    existingUser = await UserModel.findOne({ email: user.email });
  } catch (err) {
    throw new Error("Une erreur c'est produite.", err);
  }
  if (!existingUser) throw new Error('Information invalide.');
  let isValidPassword = true;
  try {
    isValidPassword = await bcrypt.compare(
      user.password,
      existingUser.password
    );
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }

  if (!isValidPassword) throw new Error('Information invalide.');

  //jwt token
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
    return (data = {
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
      isAdmin: existingUser.isAdmin,
      pseudo: existingUser.pseudo,
    });
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }
};

/**
 * update le user et retourne les données update
 * @returns {Promise<*>}
 */
exports.updateUser = async (id, userData, file) => {
  let user;
  try {
    user = await UserModel.findById(id);
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }
  user.firstname = userData.firstname;
  user.name = userData.name;
  user.pseudo = userData.pseudo;
  user.isAdmin = userData.isAdmin
  user.email = userData.email;
  user.picture = file ? file.path : user.picture;
  try {
    return await user.save();
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }
};

/**
 * update le user et retourne les données update
 * @returns {Promise<*>}
 */
exports.updateUserPassword = async (id, userData) => {
  const { password } = userData;
  let user;
  let hashedPassword;
  try {
    user = await UserModel.findById(id);
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }
  user.password = hashedPassword;
  try {
    await user.save();
    return (data = {
      email: user.email,
    });
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }
};

/**
 * genere un token pour reinitialiser le mot de passe
 * @returns {Promise<*>}
 */
exports.forgotPassword = async (userData) => {
  // 1) get user based on post email
  let existingUser;
  try {
    existingUser = await UserModel.findOne({ email: userData.email });
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }

  if (!existingUser) throw new Error("Une erreur c'est produite.");

  // 2) Generate reset token  let token;
  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );

    return (data = {
      email: existingUser.email,
      token: token,
    });
  } catch (e) {
    throw new Error("Une erreur c'est produite.");
  }
};

/**
 * genere un token pour reinitialiser le mot de passe
 * @returns {Promise<*>}
 */
exports.resetPassword = async (token, userData) => {
  if (!token) throw new Error('Missing authorization');
  let userId;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    userId = decodedToken.userId;
  } catch (e) {
    throw new Error('Désolé le token ou les informations sont invalides.');
  }
  const { password } = userData;
  let user;
  try {
    user = await UserModel.findById(userId);
  } catch (e) {
    throw new Error('Something went wrong, could not update password user.');
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (e) {
    throw new Error('Could not update user password, please try again.');
  }
  user.password = hashedPassword;
  try {
    await user.save();
    return (data = {
      email: user.email,
    });
  } catch (e) {
    console.log(e);
  }
};
