import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  static STATUS = {
    success: 'success',
    error: 'error',
    failed: 'failed',
  } as const;

  success<T extends string | Record<string, any> | Array<any>>(
    data: T,
    extractedFields?: T extends Record<string, any>
      ? Array<keyof T>
      : undefined,
  ): {
    status: (typeof ResponseService.STATUS)['success'];
    data: T | Partial<T>;
  } {
    if (
      typeof data === 'object' &&
      !Array.isArray(data) &&
      Object.keys(extractedFields).length
    ) {
      return {
        status: 'success',
        data: Object.fromEntries(
          Object.entries(data).filter(
            ([key]) =>
              !(extractedFields as Array<keyof T>).includes(key as keyof T),
          ),
        ) as T | Partial<T>,
      };
    }

    return {
      status: 'success',
      data,
    };
  }

  error(message: string): {
    status: (typeof ResponseService.STATUS)['error'];
    message: string;
  } {
    return {
      status: 'error',
      message,
    };
  }

  failed(message: string): {
    status: (typeof ResponseService.STATUS)['failed'];
    message: string;
  } {
    return {
      status: 'failed',
      message,
    };
  }
}
