import path from 'path';
import crypto from 'crypto';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import {
  S3Client,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
declare module 'express' {
  interface Request {
    fileValidationError?: string;
  }
}

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {}
  // S3 bucket configuration
  s3Config = {
    endpoint: this.configService.getOrThrow('DO_SPACES_ENDPOINT') || '',
    region: this.configService.getOrThrow('DO_SPACES_REGION') || '',
    credentials: {
      accessKeyId:
        this.configService.getOrThrow('DO_SPACES_ACCESS_KEY_ID') || '',
      secretAccessKey:
        this.configService.getOrThrow('DO_SPACES_SECRET_ACCESS_KEY') || '',
    },
  };

  // Define a custom property for validation errors in the Request object

  // S3 client initialization
  s3 = new S3Client(this.s3Config);

  /**
   * File filter
   *
   * @param req Request
   * @param file File
   * @param cb Callback
   */
  filter = (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.pdf',
      '.docx',
      '.doc',
      '.xlsx',
      '.csv',
      '.txt',
      '.mp4',
    ];
    const imageExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname);
    const size = file.size;
    const isImage = imageExtensions.includes(ext.toLowerCase());
    if (allowedExtensions.includes(ext.toLowerCase())) {
      if (isImage) {
        if (size > 5e6) {
          const err = 'Image exceeds 5 mb';
          req.fileValidationError = err;
          cb(new Error(err), false);
        }
      } else {
        if (size > 500e8) {
          const err = 'File exceeds 50000 mb';
          req.fileValidationError = err;
          cb(new Error(err), false);
        }
      }
      cb(null, true);
    } else {
      const err = 'File extension is not allowed!';
      req.fileValidationError = err;
      cb(new Error(err), false);
    }
  };

  /**
   * Generate random key
   *
   * @param req Request
   * @param file File
   * @param cb Callback
   */
  generateKey = (req: Request, file: Express.Multer.File, cb: any) => {
    let path = 'files/';
    const subPath = req.body.path;

    if (subPath && subPath !== '') {
      path = path + subPath.trim() + '/';
    }

    crypto.randomBytes(16, (err, raw) => {
      cb(err, err ? undefined : path + raw.toString('hex'));
    });
  };

  // Storage settings
  storage = multerS3({
    s3: this.s3,
    bucket: this.configService.getOrThrow('DO_SPACES_BUCKET'),
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: this.generateKey,
    acl: 'private',
  });

  /**
   * Upload file
   */
  uploadFile = multer({
    storage: this.storage,
    fileFilter: this.filter,
  }).single('file');

  uploadFileMultiple = multer({
    storage: this.storage,
    fileFilter: this.filter,
  }).array('file');

  /**
   * Delete file(s) on the bucket
   *
   * @param keys Array or single key
   */
  deleteObject = async (keys: string | string[]) => {
    if (Array.isArray(keys)) {
      const objectList = keys.map((e) => ({ Key: e }));

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Delete: {
          Objects: objectList,
        },
      });

      try {
        const data = await this.s3.send(deleteCommand);
        console.log('DO Spaces multiple deletion: ', data);
      } catch (err) {
        console.error('Error', err);
      }
    } else {
      const deleteObjects = Array.isArray(keys)
        ? keys.map((key) => ({ Key: key }))
        : [{ Key: keys }];

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Delete: {
          Objects: deleteObjects,
        },
      });

      try {
        const data = await this.s3.send(deleteCommand);
        console.log('DO Spaces single deletion: ', data);
        return data;
      } catch (err) {
        console.error('Error', err);
      }
    }
  };

  // MIDDLEWARE MULTIPART
  multerMiddleware = multer();
  // MIDDLEWARE EXCEL
  // const multerExcel = multer();
  excelFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: (error: string | null, acceptFile: boolean) => void,
  ) => {
    if (
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheetml')
    ) {
      cb(null, true);
    } else {
      cb('Please upload only excel file.', false);
    }
  };
  excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  uploadExcelFile = multer({
    storage: this.excelStorage,
    fileFilter: this.excelFilter,
  }).single('file');

  uploadToServer = multer({
    storage: this.excelStorage,
    fileFilter: this.filter,
  }).single('file');

  /**
   * Retrieve file
   */

  retrieveFile = async (key: string) => {
    try {
      const url = await getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: key,
        }),
      );

      return { success: true, url };
    } catch (error) {
      return { success: false, error };
    }
  };

  getLink = async (
    fromDBLinkField: string | null,
    type = 'user',
    ACL = 'private',
  ): Promise<string> => {
    const userDefault =
      'https://smartkmsystem.sgp1.digitaloceanspaces.com/files/default-user.jpeg';
    const imageDefault =
      'https://smartkmsystem.sgp1.digitaloceanspaces.com/files/default.jpg';

    if (!fromDBLinkField) {
      switch (type) {
        case 'user':
          return userDefault;
        default:
          return imageDefault;
      }
    }

    if (ACL === 'public-read') {
      return `https://${this.configService.getOrThrow(
        'DO_SPACES_BUCKET',
      )}.${this.configService.getOrThrow(
        'DO_SPACES_ENDPOINT',
      )}/${fromDBLinkField}`;
    }

    if (ACL === 'private') {
      const retrivedFile = await this.retrieveFile(fromDBLinkField);
      if (retrivedFile.success) {
        return retrivedFile.url;
      }
      switch (type) {
        case 'user':
          return userDefault;
        default:
          return imageDefault;
      }
    }
  };
}
