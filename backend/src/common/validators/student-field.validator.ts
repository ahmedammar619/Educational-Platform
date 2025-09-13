import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Role } from '../enums/role.enum';

export function IsStudentField(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStudentField',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          // Only validate if role is Student, otherwise skip validation
          return obj.role === Role.Student;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should not exist for non-student roles`;
        },
      },
    });
  };
}
