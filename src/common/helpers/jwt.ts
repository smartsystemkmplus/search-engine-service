import * as jwtgen from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
class TokenManager {
  private key: string | undefined;

  constructor(configService: ConfigService) {
    this.key = configService.getOrThrow('JWT_KEY');
  }

  mint(data: TokenData): string {
    if (!this.key) {
      throw new Error('JWT_KEY is not defined.');
    }

    return jwtgen.sign(
      { ...data, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5 },
      this.key,
    );
  }

  check(token: string): TokenData {
    if (!this.key) {
      throw new Error('JWT_KEY is not defined.');
    }

    try {
      const decoded = jwtgen.verify(token, this.key);
      return decoded as TokenData;
    } catch (err) {
      throw new Error('JWT verification failed: ' + err.message);
    }
  }
}

export default TokenManager;

interface TokenData {
  user_id: number;
  exp: number;
  uid: string;
}
