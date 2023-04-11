import { Request, Response } from 'express';
import { z, AnyZodObject } from 'zod';
import { ExpressMiddleware } from '../types';
import { errors } from './errors';
import superjson from 'superjson';

import { AnyObject, MaybePromise, isObject, isString } from '@mmo/shared';

export type ControllerContext = { req: Request; res: Response };
export type ControllerArgs<TInput extends AnyObject = AnyObject> = {
  ctx: ControllerContext;
  input: TInput;
};
export type Controller<
  TInput extends AnyObject = AnyObject,
  TOutput extends AnyObject = AnyObject
> = (opts: ControllerArgs<TInput>) => MaybePromise<TOutput>;

const deepParse = (obj: AnyObject) => {
  const result: AnyObject = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (!isString(value)) {
      result[key] = value;
      return;
    }

    const parsed = JSON.parse(value);
    result[key] = isObject(parsed) ? deepParse(parsed) : parsed;
  });

  return result;
};
const validateInput =
  (schema: AnyZodObject, deepParseQuery?: boolean): ExpressMiddleware =>
  async (req, res, next) => {
    if (deepParseQuery) {
      try {
        req.query = deepParse(req.query);
      } catch (err) {
        throw errors.unprocessable();
      }
    }
    const result = await schema.safeParseAsync({
      ...req.params,
      ...req.body,
      ...req.query
    });
    if (!result.success) {
      throw errors.unprocessable(result.error);
    }
    Object.keys(req.body as object).forEach(key => {
      req.body[key] = result.data[key];
    });
    Object.keys(req.query).forEach(key => {
      req.query[key] = result.data[key];
    });
    Object.keys(req.params).forEach(key => {
      req.params[key] = result.data[key];
    });

    next();
  };

const handleController =
  <TInput extends AnyZodObject, TOutput extends AnyZodObject>(
    prodedure: Controller<z.infer<TInput>, z.infer<TOutput>>,
    schema?: TOutput
  ): ExpressMiddleware =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req, res, next) => {
    const input = { ...req.params, ...req.body, ...req.query };

    const result = await prodedure({ ctx: { req, res }, input });
    const statusCode = req.method === 'post' ? 201 : 200;

    if (!schema) {
      res.status(statusCode).send(superjson.stringify(result));
      return;
    }

    const validationResult = await schema.safeParseAsync(result);
    if (!validationResult.success) {
      throw errors.unexpected({ meta: validationResult.error });
    }
    res.status(statusCode).send(superjson.stringify(validationResult.data));
  };

type CreateRouteOptions<
  TInput extends AnyZodObject,
  TOutput extends AnyZodObject
> = {
  input?: TInput;
  output?: TOutput;
  controller: Controller<z.infer<TInput>, z.infer<TOutput>>;
  middlewares?: ExpressMiddleware[];
  deepParseQuery?: boolean;
};

export const createRoute = <
  TInput extends AnyZodObject,
  TOutput extends AnyZodObject
>(
  options: CreateRouteOptions<TInput, TOutput>
) => {
  const middlewares: ExpressMiddleware[] = options.middlewares ?? [];

  if (options.input) {
    middlewares.push(validateInput(options.input, options.deepParseQuery));
  }
  middlewares.push(handleController(options.controller, options.output));

  return middlewares;
};
