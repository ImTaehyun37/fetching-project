import { Controller, Get, Post, Body, Res, UseGuards, Request, Render } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Template } from '../common/Template';
import { UserRole } from '../entities/User.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  getLoginPage(@Res() response: Response) {
    // We'll create a simple HTML form here or use Template
    const html = Template.HTML('Login', '', `
        <div style="max-width:300px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
            <h2>Login</h2>
            <form action="/auth/login" method="post">
                <p><input type="text" name="username" placeholder="Username" required style="width:100%; padding:8px;"></p>
                <p><input type="password" name="password" placeholder="Password" required style="width:100%; padding:8px;"></p>
                <p><button type="submit" style="width:100%; padding:10px; background:#333; color:white; border:none;">Login</button></p>
            </form>
            <p><a href="/auth/register">No account? Register</a></p>
        </div>
    `, '');
    response.send(html);
  }

  @Post('login')
  async login(@Body() body: any, @Res() response: Response) {
      const result = await this.authService.validateUser(body.username, body.password);
      
      if (result === 'USER_NOT_FOUND') {
          return response.send(`<script>alert('가입되지 않은 사용자 입니다.'); location.href='/auth/login';</script>`);
      }
      
      if (result === 'WRONG_PASSWORD') {
          return response.send(`<script>alert('비밀번호가 틀렸습니다.'); location.href='/auth/login';</script>`);
      }
      
      const { access_token } = await this.authService.login(result);
      
      // Set Cookie
      response.cookie('jwt', access_token, { httpOnly: true });
      response.redirect('/');
  }

  @Get('register')
  async getRegisterPage(@Res() response: Response) {
      const brands = await this.authService.getAllBrands();
      const brandOptions = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

      const html = Template.HTML('Register', '', `
        <div style="max-width:300px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
            <h2>Register</h2>
            <form action="/auth/register" method="post">
                <p><input type="text" name="username" placeholder="Username" required style="width:100%; padding:8px;"></p>
                <p><input type="password" name="password" placeholder="Password" required style="width:100%; padding:8px;"></p>
                <p>
                    <label>Role:</label>
                    <select name="role" id="role-select" onchange="toggleBrand(this.value)" style="width:100%; padding:8px;">
                        <option value="${UserRole.USER}">User</option>
                        <option value="${UserRole.SELLER}">Seller</option>
                        <option value="${UserRole.ADMIN}">Admin</option>
                    </select>
                </p>
                <div id="brand-group" style="display:none;">
                    <label>Brand (Seller only):</label>
                    <select name="brand_id" style="width:100%; padding:8px;">
                        <option value="">Select Brand</option>
                        ${brandOptions}
                    </select>
                </div>
                <p><button type="submit" style="width:100%; padding:10px; background:#333; color:white; border:none;">Register</button></p>
            </form>
            <p><a href="/auth/login">Already have an account? Login</a></p>
        </div>
        <script>
            function toggleBrand(role) {
                const group = document.getElementById('brand-group');
                if (role === '${UserRole.SELLER}') {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            }
        </script>
    `, '');
    response.send(html);
  }

  @Post('register')
  async register(@Body() body: any, @Res() response: Response) {
      await this.authService.register(body);
      response.redirect('/auth/login');
  }

  @Get('logout')
  logout(@Res() response: Response) {
      response.clearCookie('jwt');
      response.redirect('/');
  }
}
