import { userModel } from '../src/models/user.models';
import { build } from 'node-passlib';

export const addTestUser = async (email = 'test@mmo.fr') => {
  const password = 'azerty';

  const hashedPassword = build(
    'azerty',
    {
      rounds: 25_000,
      salt: 'test-salt',
      digest: 'sha256'
    },
    32
  );

  const user = await userModel.create({
    email,
    password: hashedPassword
  });

  return [user, password] as const;
};
