import { config } from '../config';
import { ExpressMiddleware, JwtPayload } from '../types';
import { errors } from '../utils/errors';

import jwt from 'jsonwebtoken';

export const isAuth: ExpressMiddleware = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    throw errors.unauthorized();
  }

  const token = authHeader.split(' ')[1];
  let decodedtoken;

  try {
    decodedtoken = jwt.verify(token, config.JWT.SIGNATURE) as JwtPayload;
  } catch (err) {
    throw errors.unauthorized();
  }

  if (!decodedtoken) {
    throw errors.unauthorized();
  }

  req.userId = decodedtoken.identity.user_id;
  next();
};
