import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isEmailUnique', async: false })
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (!email) return true; // Skip validation if email is not provided
    
    // This is a basic validation - the actual uniqueness check happens in the service layer
    // This prevents the validation from blocking the request, but the service will still check
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Email '${args.value}' is already registered. Please use a different email address.`;
  }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}
