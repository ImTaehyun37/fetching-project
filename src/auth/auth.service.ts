import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/User.entity';
import { Brand } from '../entities/Brand.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
        return 'USER_NOT_FOUND';
    }
    if (!(await bcrypt.compare(pass, user.password))) {
        return 'WRONG_PASSWORD';
    }
    const { password, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { 
        username: user.username, 
        sub: user.id, 
        role: user.role,
        brandId: user.brand_id 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(body: any): Promise<User> {
    const { username, password, role, brand_id } = body;

    const existing = await this.usersRepository.findOne({ where: { username } });
    if (existing) {
        throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = this.usersRepository.create({
        username,
        password: hashedPassword,
        role: role as UserRole || UserRole.USER,
        brand_id: brand_id ? Number(brand_id) : null,
    });

    return this.usersRepository.save(newUser);
  }

  // Helper for UI select
  async getAllBrands() {
      return this.brandRepository.find();
  }
}
