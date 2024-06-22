import { HttpException, ValidationError } from '@nestjs/common';

export const validationError = (errors: ValidationError[]) => {
  const collection = new Map();

  errors.map(({ property, constraints, value }) => {
    const arrayFromConstraints = Object.values(constraints);
    collection.set(
      property,
      value === undefined ? `Заполните это поле` : arrayFromConstraints.at(-1),
    );
  });

  return new HttpException(
    {
      status: 'failed',
      errors: Object.fromEntries(collection),
    },
    400,
  );
};
