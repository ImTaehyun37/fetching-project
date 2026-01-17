import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let data = null;
          if (request && request.cookies) {
            data = request.cookies['jwt'];
          }
          return data;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: 'secretKey', // Match AuthModule secret
    });
  }

  async validate(payload: any) {
    return { 
        userId: payload.sub, 
        username: payload.username, 
        role: payload.role,
        brandId: payload.brandId 
    };
  }
}
