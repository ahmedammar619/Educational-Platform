import { Injectable } from '@nestjs/common';
import { COUNTRY_CODES, CountryCode } from '../constants/country-codes';

@Injectable()
export class CountryCodesService {
  getAllCountryCodes(): CountryCode[] {
    return COUNTRY_CODES;
  }

  getCountryCodeByCode(code: string): CountryCode | undefined {
    return COUNTRY_CODES.find(country => country.code === code);
  }

  searchCountryCodes(query: string): CountryCode[] {
    const lowerQuery = query.toLowerCase();
    return COUNTRY_CODES.filter(country => 
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.includes(query)
    );
  }
}
