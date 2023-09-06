import ClientError from './ClientError';

class NotFoundError extends ClientError {
  constructor(message: string, errors?: any) {
    super(message, 404, errors);
    this.name = 'NotFoundError';
  }
}

export default NotFoundError;
