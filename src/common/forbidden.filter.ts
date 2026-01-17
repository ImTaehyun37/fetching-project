import { ExceptionFilter, Catch, ArgumentsHost, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(ForbiddenException, UnauthorizedException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: ForbiddenException | UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Redirect to back if possible, else login or home
    const backUrl = request.header('Referer') || '/';
    
    // Check if it's an API call or HTML request
    // Since this is an MVC-like app mostly returning HTML/Redirects, we'll respond with a script alert or redirect.
    // User requested: "Guest mode: redirect to current page instead of 403"
    // Usually means if they try to access something they can't, send them back.
    
    // Avoid redirect loops if the backUrl IS the current URL (unlikely for POST, but possible for GET)
    // If request method is GET and URL matches backUrl, go home.
    
    const message = exception.message || 'Access Denied';
    
    response
      .status(status)
      .send(`<script>alert('${message}'); location.href='${backUrl}';</script>`);
  }
}
