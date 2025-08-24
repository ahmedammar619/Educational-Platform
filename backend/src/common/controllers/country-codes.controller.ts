import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CountryCodesService } from '../services/country-codes.service';
import { CountryCode } from '../constants/country-codes';

@ApiTags('Country Codes')
@Controller('country-codes')
export class CountryCodesController {
  constructor(private readonly countryCodesService: CountryCodesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all country codes' })
  @ApiResponse({
    status: 200,
    description: 'List of all country codes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          flag: { type: 'string' }
        }
      }
    }
  })
  getAllCountryCodes(): CountryCode[] {
    return this.countryCodesService.getAllCountryCodes();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search country codes by name or code' })
  @ApiResponse({
    status: 200,
    description: 'Filtered list of country codes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          flag: { type: 'string' }
        }
      }
    }
  })
  searchCountryCodes(@Query('q') query: string): CountryCode[] {
    return this.countryCodesService.searchCountryCodes(query);
  }
}
