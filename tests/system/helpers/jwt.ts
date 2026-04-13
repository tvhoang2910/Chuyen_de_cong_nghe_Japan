import crypto from 'node:crypto';

export type JwtRole = 'USER' | 'ADMIN' | 'CONTRIBUTOR';

export type JwtIdentity = {
  userId: number;
  email: string;
  role: JwtRole;
};

type JwtPayload = {
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  userId: number;
  role: JwtRole;
};

const encodeBase64Url = (input: Buffer | string): string => {
  const source = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return source.toString('base64url');
};

const createSigningInput = (payload: JwtPayload): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
};

export const signHs256Jwt = (
  identity: JwtIdentity,
  secretBase64: string,
  issuer = 'auth_service',
  expiresInSeconds = 3600,
): string => {
  if (!secretBase64 || !secretBase64.trim()) {
    throw new Error('Missing JWT secret for E2E test signing. Set JWT_SECRET or E2E_JWT_SECRET_BASE64.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    iss: issuer,
    sub: identity.email,
    iat: nowSeconds - 5,
    exp: nowSeconds + expiresInSeconds,
    userId: identity.userId,
    role: identity.role,
  };

  const signingInput = createSigningInput(payload);
  const key = Buffer.from(secretBase64, 'base64');
  const signature = crypto.createHmac('sha256', key).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
};
