import { Response } from 'express';
import ClientError from './ClientError';

export const resErrorHandler = (res: Response, error: any) => {
  if (error.code === 'ECONNREFUSED') {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: 'service unavailable',
      dev: error,
    });
  }

  if (error?.parent?.code === 'ER_DATA_TOO_LONG') {
    return res.status(400).json({
      status: false,
      message: error?.parent?.sqlMessage,
      dev: error,
    });
  }

  if (error instanceof ClientError) {
    const response = {
      success: false,
      message: error.message,
      error: error.errors,
    };
    return res.status(error.statusCode).json(response);
  }

  if (error.response) {
    return res.status(error.response.status).json(error.response.data);
  }

  // Server ERROR!
  console.log(error);
  console.log(error.message);
  const response = {
    success: false,
    message: 'Maaf, terjadi kegagalan pada server kami.',
    dev: error,
  };
  return res.status(500).json(response);
};

export const resSuccessHandler = (
  res: Response,
  data: any,
  message = 'success',
  code = 200,
) => {
  const response = {
    success: true,
    data,
    message: message,
    code,
  };
  return res.status(code).send(response);
};
