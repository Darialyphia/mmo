import { Request, Response, NextFunction } from 'express';
import { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export type JwtPayload = BaseJwtPayload & {
  identity: { user_id: string };
};

export type Identifier = string | Types.ObjectId;
